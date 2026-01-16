import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAllExpenses, getExpenseFraudAnalysis } from "../controllers/adminExpenseController.js";
import { approveExpense, flagExpense } from "../controllers/expenseApprovalController.js";

const router = express.Router();

console.log("📋 Registering admin expense routes...");

// Admin-only: View all expenses
router.get("/", authMiddleware, getAllExpenses);
console.log("  ✅ GET / (get all expenses)");

// Admin-only: Get fraud analysis for specific expense
router.get("/:id/fraud-analysis", authMiddleware, getExpenseFraudAnalysis);
console.log("  ✅ GET /:id/fraud-analysis");

// Admin-only: Approve expense
router.patch("/:id/approve", authMiddleware, approveExpense);
console.log("  ✅ PATCH /:id/approve");

// Admin-only: Flag expense
router.patch("/:id/flag", authMiddleware, flagExpense);
console.log("  ✅ PATCH /:id/flag");

export default router;

