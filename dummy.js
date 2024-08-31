// {
//     "email":"syed@gmail.com",
//     "name":"imaduddiin",
//     "isAdmin":true,
//     "password":"syed567",
//     "role":"developer",
//     "title":"Administator"
// }

const userId = "66b5b3200e3d5d656a614e72";
const otp = "newOtpValue";
const currentTime = new Date();
const expiryTime = new Date(currentTime.getTime() + 10 * 60 * 1000); // OTP expires in 10 minutes

await UserOTPVerification.findOneAndUpdate(
    { userId: userId },
    { otp: otp, createdAt: currentTime, expiresAt: expiryTime },
    { upsert: true, new: true }
);

