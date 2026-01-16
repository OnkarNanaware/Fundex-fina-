import Expense from "../models/Expense.js";
import VolunteerRequest from "../models/VolunteerRequest.js";
import User from "../models/User.js";
import { generateFraudReport } from "../services/fraudDetectionService.js";

export const getAllExpenses = async (req, res) => {
  try {
    // Ensure only admin/finance can access
    if (req.user.role !== "admin" && req.user.role !== "finance") {
      return res.status(403).json({ message: "Access denied" });
    }

    const expenses = await Expense.find()
      .populate("volunteerId", "name email")
      .populate("requestId");

    // Add calculated fields
    const formatted = expenses.map(e => ({
      _id: e._id,
      volunteer: e.volunteerId?.name || "Unknown",
      email: e.volunteerId?.email,
      purpose: e.requestId?.purpose,
      approvedAmount: e.requestId?.approvedAmount || 0,
      amountSpent: e.amountSpent,
      utilization:
        e.requestId?.approvedAmount > 0
          ? ((e.amountSpent / e.requestId.approvedAmount) * 100).toFixed(2) + "%"
          : "N/A",
      status:
        e.amountSpent > (e.requestId?.approvedAmount || 0)
          ? "overspent"
          : e.amountSpent === (e.requestId?.approvedAmount || 0)
            ? "exact"
            : "under",
      receiptImage: e.receiptImage,
      proofImage: e.proofImage,
      fraudFlags: e.fraudFlags || [],
      fraudScore: e.fraudScore || 0,
      fraudRiskLevel: e.fraudRiskLevel || 'MINIMAL',
      ocrExtracted: e.ocrExtracted || "",
      detectedAmount: e.detectedAmount || null,
      gstNumber: e.gstNumber || null,
      gstValid: e.gstValid,
      verificationStatus: e.verificationStatus || 'pending',
      verifiedBy: e.verifiedBy,
      flaggedReason: e.flaggedReason,
      createdAt: e.createdAt,
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getExpenseFraudAnalysis = async (req, res) => {
  try {
    // Ensure only admin/finance can access
    if (req.user.role !== "admin" && req.user.role !== "finance") {
      return res.status(403).json({ message: "Access denied" });
    }

    const expense = await Expense.findById(req.params.id)
      .populate("volunteerId", "name email fullName")
      .populate("requestId", "purpose requestedAmount approvedAmount");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    // Generate fraud report
    const fraudReport = expense.fraudAnalysis ?
      generateFraudReport({
        score: expense.fraudScore,
        riskLevel: expense.fraudRiskLevel,
        flags: expense.fraudAnalysis.flags || [],
        details: expense.fraudAnalysis.details || {},
        recommendation: expense.fraudAnalysis.recommendation || ''
      }) :
      'No fraud analysis available';

    res.json({
      success: true,
      data: {
        expenseId: expense._id,
        volunteer: {
          id: expense.volunteerId?._id,
          name: expense.volunteerId?.fullName || expense.volunteerId?.name,
          email: expense.volunteerId?.email
        },
        request: {
          id: expense.requestId?._id,
          purpose: expense.requestId?.purpose,
          approvedAmount: expense.requestId?.approvedAmount
        },
        expense: {
          amountSpent: expense.amountSpent,
          description: expense.description,
          category: expense.category,
          receiptImage: expense.receiptImage,
          proofImage: expense.proofImage,
          createdAt: expense.createdAt
        },
        ocr: {
          extractedText: expense.ocrExtracted,
          detectedAmount: expense.detectedAmount,
          textLength: expense.ocrExtracted?.length || 0
        },
        gst: {
          number: expense.gstNumber,
          valid: expense.gstValid,
          businessName: expense.gstBusinessName,
          status: expense.gstStatus,
          apiVerified: expense.gstApiVerified,
          validationError: expense.gstValidationError
        },
        fraud: {
          score: expense.fraudScore,
          riskLevel: expense.fraudRiskLevel,
          flags: expense.fraudAnalysis?.flags || [],
          details: expense.fraudAnalysis?.details || {},
          recommendation: expense.fraudAnalysis?.recommendation || '',
          report: fraudReport
        },
        verification: {
          status: expense.verificationStatus,
          verifiedBy: expense.verifiedBy,
          verifiedAt: expense.verifiedAt,
          flaggedReason: expense.flaggedReason
        }
      }
    });

  } catch (err) {
    console.error('❌ Error fetching fraud analysis:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

