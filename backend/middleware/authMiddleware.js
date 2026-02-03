const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const generateTokenAndSetCookie = require("../utils/generateToken");

/**
 * Protect middleware - Verifies JWT and optionally checks role
 * @param {Object} options - { admin: boolean, employee: boolean }
 */
const protect = ({ admin = false } = {}) => async (req, res, next) => {
    try {
        // 1. Read token from cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Find user
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }

        // 4. Admin check
        if (admin && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized as admin" });
        }

        // 5. Rolling session / auto-refresh (if < 7 days remaining, refresh)
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const sevenDaysInSeconds = 7 * 24 * 60 * 60;
        const timeRemaining = decoded.exp - nowInSeconds;

        if (timeRemaining < sevenDaysInSeconds) {
            generateTokenAndSetCookie(res, req.user._id);
        }

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        res.status(401).json({ message: "Not authorized, invalid token" });
    }
};

module.exports = { protect };
