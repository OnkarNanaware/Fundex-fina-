// src/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import NGO from '../models/NGO.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// helper to sign JWT
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role, ngoId: user.ngoId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ---------- ADMIN REGISTER ----------
router.post('/register-admin', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      url, // optional
      ngoName,
      ngoRegistrationNumber,
      ngoType,
      ngoEstablishedYear,
      headOfficeState,
      headOfficeCity,
    } = req.body;

    if (!fullName || !email || !phoneNumber || !password) {
      return res
        .status(400)
        .json({ message: 'Missing required admin fields' });
    }

    if (!ngoName || !ngoRegistrationNumber || !ngoType) {
      return res
        .status(400)
        .json({ message: 'Missing required NGO fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Admin with this email already exists' });
    }

    // Check if NGO registration number already exists
    const existingNGO = await NGO.findOne({ ngoRegistrationNumber });
    if (existingNGO) {
      return res
        .status(409)
        .json({ message: 'NGO with this registration number already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user first (without ngoId)
    const admin = await User.create({
      fullName,
      email,
      phoneNumber,
      passwordHash,
      role: 'admin',
      url,
      // Keep NGO fields for backward compatibility
      ngoName,
      ngoRegistrationNumber,
      ngoType,
      ngoEstablishedYear,
      headOfficeState,
      headOfficeCity,
    });

    // Create NGO document with reference to admin
    const ngo = await NGO.create({
      ngoName,
      ngoRegistrationNumber,
      ngoType,
      ngoEstablishedYear,
      headOfficeState,
      headOfficeCity,
      adminId: admin._id
    });

    // Update admin with ngoId reference
    admin.ngoId = ngo._id;
    await admin.save();

    const token = signToken(admin);

    // Store in localStorage on client side
    const userResponse = {
      id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      phoneNumber: admin.phoneNumber,
      ngoId: ngo._id,
      ngoName: ngo.ngoName,
      ngoRegistrationNumber: ngo.ngoRegistrationNumber,
      ngoType: ngo.ngoType,
      ngoEstablishedYear: ngo.ngoEstablishedYear,
      headOfficeState: ngo.headOfficeState,
      headOfficeCity: ngo.headOfficeCity,
    };

    res.status(201).json({
      message: 'Admin and NGO registered',
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Register admin error:', err); // check terminal
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------- DONOR REGISTER ----------
router.post('/register-donor', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      donorFirstName,
      donorLastName,
    } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Missing required donor fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Donor with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const donor = await User.create({
      fullName,
      email,
      phoneNumber,
      passwordHash,
      role: 'donor',
      donorFirstName,
      donorLastName,
    });

    const token = signToken(donor);

    res.status(201).json({
      message: 'Donor registered',
      token,
      user: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        role: donor.role,
        donorFirstName: donor.donorFirstName,
        donorLastName: donor.donorLastName,
        phoneNumber: donor.phoneNumber
      },
    });
  } catch (err) {
    console.error('Register donor error:', err); // check terminal
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- VOLUNTEER REGISTER ----------
router.post('/register-volunteer', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      volunteerRole,
      ngoId,
      volunteerNGO,
      registrationNumber,
    } = req.body;

    if (!fullName || !email || !password || !ngoId) {
      return res
        .status(400)
        .json({ message: 'Missing required volunteer fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Volunteer with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const volunteer = await User.create({
      fullName,
      email,
      passwordHash,
      role: 'volunteer',
      volunteerRole,
      ngoId, // Link volunteer to NGO
      volunteerNGO,
      registrationNumber,
      status: 'pending' // New volunteers require approval
    });

    const token = signToken(volunteer);

    res.status(201).json({
      message: 'Volunteer registered',
      token,
      user: {
        id: volunteer._id,
        fullName: volunteer.fullName,
        email: volunteer.email,
        role: volunteer.role,
        ngoId: volunteer.ngoId,
        volunteerRole: volunteer.volunteerRole,
        status: volunteer.status
      },
    });
  } catch (err) {
    console.error('Register volunteer error:', err); // <- this is what you must read
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- LOGIN (all roles) ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: 'Email, password, and role are required' });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);

    const userResponse = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      // Include role-specific fields
      ngoId: user.ngoId,
      donorFirstName: user.donorFirstName,
      donorLastName: user.donorLastName,
      ngoName: user.ngoName,
      ngoName: user.ngoName,
      phoneNumber: user.phoneNumber,
      status: user.status || 'approved'
    };

    console.log('✅ Login successful for:', user.email);
    console.log('📤 Sending user object:', userResponse);

    res.json({
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- GET CURRENT USER ----------
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      // Admin-specific fields
      ngoId: user.ngoId,
      ngoName: user.ngoName,
      ngoRegistrationNumber: user.ngoRegistrationNumber,
      ngoType: user.ngoType,
      ngoEstablishedYear: user.ngoEstablishedYear,
      headOfficeState: user.headOfficeState,
      headOfficeCity: user.headOfficeCity,
      // Volunteer-specific fields
      volunteerRole: user.volunteerRole,
      volunteerNGO: user.volunteerNGO,
      registrationNumber: user.registrationNumber,
      // Donor-specific fields
      donorFirstName: user.donorFirstName,
      donorLastName: user.donorLastName,
      status: user.status || 'approved'
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
