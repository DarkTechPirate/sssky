const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
    {
        // Google OAuth
        googleId: { type: String, unique: true, sparse: true },

        // Basic Info
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        name: { type: String, required: true },

        // Employee-specific fields
        employeeId: { type: String, unique: true, sparse: true },
        companyId: { type: String },

        // Profile
        profilePicture: { type: String },

        // Role: admin or employee
        role: { type: String, default: "employee", enum: ["admin", "employee"] },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
    // Only hash if password is modified and not a Google OAuth password
    if (!this.isModified("password") || this.password.startsWith("google-")) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    // For Google OAuth users with placeholder passwords
    if (this.password.startsWith("google-")) {
        return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model("User", UserSchema);
