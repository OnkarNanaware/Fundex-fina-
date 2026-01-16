import mongoose from "mongoose";

const aiReportSchema = new mongoose.Schema({
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
  extractedAmount: Number,
  extractedGSTIN: String,
  isAmountMatch: Boolean,
  isGSTValid: Boolean,
  isSuspicious: Boolean,
  summary: String
}, { timestamps: true });

export default mongoose.model("AIReport", aiReportSchema);
