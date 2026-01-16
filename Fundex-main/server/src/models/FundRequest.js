// server/src/models/FundRequest.js
import mongoose from 'mongoose';

const fundRequestSchema = new mongoose.Schema({
    volunteerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    campaignTitle: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requestedAmount: {
        type: Number,
        required: true,
        min: 0
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'fulfilled'],
        default: 'pending'
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    documents: [{
        type: String
    }],
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
fundRequestSchema.index({ campaignId: 1, status: 1 });
fundRequestSchema.index({ volunteerId: 1 });
fundRequestSchema.index({ status: 1, urgency: 1 });

const FundRequest = mongoose.model('FundRequest', fundRequestSchema);

export default FundRequest;
