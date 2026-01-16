// src/models/Donation.js
import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    donorName: String,
    donorEmail: String,

    // Campaign details
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    campaignTitle: String,

    // NGO details
    ngoId: mongoose.Schema.Types.ObjectId,
    ngoName: { type: String, required: true },

    purpose: { type: String, required: true },

    amount: { type: Number, required: true },

    // Payment details
    paymentMethod: String,
    transactionId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'completed'],
      default: 'pending',
    },

    isAnonymous: { type: Boolean, default: false },
    donorMessage: String,

    receiptUrl: String,
    taxReceipt: {
      is80GCertificate: Boolean,
      certificateUrl: String
    },

    donatedAt: Date,
    processedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Donation', donationSchema);
