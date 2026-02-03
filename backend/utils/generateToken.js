const jwt = require("jsonwebtoken");

const generateTokenAndSetCookie = (res, userId) => {
    // 1. Generate Token
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    // 2. Cookie Options - MUST use sameSite: 'none' for cross-domain
    const isProduction = process.env.NODE_ENV === "production";
    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true, // Security: JS cannot read this
        secure: isProduction, // HTTPS only in prod (required for sameSite: 'none')
        sameSite: isProduction ? "none" : "lax", // 'none' allows cross-domain cookies
    };

    // 3. Set Cookie
    res.cookie("token", token, options);

    return token;
};

module.exports = generateTokenAndSetCookie;

