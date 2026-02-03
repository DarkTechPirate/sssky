const User = require("../models/userModel");

/**
 * Find or create a user from Google OAuth payload
 * @param {Object} profile - Google OAuth profile { sub, email, name, picture }
 */
async function findOrCreateGoogleUser(profile) {
    // 1. Check by Google ID
    let user = await User.findOne({ googleId: profile.sub });
    if (user) return user;

    // 2. Check by Email (Account Linking)
    if (profile.email) {
        user = await User.findOne({ email: profile.email.toLowerCase() });
        if (user) {
            user.googleId = profile.sub;
            if (!user.profilePicture && profile.picture) {
                user.profilePicture = profile.picture;
            }
            await user.save();
            return user;
        }
    }

    // 3. Create New User
    return await User.create({
        googleId: profile.sub,
        email: profile.email.toLowerCase(),
        name: profile.name,
        profilePicture: profile.picture,
        password: "google-onetap-" + Date.now(),
        role: "employee",
    });
}

module.exports = { findOrCreateGoogleUser };
