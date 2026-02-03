const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authMiddleware");
const adminDashboard = require("../../controllers/admin/dashboardController");

// All admin routes require admin role
router.use(protect({ admin: true }));

// Employee management
router.get("/employees", adminDashboard.getEmployees);
router.post("/employees", adminDashboard.addEmployee);
router.put("/employees/:id", adminDashboard.updateEmployee);
router.delete("/employees/:id", adminDashboard.deleteEmployee);
router.get("/employees/email/:email", adminDashboard.getEmployeeByEmail);

// Submissions (view all)
router.get("/submissions", adminDashboard.getSubmissions);

module.exports = router;
