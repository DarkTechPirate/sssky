const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getSubmissions,
    addSubmission,
    getSubmissionByEmployee,
} = require("../controllers/submissionControllers");

// Get all submissions (admin only)
router.get("/", protect({ admin: true }), getSubmissions);

// Add a submission (any authenticated user)
router.post("/", protect(), addSubmission);

// Get submission by employee ID
router.get("/employee/:employeeId", protect(), getSubmissionByEmployee);

module.exports = router;
