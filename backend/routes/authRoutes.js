const express = require("express");
const router = express.Router();
const passport = require("passport");
const { OAuth2Client } = require("google-auth-library");
const generateTokenAndSetCookie = require("../utils/generateToken");
const { protect } = require("../middleware/authMiddleware");
const { adminLogin, employeeLogin, logout, me } = require("../controllers/authControllers");
const { findOrCreateGoogleUser } = require("../services/authService");

// Initialize Google Client for One Tap verification
const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// ==============================================
// 1. MANUAL AUTH ROUTES
// ==============================================
router.post("/admin/login", adminLogin);
router.post("/employee/login", employeeLogin);
router.get("/logout", logout);
router.get("/me", protect(), me);

// ==============================================
// 2. GOOGLE OAUTH ROUTES (Standard Redirect)
// ==============================================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // A. Trigger Route
    router.get(
        "/google",
        passport.authenticate("google", {
            session: false,
            scope: ["profile", "email"],
        })
    );

    // B. Callback Route
    router.get(
        "/google/callback",
        passport.authenticate("google", {
            session: false,
            failureRedirect: `${process.env.CLIENT_URL}/login`,
        }),
        (req, res) => {
            // req.user is populated by Passport strategy
            generateTokenAndSetCookie(res, req.user._id);
            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
            res.redirect(clientUrl);
        }
    );

    // ==============================================
    // 3. GOOGLE ONE TAP ROUTE (Popup/No-Redirect)
    // ==============================================
    router.post("/google/onetap", async (req, res) => {
        const { token } = req.body;

        try {
            // A. Verify the ID Token sent from Frontend
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();

            // B. Find or Create User
            const user = await findOrCreateGoogleUser(payload);

            // C. Set the Cookie
            generateTokenAndSetCookie(res, user._id);

            // D. Respond with User Data
            res.status(200).json({
                success: true,
                user,
                message: "Google One Tap Login Successful",
            });
        } catch (error) {
            console.error("One Tap Error:", error);
            res.status(401).json({ success: false, message: "Invalid Google Token" });
        }
    });
}

module.exports = router;
