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
        }
    },
    { timestamps: true }
);

// Index for faster queries
ngoSchema.index({ adminId: 1 });
// ngoRegistrationNumber index is already created by unique: true


export default mongoose.model('NGO', ngoSchema);
