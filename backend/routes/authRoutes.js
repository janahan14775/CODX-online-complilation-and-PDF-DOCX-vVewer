const express = require("express");

const router = express.Router();

const {
  register,
  verifyOTP,
  login,
  getProfile,
  googleLogin,
  forgotPassword,
  resetPassword,
  updateProfile,
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

// Google Login
router.post(
  "/google-login",
  googleLogin
);

// Forgot Password
router.post(
  "/forgot-password",
  forgotPassword
);

// Reset Password
router.post(
  "/reset-password",
  resetPassword
);

// Update Profile
router.put(
  "/profile/update",
  authMiddleware,
  updateProfile
);

// Get Logged In User Profile
router.get(
  "/profile",
  authMiddleware,
  getProfile
);

module.exports = router;