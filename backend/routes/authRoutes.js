const express = require("express");

const router = express.Router();

const {
  register,
  verifyOTP,
  login,
  getProfile,
} = require(
  "../controllers/authController"
);

const authMiddleware = require(
  "../middleware/authMiddleware"
);

// Register User
router.post(
  "/register",
  register
);

// Verify OTP
router.post(
  "/verify-otp",
  verifyOTP
);

// Login User
router.post(
  "/login",
  login
);

// Get Logged In User Profile
router.get(
  "/profile",
  authMiddleware,
  getProfile
);

module.exports = router;