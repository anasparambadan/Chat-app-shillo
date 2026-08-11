import express from "express";
import "dotenv/config";
import http from "http";
import cors from "cors";
import connectDB from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// initialise Socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

// store online users
export const userSocketMap = {}; // {userID: socketId}

// socket.io connection handler

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // EMIT ONLINE USERS TO ALL CONNECTED CLIENTS

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// middle wares

app.use(cors());
app.use(express.json({ limit: "4mb" }));

// routers

app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// connect to database
await connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
