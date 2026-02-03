const submissionRepository = require("../../repositories/submissionRepository");
const userRepository = require("../../repositories/userRepository");

/**
 * Employee Dashboard Controller
 * Operations specific to employee actions
 */

/**
 * Get current employee's profile
 * GET /api/employee/profile
 */
exports.getProfile = async (req, res) => {
    try {
        const employee = await userRepository.findById(req.user._id);

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json({
            ...employee.toJSON(),
            id: employee._id.toString(),
        });
    } catch (error) {
        console.error("Error getting profile:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
};

/**
 * Submit a checklist
 * POST /api/employee/submissions
 */
exports.addSubmission = async (req, res) => {
    try {
        const submission = req.body;

        // Ensure the submission is for the logged-in employee
        if (submission.employeeData && submission.employeeData.employeeId !== req.user.employeeId) {
            return res.status(403).json({ error: "Cannot submit for another employee" });
        }

        const newSubmission = await submissionRepository.create(submission);

        const submissionWithId = {
            ...newSubmission.toObject(),
            id: newSubmission._id.toString(),
        };

        if (req.io) {
            req.io.emit("submission_added", submissionWithId);
        }

        res.status(201).json(submissionWithId);
    } catch (error) {
        console.error("Error adding submission:", error);
        res.status(500).json({ error: "Failed to add submission" });
    }
};

/**
 * Get current employee's submissions
 * GET /api/employee/submissions
 */
exports.getMySubmissions = async (req, res) => {
    try {
        const submissions = await submissionRepository.findByEmployeeId(req.user.employeeId);

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
 * Get today's submission for current employee
 * GET /api/employee/submissions/today
 */
exports.getTodaySubmission = async (req, res) => {
    try {
        const submission = await submissionRepository.getTodaySubmission(req.user.employeeId);

        if (!submission) {
            return res.status(404).json({ error: "No submission for today" });
        }

        res.json({
            ...submission.toObject(),
            id: submission._id.toString(),
        });
    } catch (error) {
        console.error("Error getting today's submission:", error);
        res.status(500).json({ error: "Failed to fetch submission" });
    }
};

/**
 * Update employee's own profile
 * PUT /api/employee/profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const updates = { ...req.body };

        // Don't allow changing sensitive fields
        delete updates.role;
        delete updates.email;
        delete updates.employeeId;
        delete updates.companyId;
        delete updates.password;

        const employee = await userRepository.updateById(req.user._id, updates);

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json({
            message: "Profile updated successfully",
            employee: {
                ...employee.toJSON(),
                id: employee._id.toString(),
            },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};
