// server/src/models/DonationRequest.js
import mongoose from 'mongoose';

const donationRequestSchema = new mongoose.Schema({
  // Campaign Information
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },

  // NGO Information (who is requesting)
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ngoName: {
    type: String,
    required: true
  },

  // Donor Information (to whom the request is sent)
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorName: {
    type: String,
    required: true
  },
  donorEmail: {
    type: String,
    required: true
  },

  // Request Details
  requestedAmount: {
    type: Number,
    required: true,
    min: 100
  },
  message: {
    type: String,
    default: ''
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },

  // Response from donor
  donorResponse: {
    message: String,
    respondedAt: Date
  },

  // Donation tracking (if accepted and donated)
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation'
  },
  donatedAmount: {
    type: Number,
    default: 0
  },
  donatedAt: Date,

  // Timestamps
  requestDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
donationRequestSchema.index({ donorId: 1, status: 1 });
donationRequestSchema.index({ ngoId: 1, status: 1 });
donationRequestSchema.index({ campaignId: 1 });
donationRequestSchema.index({ createdAt: -1 });

export default mongoose.model('DonationRequest', donationRequestSchema);
