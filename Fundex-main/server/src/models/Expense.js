import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "VolunteerRequest" },
  amountSpent: Number,
  description: { type: String, default: '' },
  category: { type: String, default: 'general' },
  receiptImage: String,
  proofImage: String,
  ocrExtracted: String,
  detectedAmount: Number,
  fraudFlags: [String],

  // GST Information
  gstNumber: { type: String, default: null },
  gstValid: { type: Boolean, default: null },
  gstBusinessName: { type: String, default: null },
  gstStatus: { type: String, default: null },
  gstApiVerified: { type: Boolean, default: false },
  gstValidationError: { type: String, default: null },

  // Fraud Detection
  fraudScore: { type: Number, default: 0, min: 0, max: 100 },
  fraudRiskLevel: {
    type: String,
    enum: ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MINIMAL'
  },
  fraudAnalysis: {
    flags: [String],
    details: mongoose.Schema.Types.Mixed,
    recommendation: String
  },

  // Verification
  verificationStatus: { type: String, enum: ['pending', 'approved', 'flagged'], default: 'pending' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: Date,
  flaggedReason: String,
}, { timestamps: true });


export default mongoose.model("Expense", expenseSchema);
