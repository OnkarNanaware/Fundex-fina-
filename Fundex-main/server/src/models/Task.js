import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign"
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "in-progress", "completed", "cancelled"],
            default: "pending"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        dueDate: {
            type: Date
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        completedAt: {
            type: Date
        },
        notes: {
            type: String
        },
    },
    { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
