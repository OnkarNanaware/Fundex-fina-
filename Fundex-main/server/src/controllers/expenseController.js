import cloudinary from "../services/cloudinaryService.js";
import Expense from "../models/Expense.js";
import VolunteerRequest from "../models/VolunteerRequest.js";
import { extractTextFromImage } from "../services/ocrService.js";
import NotificationService from "../services/notificationService.js";

export const submitExpense = async (req, res) => {
  try {
    const { amountSpent, requestId } = req.body;

    if (!req.files || !req.files.receipt || !req.files.proof) {
      return res.status(400).json({ message: "Both receipt and proof images are required" });
    }

    // -------------------------------
    // UPLOAD RECEIPT IMAGE
    // -------------------------------
    const receiptImageUrl = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "fundex/receipts" },
        (error, result) => error ? reject(error) : resolve(result.secure_url)
      ).end(req.files.receipt[0].buffer);
    });

    // -------------------------------
    // OCR PROCESSING
    // -------------------------------
    const extractedText = await extractTextFromImage(receiptImageUrl);

    let detectedAmount = null;
    let fraudFlags = [];

    if (extractedText) {
      const amountRegex = /\b(\d{2,6})(?:\.\d{1,2})?\b/g;
      const matches = extractedText.match(amountRegex);
      if (matches && matches.length > 0) {
        detectedAmount = parseFloat(matches[0]); // pick first large number
      }
    }

    // Detect mismatch
    if (!detectedAmount) {
      fraudFlags.push("OCR could not detect any valid amount from the receipt.");
    } else if (Math.abs(detectedAmount - parseFloat(amountSpent)) > 10) {
      fraudFlags.push(
        `Mismatch: Volunteer claimed ₹${amountSpent}, but OCR detected ₹${detectedAmount}.`
      );
    }

    // -------------------------------
    // UPLOAD PROOF IMAGE
    // -------------------------------
    const proofImageUrl = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "fundex/proofs" },
        (error, result) => error ? reject(error) : resolve(result.secure_url)
      ).end(req.files.proof[0].buffer);
    });

    // -------------------------------
    // CREATE EXPENSE ENTRY
    // -------------------------------
    const expense = await Expense.create({
      volunteerId: req.user.id,
      requestId,
      amountSpent,
      receiptImage: receiptImageUrl,
      proofImage: proofImageUrl,
      ocrExtracted: extractedText || "",
      detectedAmount: detectedAmount || null,
      fraudFlags,
    });

    // -------------------------------
    // UPDATE REQUEST TOTALS
    // -------------------------------
    const request = await VolunteerRequest.findById(requestId);

    const newTotalSpent = request.totalSpent + parseFloat(amountSpent);
    const newRemainingAmount = request.approvedAmount - newTotalSpent;

    // Overspent fraud
    if (newTotalSpent > request.approvedAmount) {
      expense.fraudFlags.push("Volunteer has overspent more than approved amount.");
      await expense.save();
    }

    request.totalSpent = newTotalSpent;
    request.remainingAmount = newRemainingAmount;
    await request.save();

    // 🔔 NOTIFICATION: Notify all admins about the new expense submission
    try {
      const User = (await import('../models/User.js')).default;
      const volunteer = await User.findById(req.user.id);

      // Get admins for the volunteer's NGO
      const allAdmins = await User.find({
        role: 'admin',
        ngoId: volunteer.ngoId
      });

      const notificationPromises = allAdmins.map(admin =>
        NotificationService.notifyAdminExpenseSubmitted(
          admin._id,
          {
            volunteerName: volunteer?.name || 'A volunteer',
            amount: parseFloat(amountSpent),
            campaignName: request.purpose || 'Campaign',
            campaignId: request._id,
            expenseId: expense._id,
            description: `Receipt amount: ₹${detectedAmount || 'N/A'}`
          }
        )
      );

      await Promise.all(notificationPromises);
      console.log(`✅ Sent expense submission notifications to ${allAdmins.length} admins`);
    } catch (notifError) {
      console.error('Error sending expense submission notifications:', notifError);
    }

    res.json({
      message: "Expense submitted successfully",
      expense,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
