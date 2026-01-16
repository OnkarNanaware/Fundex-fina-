// src/models/Admin.js
import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true },
    passwordHash: { type: String, required: true },
    url: { type: String },

    // NGO fields (step 2)
    ngoName: { type: String },
    ngoRegistrationNumber: { type: String },
    ngoType: {
      type: String,
      enum: ['Trust', 'Society', 'Section 8', 'Government-Aided', 'International'],
    },
    ngoEstablishedYear: { type: Number },
    headOfficeState: { type: String },
    headOfficeCity: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Admin', AdminSchema);
