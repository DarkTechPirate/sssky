const Submission = require("../models/submissionModel");

/**
 * Submission Repository - Database operations for Submissions
 */
class SubmissionRepository {
    /**
     * Find submission by ID
     */
    async findById(id) {
        return Submission.findById(id);
    }

    /**
     * Get all submissions (optionally filter by company)
     */
    async getAll(companyId = null) {
        const filter = companyId && companyId !== "all"
            ? { "employeeData.companyId": companyId }
            : {};

        return Submission.find(filter).sort({ submittedAt: -1 });
    }

    /**
     * Get submissions by employee ID
     */
    async findByEmployeeId(employeeId) {
        return Submission.find({ "employeeData.employeeId": employeeId })
            .sort({ submittedAt: -1 });
    }

    /**
     * Get today's submission for an employee
     */
    async getTodaySubmission(employeeId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return Submission.findOne({
            "employeeData.employeeId": employeeId,
            submittedAt: { $gte: today, $lt: tomorrow }
        });
    }

    /**
     * Create a new submission
     */
    async create(submissionData) {
        const submission = new Submission({
            ...submissionData,
            submittedAt: new Date()
        });
        return submission.save();
    }

    /**
     * Update submission by ID
     */
    async updateById(id, updates) {
        return Submission.findByIdAndUpdate(id, updates, { new: true });
    }

    /**
     * Delete submission by ID
     */
    async deleteById(id) {
        return Submission.findByIdAndDelete(id);
    }

    /**
     * Get submission count by company
     */
    async countByCompany(companyId) {
        return Submission.countDocuments({ "employeeData.companyId": companyId });
    }

    /**
     * Get submissions for a date range
     */
    async getByDateRange(startDate, endDate, companyId = null) {
        const filter = {
            submittedAt: { $gte: startDate, $lte: endDate }
        };

        if (companyId && companyId !== "all") {
            filter["employeeData.companyId"] = companyId;
        }

        return Submission.find(filter).sort({ submittedAt: -1 });
    }
}

module.exports = new SubmissionRepository();
