// src/routes/adminRoutes.js
import express from "express";
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getAllExpenses,
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getFraudAlerts } from "../controllers/fraudController.js";
// server/src/routes/adminRoutes.js
import Campaign from "../models/Campaign.js";
import adminStatsRoutes from "./adminStatsRoutes.js";
import NotificationService from "../services/notificationService.js";
import { sendCampaignCreatedEmail } from "../services/emailService.js";
// ✅ FIXED: go up 2 levels to server/models/

const router = express.Router();

router.use('/stats', adminStatsRoutes);

// Existing routes
router.get("/requests/pending", authMiddleware, getPendingRequests);
router.post("/requests/:id/approve", authMiddleware, approveRequest);
router.post("/requests/:id/reject", authMiddleware, rejectRequest);
router.get("/expenses", authMiddleware, getAllExpenses);
router.get("/fraud", authMiddleware, getFraudAlerts);
router.get("/pending", authMiddleware, getPendingRequests);

// Volunteer Management Routes
import { getVolunteers, updateVolunteerStatus } from '../controllers/adminController.js';
router.get("/volunteers/list", authMiddleware, getVolunteers);
router.post("/volunteers/:volunteerId/status", authMiddleware, updateVolunteerStatus);

// 👇 CAMPAIGN ROUTES WITH AUTHENTICATION
router.get("/campaigns", authMiddleware, async (req, res) => {
  try {
    // Import User and NGO models
    const User = (await import('../models/User.js')).default;
    const NGO = (await import('../models/NGO.js')).default;

    // Get the logged-in admin's user data
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.ngoId) {
      return res.status(404).json({ error: 'Admin or NGO not found' });
    }

    // Filter campaigns by the admin's NGO ID
    const campaigns = await Campaign.find({
      ngoId: admin.ngoId  // Use the NGO ID from admin's profile
    }).sort({ createdAt: -1 }).lean();

    console.log(`✅ Found ${campaigns.length} campaigns for NGO ${admin.ngoId}`);
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns', details: error.message });
  }
});

router.post("/campaigns", authMiddleware, async (req, res) => {
  try {
    // Import User and NGO models
    const User = (await import('../models/User.js')).default;
    const NGO = (await import('../models/NGO.js')).default;

    // Fetch the logged-in admin's details
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.ngoId) {
      return res.status(404).json({ error: 'Admin or NGO not found' });
    }

    // Fetch NGO details
    const ngo = await NGO.findById(admin.ngoId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    const campaignData = {
      ...req.body,
      createdBy: req.user.id,
      ngoId: admin.ngoId, // Use the admin's NGO ID
      ngoName: ngo.ngoName, // Get NGO name from NGO collection
      // Auto-approve admin created campaigns
      approvalStatus: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      status: 'active'
    };

    console.log('📝 Creating (and auto-approving) campaign with data:', {
      ngoId: campaignData.ngoId,
      ngoName: campaignData.ngoName,
      createdBy: campaignData.createdBy
    });

    const campaign = new Campaign(campaignData);
    await campaign.save();

    console.log('✅ Campaign created and approved successfully:', campaign._id);

    // 🔔 NOTIFICATION: Notify all admins in the same NGO about the new campaign
    try {
      const allAdmins = await User.find({
        role: 'admin',
        ngoId: admin.ngoId,
        _id: { $ne: req.user.id } // Exclude the creator
      });

      const notificationPromises = allAdmins.map(adminUser =>
        NotificationService.createNotification({
          recipientId: adminUser._id,
          recipientRole: 'admin',
          type: 'campaign_created',
          title: '🚀 New Campaign Created',
          message: `${admin.name || 'An admin'} created a new campaign: "${campaign.title}". Target: ₹${campaign.targetAmount?.toLocaleString() || 'N/A'}`,
          relatedEntity: {
            entityType: 'campaign',
            entityId: campaign._id
          },
          metadata: {
            campaignName: campaign.title,
            campaignId: campaign._id,
            creatorName: admin.name,
            targetAmount: campaign.targetAmount
          },
          priority: 'medium'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`✅ Sent campaign creation notifications to ${allAdmins.length} admins`);
    } catch (notifError) {
      console.error('Error sending campaign creation notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    // 📧 EMAIL: Send campaign creation email to the creator
    try {
      console.log('📧 Attempting to send campaign creation email to:', admin.email);
      console.log('📧 Admin details:', {
        email: admin.email,
        fullName: admin.fullName,
        name: admin.name
      });

      await sendCampaignCreatedEmail(
        admin.email,
        admin.fullName || admin.name || 'Admin',
        campaign.title,
        campaign.targetAmount
      );

      console.log('✅ Campaign creation email sent successfully to:', admin.email);
    } catch (emailError) {
      console.error('❌ Error sending campaign creation email:', emailError);
      console.error('Email error details:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign', details: error.message });
  }
});

router.delete("/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully', campaign });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign', details: error.message });
  }
});

router.patch("/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign', details: error.message });
  }
});

export default router;
