import mongoose from "mongoose";

const volunteerRequestSchema = new mongoose.Schema(
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
    purpose: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    requestedAmount: {
      type: Number,
      required: true
    },
    approvedAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
  },
  { timestamps: true }
);

export default mongoose.model("VolunteerRequest", volunteerRequestSchema);
