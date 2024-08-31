import jwt from "jsonwebtoken";
import User from "../models/user.js";

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "No token provided. Please log in.",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.userId).select("isAdmin email");

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User not found. Please log in again.",
      });
    }

    req.user = {
      email: user.email,
      isAdmin: user.isAdmin,
      userId: decodedToken.userId,
    };

    next();
  } catch (error) {
    console.error("Error in protectRoute:", error);
    return res.status(401).json({
      status: false,
      message: "Invalid token. Please log in again.",
    });
  }
};

const isAdminRoute = (req, res, next) => {
  if (req.user?.isAdmin) {
    next();
  } else {
    return res.status(401).json({
      status: false,
      message: "Access denied. Admins only.",
    });
  }
};

export { protectRoute, isAdminRoute };
