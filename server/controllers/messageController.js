import User from "../models/User.js";
import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Get all users excluding the current user

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: userId },
    }).select("-password");

    const unseenMessages = {};

    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

    // Wait for all users' message queries to finish
    await Promise.all(promises);

    res.json({
      success: true,
      users: filteredUsers,
      unseenMessages,
    });
  } catch (error) {
    console.error("Error fetching users for sidebar:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get messages for selected user
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: selectedUserId } = req.params;

    const limit = Math.min(parseInt(req.query.limit) || 30, 50);
    const before = req.query.before;

    let cursorDate = null;

    // If a cursor was provided, find that message first
    if (before) {
      const cursorMessage = await Message.findById(before).select("createdAt");

      if (!cursorMessage) {
        return res.status(400).json({
          success: false,
          message: "Invalid cursor",
        });
      }

      cursorDate = cursorMessage.createdAt;
    }

    const query = {
      $or: [
        { senderId: userId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: userId },
      ],
    };

    // Only get messages older than the cursor
    if (cursorDate) {
      query.createdAt = { $lt: cursorDate };
    }

    // Get newest messages first
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    // Check whether more older messages exist
    const hasMore = messages.length > limit;

    // Remove the extra message used to determine hasMore
    if (hasMore) {
      messages.pop();
    }

    // React expects oldest → newest
    messages.reverse();

    // Mark received messages as seen
    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: userId,
        seen: false,
      },
      {
        $set: { seen: true },
      },
    );

    res.json({
      success: true,
      messages,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// mark individual message as seen
export const markMessageSee = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true, message: "Message marked as seen" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.error("Error marking message as seen:", error);
  }
};

// send message to selected user

export const sendMessage = async (req, res) => {
  try {
    const { text = "", image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // logic to handle image upload and get imageUrl
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl || "",
    });

    // emit the new message to the receiver
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.json({
      success: true,
      message: "Message sent successfully",
      newMessage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.error("Error sending message:", error);
  }
};
