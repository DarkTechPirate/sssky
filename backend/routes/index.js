const express = require("express");
const router = express.Router();

// Auth routes (public)
router.use("/auth", require("./authRoutes"));

// Admin routes (admin only)
router.use("/admin", require("./admin"));

// Employee routes (authenticated employees)
router.use("/employee", require("./employee"));

// Legacy routes for backward compatibility
router.use("/employees", require("./employeeRoutes"));
router.use("/submissions", require("./submissionRoutes"));

// Health check
router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = router;
