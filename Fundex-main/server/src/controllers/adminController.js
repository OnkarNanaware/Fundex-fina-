import VolunteerRequest from "../models/VolunteerRequest.js";
import Expense from "../models/Expense.js";
import NotificationService from "../services/notificationService.js";
import { sendVolunteerApprovalEmail, sendVolunteerRejectionEmail, sendFundRequestApprovedEmail, sendFundRequestRejectedEmail } from "../services/emailService.js";

/* ------------------ GET PENDING REQUESTS ------------------ */
export const getPendingRequests = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Campaign = (await import('../models/Campaign.js')).default;

    // Get logged in admin
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.ngoId) {
      return res.status(404).json({ message: 'Admin details not found' });
    }

    // Get all campaigns for this NGO
    const campaigns = await Campaign.find({ ngoId: admin.ngoId }).select('_id');
    const campaignIds = campaigns.map(c => c._id);

    // Filter volunteer requests by campaigns belonging to this NGO
    const requests = await VolunteerRequest.find({
      status: "pending",
      campaignId: { $in: campaignIds }
    }).populate("volunteerId");

    console.log(`✅ Found ${requests.length} pending requests for NGO ${admin.ngoId}`);
    res.json(requests);
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ------------------ APPROVE REQUEST ------------------ */
export const approveRequest = async (req, res) => {
  try {
    const { approvedAmount, comments } = req.body;

    const request = await VolunteerRequest.findById(req.params.id)
      .populate("volunteerId");
    if (!request)
      return res.status(404).json({ message: "Request not found" });

    if (approvedAmount > request.amountRequested) {
      return res.status(400).json({
        message: "Approved amount cannot exceed requested amount",
      });
    }

    request.status = "approved";
    request.approvedAmount = approvedAmount;
    request.approvedBy = req.user.id;
    request.comments = comments || "Approved";

    await request.save();

    // 🔔 NOTIFICATION: Notify volunteer that their fund request was approved
    try {
      await NotificationService.notifyVolunteerFundRequestApproved(
        request.volunteerId._id,
        {
          amount: approvedAmount,
          campaignName: request.purpose || "Campaign",
          campaignId: request._id,
          requestId: request._id
        }
      );
      console.log(`✅ Sent fund request approval notification to volunteer ${request.volunteerId._id}`);

      // 📧 EMAIL: Send approval email to volunteer
      await sendFundRequestApprovedEmail(
        request.volunteerId.email,
        request.volunteerId.fullName || request.volunteerId.name,
        approvedAmount,
        request.purpose || "Campaign"
      );
    } catch (notifError) {
      console.error('Error sending fund request approval notification:', notifError);
    }

    res.json({ message: "Request approved", request });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ------------------ REJECT REQUEST ------------------ */
export const rejectRequest = async (req, res) => {
  try {
    const { comments } = req.body;

    const request = await VolunteerRequest.findById(req.params.id)
      .populate("volunteerId");
    if (!request)
      return res.status(404).json({ message: "Request not found" });

    request.status = "rejected";
    request.approvedAmount = 0;
    request.approvedBy = req.user.id;
    request.comments = comments || "Rejected";

    await request.save();

    // 🔔 NOTIFICATION: Notify volunteer that their fund request was rejected
    try {
      await NotificationService.notifyVolunteerFundRequestRejected(
        request.volunteerId._id,
        {
          amount: request.amountRequested,
          campaignName: request.purpose || "Campaign",
          campaignId: request._id,
          requestId: request._id,
          reason: comments || "Not approved"
        }
      );
      console.log(`✅ Sent fund request rejection notification to volunteer ${request.volunteerId._id}`);

      // 📧 EMAIL: Send rejection email to volunteer
      await sendFundRequestRejectedEmail(
        request.volunteerId.email,
        request.volunteerId.fullName || request.volunteerId.name,
        request.amountRequested,
        request.purpose || "Campaign",
        comments || "Not approved"
      );
    } catch (notifError) {
      console.error('Error sending fund request rejection notification:', notifError);
    }

    res.json({ message: "Request rejected", request });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ------------------ GET ALL EXPENSES (ADMIN DASHBOARD) ------------------ */
export const getAllExpenses = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Campaign = (await import('../models/Campaign.js')).default;

    // Get logged in admin
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.ngoId) {
      return res.status(404).json({ message: 'Admin details not found' });
    }

    // Get all campaigns for this NGO
    const campaigns = await Campaign.find({ ngoId: admin.ngoId }).select('_id');
    const campaignIds = campaigns.map(c => c._id);

    // Get all volunteer requests for these campaigns
    const volunteerRequests = await VolunteerRequest.find({
      campaignId: { $in: campaignIds }
    }).select('_id');
    const requestIds = volunteerRequests.map(r => r._id);

    // Filter expenses by requests belonging to this NGO's campaigns
    const expenses = await Expense.find({
      requestId: { $in: requestIds }
    })
      .populate("volunteerId", "name email")
      .populate("requestId");

    const formatted = expenses.map((e) => {
      const req = e.requestId;

      // ⭐ FIX: If expense has an old or missing requestId → show fallback purpose
      const purpose = req?.purpose || "Purpose unavailable";

      // ⭐ FIX: Approved Amount Logic
      const approvedAmount =
        req?.approvedAmount && req.approvedAmount >= 0
          ? req.approvedAmount
          : "Not approved";

      // ⭐ FIX: Utilization Logic
      const utilization =
        req?.approvedAmount > 0
          ? ((e.amountSpent / req.approvedAmount) * 100).toFixed(1) + "%"
          : "N/A";

      // ⭐ FIX: Status Logic (auto-correct)
      let status = "pending approval";
      if (req?.approvedAmount >= 0) status = "under-utilized";
      if (req?.approvedAmount === e.amountSpent) status = "fully utilized";
      if (req?.approvedAmount < e.amountSpent) status = "overspent";

      return {
        _id: e._id,
        volunteer: e.volunteerId?.name || "Unknown",
        purpose,
        approvedAmount,
        amountSpent: e.amountSpent,
        utilization,
        status,
        receiptImage: e.receiptImage,
        proofImage: e.proofImage,
      };
    });

    console.log(`✅ Found ${formatted.length} expenses for NGO ${admin.ngoId}`);
    res.json(formatted);

  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ message: err.message });
  }
};
/* ------------------ GET VOLUNTEERS ------------------ */
export const getVolunteers = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;

    // Get logged in admin
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.ngoId) {
      return res.status(404).json({ message: 'Admin details not found' });
    }

    // Fetch volunteers for this NGO
    const volunteers = await User.find({
      role: 'volunteer',
      ngoId: admin.ngoId
    }).select('-passwordHash');

    res.json(volunteers);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ message: 'Failed to fetch volunteers' });
  }
};

/* ------------------ UPDATE VOLUNTEER STATUS ------------------ */
export const updateVolunteerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { volunteerId } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const User = (await import('../models/User.js')).default;

    // Get logged in admin
    const admin = await User.findById(req.user.id);

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: 'volunteer',
      ngoId: admin.ngoId
    });

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found or not associated with your NGO' });
    }

    volunteer.status = status;
    await volunteer.save();

    console.log(`✅ Volunteer ${volunteer.email} ${status} by admin ${admin.email}`);

    // Notify volunteer
    try {
      if (status === 'approved') {
        // You might want to create a specific notification type for this
        await NotificationService.createNotification({
          recipientId: volunteer._id,
          recipientRole: 'volunteer',
          type: 'account_approved',
          title: '🎉 Account Approved!',
          message: `Your volunteer account has been approved by ${admin.ngoName}. You can now access your dashboard.`,
          priority: 'high'
        });

        // 📧 EMAIL: Send approval email
        await sendVolunteerApprovalEmail(
          volunteer.email,
          volunteer.fullName,
          admin.ngoName
        );
      } else if (status === 'rejected') {
        await NotificationService.createNotification({
          recipientId: volunteer._id,
          recipientRole: 'volunteer',
          type: 'account_rejected',
          title: 'Account Update',
          message: `Your volunteer request for ${admin.ngoName} has been declined.`,
          priority: 'high'
        });

        // 📧 EMAIL: Send rejection email
        await sendVolunteerRejectionEmail(
          volunteer.email,
          volunteer.fullName,
          admin.ngoName
        );
      }
    } catch (error) {
      console.error('Notification error:', error);
    }

    res.json({
      message: `Volunteer ${status} successfully`,
      volunteer
    });

  } catch (err) {
    console.error('Error updating volunteer status:', err);
    res.status(500).json({ message: 'Failed to update volunteer status' });
  }
};
