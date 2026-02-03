const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

module.exports = (passport) => {
    // Only initialize Google Strategy if credentials are provided
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn("⚠️  Google OAuth credentials not configured - OAuth disabled");
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    console.log("--------------- GOOGLE AUTH START ---------------");

                    // Get the photo URL safely
                    const googlePhoto = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

                    // 1. Check existing user by Google ID
                    let user = await User.findOne({ googleId: profile.id });
                    if (user) {
                        console.log("User found by Google ID:", user.email);
                        return done(null, user);
                    }

                    // 2. Check existing user by Email (Account Linking)
                    if (profile.emails && profile.emails.length > 0) {
                        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
                        if (user) {
                            console.log("User found by Email. Linking account...");
                            user.googleId = profile.id;
                            if (!user.profilePicture && googlePhoto) {
                                user.profilePicture = googlePhoto;
                            }
                            await user.save();
                            return done(null, user);
                        }
                    }

                    // 3. Create New User
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `no-email-${profile.id}`;
                    const newUser = await User.create({
                        googleId: profile.id,
                        email: email.toLowerCase(),
                        name: profile.displayName || profile.name?.givenName || "Google User",
                        password: "google-auth-" + Date.now(),
                        profilePicture: googlePhoto,
                        role: "employee", // Default role for Google sign-in
                    });

                    console.log("USER CREATED SUCCESSFULLY:", newUser._id);
                    return done(null, newUser);
                } catch (err) {
                    console.error("CRITICAL DB ERROR:", err);
                    return done(err, null);
                }
            }
        )
    );
};
