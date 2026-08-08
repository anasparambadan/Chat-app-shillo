// Signup User

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { response } from "express";
import { generateToken } from "../lib/utils.js";

// signup user

export const signup = async (req, res) => {
  const { fullName, email, password, profilePic, bio } = req.body;
  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    res.json({
      success: true,
      userData: newUser,
      token,
      message: "User registered successfully.",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: "An error occurred during registration.",
    });
  }
};

// login User

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(userData._id);

    res.json({
      success: true,
      userData,
      token,
      message: "User logged in successfully.",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: "An error occurred during login.",
    });
  }
};

// check user authenticated

export const checkAuth = (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: "User is authenticated.",
  });
};

// update user profile

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    }
    else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      ); 
    }
    response.json({
      success: true,
      updatedUser,
      message: "User profile updated successfully.",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: "An error occurred while updating the profile.",
    });
  }
};
