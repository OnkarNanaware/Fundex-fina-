// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Common fields
    fullName: { type: String }, // keep optional so donors can use donorFirst/Last
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    phoneNumber: { type: String },

    // Role: admin | volunteer | donor
    role: {
      type: String,
      enum: ['admin', 'volunteer', 'donor'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved' // admins/donors are auto-approved, volunteers will be pending
    },

    /* ============================
       ADMIN-SPECIFIC FIELDS
       ============================ */
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO'
    },
    // Keep these fields for backward compatibility
    ngoName: { type: String },
    ngoRegistrationNumber: { type: String },
    ngoType: { type: String },
    ngoEstablishedYear: { type: Number },
    headOfficeState: { type: String },
    headOfficeCity: { type: String },

    /* ============================
       VOLUNTEER-SPECIFIC FIELDS
       ============================ */
    volunteerRole: { type: String },
    volunteerNGO: { type: String },
    registrationNumber: { type: String },

    /* ============================
       DONOR-SPECIFIC FIELDS
       ============================ */
    donorFirstName: { type: String },
    donorLastName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
