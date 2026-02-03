const userRepository = require("../../repositories/userRepository");
const submissionRepository = require("../../repositories/submissionRepository");

/**
 * Admin Dashboard Controller
 * All operations for admin dashboard
 */

/**
 * Get all employees
 * GET /api/admin/employees
 */
exports.getEmployees = async (req, res) => {
    try {
        const employees = await userRepository.getAllEmployees();

        const sanitizedEmployees = employees.map((emp) => ({
            ...emp.toObject(),
            id: emp._id.toString(),
        }));

        res.json(sanitizedEmployees);
    } catch (error) {
        console.error("Error getting employees:", error);
        res.status(500).json({ error: "Failed to fetch employees" });
    }
};

/**
 * Add new employee
 * POST /api/admin/employees
 */
exports.addEmployee = async (req, res) => {
    try {
        const { email, password, name, employeeId, companyId } = req.body;

        if (!email || !password || !name || !employeeId || !companyId) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if employee already exists
        const existing = await userRepository.exists(email, employeeId);

        if (existing) {
            return res.status(400).json({ error: "Employee with this email or ID already exists" });
        }

        const newEmployee = await userRepository.create({
            email,
            password,
            name,
            employeeId,
            companyId,
            role: "employee",
        });

        const employeeWithId = {
            ...newEmployee.toJSON(),
            id: newEmployee._id.toString(),
        };

        // Emit socket event
        if (req.io) {
            req.io.emit("employee_added", employeeWithId);
        }

        res.status(201).json(employeeWithId);
    } catch (error) {
        console.error("Error adding employee:", error);
        res.status(500).json({ error: "Failed to add employee" });
    }
};

/**
 * Update employee
 * PUT /api/admin/employees/:id
 */
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        const employee = await userRepository.updateById(id, updates);

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        if (req.io) {
            req.io.emit("employee_updated", { id, ...updates });
        }

        res.json({ message: "Employee updated successfully", employee });
    } catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).json({ error: "Failed to update employee" });
    }
};

/**
 * Delete employee
 * DELETE /api/admin/employees/:id
 */
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await userRepository.deleteById(id);

        if (!result) {
            return res.status(404).json({ error: "Employee not found" });
        }

        if (req.io) {
            req.io.emit("employee_deleted", id);
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).json({ error: "Failed to delete employee" });
    }
};

/**
 * Get all submissions (with optional company filter)
 * GET /api/admin/submissions
 */
exports.getSubmissions = async (req, res) => {
    try {
        const { companyId } = req.query;
        const submissions = await submissionRepository.getAll(companyId);

        res.json(
            submissions.map((sub) => ({
                ...sub.toObject(),
                id: sub._id.toString(),
            }))
        );
    } catch (error) {
        console.error("Error getting submissions:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
};

/**
 * Get employee by email
 * GET /api/admin/employees/email/:email
 */
exports.getEmployeeByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const employee = await userRepository.findByEmail(email);

        if (!employee || employee.role !== "employee") {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json({
            ...employee.toJSON(),
            id: employee._id.toString(),
        });
    } catch (error) {
        console.error("Error getting employee:", error);
        res.status(500).json({ error: "Failed to fetch employee" });
    }
};
