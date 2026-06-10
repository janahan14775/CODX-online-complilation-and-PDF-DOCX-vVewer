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
exports.login = async (
  req,
  res
) => {
  try {
    const { email, password } =
      req.body;

    const user =
      await User.findOne({
        email,
      });

    if (!user) {
      return res.status(400).json({
        message:
          "Email not registered",
      });
    }

    if (
      !user.isVerified
    ) {
      return res.status(400).json({
        message:
          "Please verify your email first",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Incorrect password",
      });
    }

    const token =
      jwt.sign(
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
      message:
        "Server Error",
    });
  }
};

// Get Logged In User
exports.getProfile = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user.id
      ).select("-password");

    res.json({
      success: true,
      user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Server Error",
    });
  }
};