import mongoose, { Schema } from "mongoose";

const UserOTPVerificationSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Linking to User model
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date, required: true }, // TTL Index for automatic expiry
});

const UserOTPVerification = mongoose.model(
    "UserOTPVerification",
    UserOTPVerificationSchema
);

export default UserOTPVerification;
