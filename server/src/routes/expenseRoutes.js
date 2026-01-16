import express from "express";
import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { submitExpense } from "../controllers/expenseController.js";

const router = express.Router();

// Upload receipt + proof images + amount spent
router.post(
  "/submit",
  authMiddleware,
  upload.fields([
    { name: "receipt", maxCount: 1 },
    { name: "proof", maxCount: 1 }
  ]),
  submitExpense
);

export default router;
