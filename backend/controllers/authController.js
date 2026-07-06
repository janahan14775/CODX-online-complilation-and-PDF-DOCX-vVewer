const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const validator = require("validator");

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } =
      req.body;

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "All fields are required",
      });
    }

    if (
      !validator.isEmail(email)
    ) {
      return res.status(400).json({
        message:
          "Invalid Email Address",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (
      !passwordRegex.test(
        password
      )
    ) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, number and special character",
      });
    }

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "Email already registered",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const otp =
      Math.floor(
        100000 +
          Math.random() * 900000
      ).toString();

    const user =
      await User.create({
        name,
        email,
        password:
          hashedPassword,
        otp,
      });

    await transporter.sendMail({
      from:
        process.env.EMAIL_USER,
      to: email,
      subject:
        "Email Verification OTP",
      html: `
        <h2>Welcome to Online IDE</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
      `,
    });

    res.status(201).json({
      success: true,
      message:
        "OTP sent to email",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Server Error",
    });
  }
};

// Verify OTP
exports.verifyOTP = async (
  req,
  res
) => {
  try {
    const { email, otp } =
      req.body;

    const user =
      await User.findOne({
        email,
      });

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        message:
          "Invalid OTP",
      });
    }

    user.isVerified = true;
    user.otp = "";

    await user.save();

    res.json({
      success: true,
      message:
        "Email verified successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Server Error",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Email not registered",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    // Record login history
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
    user.loginHistory.push({ ip, userAgent, date: new Date() });
    if (user.loginHistory.length > 20) {
      user.loginHistory.shift();
    }
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Google Login
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        message: "Token is required",
      });
    }

    let email, name;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } catch (err) {
      console.warn("Google verification failed:", err.message);
      return res.status(400).json({
        message: "Invalid Google Token",
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: true,
      });
    }

    // Record login history
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
    user.loginHistory.push({ ip, userAgent, date: new Date() });
    if (user.loginHistory.length > 20) {
      user.loginHistory.shift();
    }
    await user.save();

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Google Login Server Error",
    });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "Email not registered",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP code to reset your password is:</p>
        <h1>${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
      `,
    });

    res.json({
      success: true,
      message: "Password reset OTP sent to email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Forgot Password Server Error",
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await User.findOne({
      email,
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase, number and special character",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = "";
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Reset Password Server Error",
    });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name) {
      user.name = name;
    }

    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: "Password must contain uppercase, lowercase, number and special character",
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Update Profile Server Error",
    });
  }
};

// Get Logged In User
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};