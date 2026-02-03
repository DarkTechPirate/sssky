const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const { enqueueMedia } = require("../services/mediaService");

// --- Helper: Indian Phone Validator ---
const isValidIndianPhone = (phone) => {
  // Regex: Starts with 6-9, followed by 9 digits (Total 10)
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// --- Helper: Password Strength Validator ---
const isPasswordStrong = (password) => {
  const strongRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
  return strongRegex.test(password);
};

// --- 1. Personal Info Update ---
exports.PersonalInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, phone, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Full Name Update
    if (fullName && fullName.trim().length > 0) {
      user.fullname = fullName.trim();
    }

    // Indian Phone Validation
    if (phone) {
      const cleanPhone = phone.toString().replace(/\D/g, ""); // Remove non-digits
      if (!isValidIndianPhone(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Indian mobile number. Must be 10 digits starting with 6-9.",
        });
      }
      user.phone = cleanPhone;
    }

    // Password Update
    if (password && password.length > 0) {
      if (!isPasswordStrong(password)) {
        return res.status(400).json({
          success: false,
          message:
            "Password is too weak. Must contain 8+ characters, uppercase, lowercase, number, and special character.",
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    // Convert to object and strip password for security
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// --- 2. NEW: Profile Picture Upload ---
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    }

    // Add Job to Queue
    // We pass "User" as the model and "profilePicture" as the field to update
    await enqueueMedia(req.file, req.user._id, "User", "profilePicture");

    res.status(200).json({
      success: true,
      message: "Profile picture upload started. Processing in background...",
    });
  } catch (error) {
    console.error("Profile Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
