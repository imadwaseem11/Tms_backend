import { response } from "express";
import User from "../models/user.js";
import { createJWT, createToken } from "../utils/index.js";
import Notice from "../models/notification.js";
import nodemailer from 'nodemailer'
import UserOTPVerification from "../models/UserOTPVerification.js";

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'mohammed2000imad@gmail.com',
    pass: 'hmrc viuc xyxg skyz',
  },
});

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if an OTP already exists for the user
    const existingOTPVerification = await UserOTPVerification.findOne({ userId: user._id });

    if (existingOTPVerification) {
      // Update the existing OTP record
      existingOTPVerification.otp = otp;
      existingOTPVerification.createdAt = Date.now();
      existingOTPVerification.expiresAt = Date.now() + 3600000; // 1 hour
      await existingOTPVerification.save();
    } else {
      // Create a new OTP record if none exists
      const otpVerification = new UserOTPVerification({
        userId: user._id,
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000, // 1 hour
      });
      await otpVerification.save();
    }

    // Send email with OTP and userId
    const message = `
      <h1>You have requested a password reset</h1>
      <p>Your OTP for password reset is:</p>
      <h2>${otp}</h2>
      <p>Your user ID is: ${user._id}</p>
    `;

    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset OTP',
      html: message,
    });

    res.status(200).json({ status: true, message: 'OTP sent to email', userId: user._id });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};



export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ status: false, message: 'OTP is required' });
    }

    const otpVerification = await UserOTPVerification.findOne({ otp });

    if (!otpVerification) {
      return res.status(400).json({ status: false, message: 'Invalid or expired OTP' });
    }

    if (otpVerification.expiresAt < Date.now()) {
      return res.status(400).json({ status: false, message: 'OTP has expired' });
    }

    const userId = otpVerification.userId;

    // Delete the OTP record after successful verification
    await UserOTPVerification.deleteOne({ _id: otpVerification._id });

    // Return userId instead of resetToken
    res.status(200).json({ status: true, message: 'OTP verified successfully', userId });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId) {
      return res.status(400).json({ status: false, message: 'Invalid or missing userId' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    // Directly set the new password (not recommended)
    user.password = password;
    await user.save();

    res.status(200).json({ status: true, message: 'Password reset successful' });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};


export const registerUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin, role, title } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
      role,
      title,
    });

    if (user) {
      isAdmin ? createJWT(res, user._id) : null;

      user.password = undefined;

      res.status(201).json(user);
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Invalid user data" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password." });
    }

    if (!user?.isActive) {
      return res.status(401).json({
        status: false,
        message: "User account has been deactivated, contact the administrator",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (user && isMatch) {
      createJWT(res, user._id);

      user.password = undefined;

      res.status(200).json(user);
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      htttpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getTeamList = async (req, res) => {
  try {
    const users = await User.find().select("name title role email isActive");

    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getNotificationsList = async (req, res) => {
  try {
    const { userId } = req.user;

    const notice = await Notice.find({
      team: userId,
      isRead: { $nin: [userId] },
    }).populate("task", "title");

    res.status(201).json(notice);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    const { _id } = req.body;

    const id =
      isAdmin && userId === _id
        ? userId
        : isAdmin && userId !== _id
        ? _id
        : userId;

    const user = await User.findById(id);

    if (user) {
      user.name = req.body.name || user.name;
      user.title = req.body.title || user.title;
      user.role = req.body.role || user.role;

      const updatedUser = await user.save();

      user.password = undefined;

      res.status(201).json({
        status: true,
        message: "Profile Updated Successfully.",
        user: updatedUser,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { userId } = req.user;

    const { isReadType, id } = req.query;

    if (isReadType === "all") {
      await Notice.updateMany(
        { team: userId, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    } else {
      await Notice.findOneAndUpdate(
        { _id: id, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    }

    res.status(201).json({ status: true, message: "Done" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);

    if (user) {
      user.password = req.body.password;

      await user.save();

      user.password = undefined;

      res.status(201).json({
        status: true,
        message: `Password chnaged successfully.`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const activateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (user) {
      user.isActive = req.body.isActive; //!user.isActive

      await user.save();

      res.status(201).json({
        status: true,
        message: `User account has been ${
          user?.isActive ? "activated" : "disabled"
        }`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

