const submissionRepository = require("../repositories/submissionRepository");

/**
 * Get all submissions
 * GET /api/submissions
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
 * Add new submission
 * POST /api/submissions
 */
exports.addSubmission = async (req, res) => {
    try {
        const submission = req.body;

        const newSubmission = await submissionRepository.create(submission);

        const submissionWithId = {
            ...newSubmission.toObject(),
            id: newSubmission._id.toString(),
        };

        // Emit socket event if io is available
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
 * Get submission by employee ID
 * GET /api/submissions/employee/:employeeId
 */
exports.getSubmissionByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const submission = await submissionRepository.getTodaySubmission(employeeId);

        if (!submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        res.json({ ...submission.toObject(), id: submission._id.toString() });
    } catch (error) {
        console.error("Error getting submission:", error);
        res.status(500).json({ error: "Failed to fetch submission" });
    }
};
