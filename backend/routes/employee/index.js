const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authMiddleware");
const employeeDashboard = require("../../controllers/employee/dashboardController");

// All employee routes require authentication (employee role)
router.use(protect());

// Profile
router.get("/profile", employeeDashboard.getProfile);
router.put("/profile", employeeDashboard.updateProfile);

// Submissions
router.get("/submissions", employeeDashboard.getMySubmissions);
router.post("/submissions", employeeDashboard.addSubmission);
router.get("/submissions/today", employeeDashboard.getTodaySubmission);

module.exports = router;
