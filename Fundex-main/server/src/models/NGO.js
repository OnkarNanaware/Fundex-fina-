// models/NGO.js
import mongoose from 'mongoose';

const ngoSchema = new mongoose.Schema(
    {
        ngoName: {
            type: String,
            required: true,
            trim: true
        },
        ngoRegistrationNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        ngoType: {
            type: String,
            required: true,
            enum: ['Trust', 'Society', 'Section 8', 'Government-Aided', 'International']
        },
        ngoEstablishedYear: {
            type: Number,
            required: true
        },
        headOfficeState: {
            type: String,
            required: true
        },
        headOfficeCity: {
            type: String,
            required: true
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active'
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        trustScore: {
            score: {
                type: Number,
                default: 75,
                min: 0,
                max: 100
            },
            lastCalculated: {
                type: Date,
                default: Date.now
            },
            breakdown: {
                fraudScore: { type: Object, default: {} },
                utilization: { type: Object, default: {} },
                transparency: { type: Object, default: {} },
                donorConfidence: { type: Object, default: {} }
            }
        },
        fundMetrics: {
            totalRaised: { type: Number, default: 0 },
            totalAllocated: { type: Number, default: 0 },
            totalSpent: { type: Number, default: 0 },
            availableFunds: { type: Number, default: 0 },
            utilizationPercentage: { type: Number, default: 0 },
            totalDonors: { type: Number, default: 0 },
            totalCampaigns: { type: Number, default: 0 },
            activeCampaigns: { type: Number, default: 0 }
        }
    },
    { timestamps: true }
);

// Index for faster queries
ngoSchema.index({ adminId: 1 });
// ngoRegistrationNumber index is already created by unique: true


export default mongoose.model('NGO', ngoSchema);
