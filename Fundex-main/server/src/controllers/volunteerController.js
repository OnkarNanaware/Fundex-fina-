import VolunteerRequest from "../models/VolunteerRequest.js";
import Expense from "../models/Expense.js";
import NotificationService from "../services/notificationService.js";

// ------------------ SUBMIT REQUEST ------------------
export const submitVolunteerRequest = async (req, res) => {
  try {
    const { purpose, amountRequested } = req.body;

    const newReq = await VolunteerRequest.create({
      volunteerId: req.user.id,
      purpose,
      amountRequested,
      status: "pending",
      approvedAmount: 0,
      totalSpent: 0,
      remainingAmount: 0,
    });

    // 🔔 NOTIFICATION: Notify all admins about the new fund request
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 NOTIFICATION TRIGGER: Fund Request Submitted');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💼 Request ID:', newReq._id);
    console.log('💰 Amount:', amountRequested);
    console.log('📋 Purpose:', purpose);
    console.log('👤 Volunteer ID:', req.user.id);

    try {
      const User = (await import('../models/User.js')).default;
      console.log('🔍 Finding volunteer details...');
      const volunteer = await User.findById(req.user.id);

      if (volunteer) {
        console.log('✅ Volunteer found:', {
          id: volunteer._id,
          name: volunteer.name,
          fullName: volunteer.fullName,
          email: volunteer.email
        });
      } else {
        console.log('⚠️ Volunteer not found!');
      }

      // Get admins for the volunteer's NGO
      console.log(`🔍 Finding admins for NGO ${volunteer.ngoId} to notify...`);
      const allAdmins = await User.find({
        role: 'admin',
        ngoId: volunteer.ngoId
      });
      console.log(`📊 Found ${allAdmins.length} admin(s)`);

      if (allAdmins.length === 0) {
        console.log('⚠️ NO ADMINS FOUND - Cannot send notifications!');
        console.log('💡 Make sure at least one user has role: "admin"');
      } else {
        console.log('👥 Admin IDs:', allAdmins.map(a => a._id.toString()));

        const volunteerName = volunteer?.fullName || volunteer?.name || 'A volunteer';
        console.log('📝 Using volunteer name:', volunteerName);

        const notificationPromises = allAdmins.map((admin, index) => {
          console.log(`📤 [${index + 1}/${allAdmins.length}] Creating notification for admin: ${admin._id}`);
          return NotificationService.notifyAdminFundRequest(
            admin._id,
            {
              volunteerName: volunteerName,
              amount: amountRequested,
              campaignName: purpose || 'Campaign',
              campaignId: newReq._id,
              requestId: newReq._id
            }
          );
        });

        await Promise.all(notificationPromises);
        console.log(`✅ Successfully sent fund request notifications to ${allAdmins.length} admins`);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (notifError) {
      console.error('❌ Error sending fund request notifications:', notifError.message);
      console.error('❌ Stack:', notifError.stack);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    res.json({ message: "Request submitted", newReq });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------ VOLUNTEER DASHBOARD ------------------
export const getVolunteerDashboard = async (req, res) => {
  try {
    const requests = await VolunteerRequest.find({ volunteerId: req.user.id });
    const expenses = await Expense.find({ volunteerId: req.user.id }).populate("requestId");

    res.json({ requests, expenses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
