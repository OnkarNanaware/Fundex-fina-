// src/routes/donorRoutes.js
import express from 'express';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import DonationRequest from '../models/DonationRequest.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/donor/overview
 * Returns summary stats + donor name for the logged‑in donor
 */
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const donorId = req.user.id; // from JWT payload

    const [user, donations, activeFundingRequests] = await Promise.all([
      User.findById(donorId).select('fullName'),
      Donation.find({ donorId }),
      DonationRequest.countDocuments({ donorId, status: 'pending' })
    ]);

    const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const tasksSupported = donations.length || 0;

    res.json({
      donorName: user?.fullName || 'Donor',
      totalDonated,
      activeRequests: activeFundingRequests,
      tasksSupported,
      fraudAlerts: 0,      // replace later
    });
  } catch (err) {
    console.error('Donor overview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/donor/transactions
 * Returns recent donations for the logged‑in donor
 */
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const donorId = req.user.id;

    const donations = await Donation.find({ donorId })
      .sort('-createdAt')
      .limit(20);

    const result = donations.map((d) => ({
      id: d._id,
      date: d.createdAt,
      amount: d.amount || 0,
      purpose: d.purpose,
      status: d.paymentStatus,
      receiptAvailable: !!d.receiptUrl,
    }));

    res.json(result);
  } catch (err) {
    console.error('Donor transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/donor/donate
 * Create a new donation for the logged‑in donor
 */
router.post('/donate', authMiddleware, async (req, res) => {
  try {
    const { ngoName, purpose, amount } = req.body;

    if (!ngoName || !purpose || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: 'ngoName, purpose, and amount (> 0) are required',
      });
    }

    const donation = await Donation.create({
      donorId: req.user.id,
      ngoName,
      purpose,
      amount: Number(amount),
      paymentStatus: 'pending',
    });

    res.status(201).json({
      message: 'Donation created successfully',
      donation,
    });
  } catch (err) {
    console.error('Create donation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
