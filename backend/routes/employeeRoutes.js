const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
} = require("../controllers/employeeControllers");

// All employee routes require admin authentication
router.get("/", protect({ admin: true }), getEmployees);
router.post("/", protect({ admin: true }), addEmployee);
router.put("/:id", protect({ admin: true }), updateEmployee);
router.delete("/:id", protect({ admin: true }), deleteEmployee);

module.exports = router;
