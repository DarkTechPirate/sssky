const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
});

const SubmissionSchema = new mongoose.Schema(
    {
        employeeId: { type: String, required: true, index: true },
        employeeData: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            employeeId: { type: String, required: true },
            companyId: { type: String, required: true },
        },
        tasks: [TaskSchema],
        submittedAt: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
SubmissionSchema.index({ "employeeData.companyId": 1 });
SubmissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model("Submission", SubmissionSchema);
