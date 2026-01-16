// server/src/routes/paymentRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import stripe from '../config/stripe.js'; // This imports the stripe instance directly
import NotificationService from '../services/notificationService.js';
import { sendDonationReceivedEmail, sendAdminDonationNotificationEmail } from '../services/emailService.js';

const router = express.Router();

// Models...
let Donation;
try {
  Donation = mongoose.model('Donation');
} catch (error) {
  const donationSchema = new mongoose.Schema({
    donorId: mongoose.Schema.Types.ObjectId,
    donorName: String,
    donorEmail: String,
    campaignId: mongoose.Schema.Types.ObjectId,
    campaignTitle: String,
    ngoId: mongoose.Schema.Types.ObjectId,
    ngoName: String,
    amount: Number,
    paymentMethod: String,
    transactionId: String,
    paymentStatus: String,
    isAnonymous: Boolean,
    donorMessage: String,
    donatedAt: Date,
    processedAt: Date,
    taxReceipt: {
      is80GCertificate: Boolean
    }
  }, { timestamps: true });

  Donation = mongoose.model('Donation', donationSchema);
}

let Campaign;
try {
  Campaign = mongoose.model('Campaign');
} catch (error) {
  console.log('⚠️ Campaign model not found');
}

const User = mongoose.model('User');

// @route   POST /api/payments/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    // REMOVE THIS LINE: const stripe = getStripe(); // ❌ Delete this!
    const { amount, campaignId, donorId } = req.body;

    console.log('💳 Creating payment intent:', { amount, campaignId, donorId });

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1'
      });
    }

    // Use the imported 'stripe' directly (no getStripe() needed)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'inr',
      metadata: {
        campaignId: campaignId || '',
        donorId: donorId || ''
      }
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('❌ Payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// @route   POST /api/payments/confirm-donation
router.post('/confirm-donation', async (req, res) => {
  try {
    // REMOVE THIS LINE: const stripe = getStripe(); // ❌ Delete this!
    const {
      paymentIntentId,
      campaignId,
      donationRequestId,
      ngoId,
      donorId,
      amount,
      donorMessage,
      isAnonymous
    } = req.body;

    console.log('💰 Confirming donation:', {
      paymentIntentId,
      campaignId,
      donationRequestId,
      amount
    });

    // Use the imported 'stripe' directly
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    let donorName = 'Guest Donor';
    let donorEmail = '';

    console.log('🔍 Looking up donor with ID:', donorId);
    console.log('🔍 Is valid ObjectId?', mongoose.Types.ObjectId.isValid(donorId));

    // Try to find donor information
    if (donorId && mongoose.Types.ObjectId.isValid(donorId)) {
      try {
        console.log('🔍 Querying database for donor...');
        const donor = await User.findById(donorId);

        console.log('🔍 Query result:', donor ? 'User found' : 'User NOT found');

        if (donor) {
          console.log('🔍 Donor document:', {
            _id: donor._id,
            email: donor.email,
            role: donor.role,
            fullName: donor.fullName,
            donorFirstName: donor.donorFirstName,
            donorLastName: donor.donorLastName,
            ngoName: donor.ngoName
          });

          // Handle different name fields based on user role
          if (donor.role === 'donor' && donor.donorFirstName) {
            donorName = `${donor.donorFirstName} ${donor.donorLastName || ''}`.trim();
            console.log('✅ Using donorFirstName + donorLastName:', donorName);
          } else if (donor.fullName) {
            donorName = donor.fullName;
            console.log('✅ Using fullName:', donorName);
          } else if (donor.ngoName) {
            donorName = donor.ngoName;
            console.log('✅ Using ngoName:', donorName);
          } else {
            console.log('⚠️ No name fields found! Keeping "Guest Donor"');
          }

          donorEmail = donor.email || '';

          console.log('✅ Final donor info:', {
            id: donor._id,
            name: donorName,
            email: donorEmail,
            role: donor.role
          });
        } else {
          console.log('⚠️ Donor not found with ID:', donorId);
        }
      } catch (err) {
        console.error('❌ Error finding donor:', err.message);
        console.error('❌ Full error:', err);
      }
    } else {
      console.log('⚠️ Invalid or missing donorId:', donorId);
    }

    let campaignTitle = 'Donation';
    let ngoIdToUse = ngoId;
    let ngoName = 'NGO';
    let is80GEligible = false;

    // Handle Campaign Donation
    if (campaignId && Campaign) {
      const campaign = await Campaign.findById(campaignId);
      if (campaign) {
        campaignTitle = campaign.title;
        ngoIdToUse = campaign.ngoId;
        ngoName = campaign.ngoName;
        is80GEligible = campaign.is80GEligible || false;

        // Update campaign stats
        campaign.raisedAmount += amount;
        campaign.stats.totalDonors += 1;
        campaign.stats.totalDonations += 1;
        await campaign.save();
        console.log('✅ Campaign updated:', campaign._id);
      }
    }

    // Handle Donation Request Donation
    let DonationRequest;
    try {
      DonationRequest = mongoose.model('DonationRequest');
    } catch (error) {
      console.log('⚠️ DonationRequest model not found');
    }

    if (donationRequestId && DonationRequest) {
      const donationRequest = await DonationRequest.findById(donationRequestId);
      if (donationRequest) {
        campaignTitle = donationRequest.purpose;
        ngoIdToUse = donationRequest.ngoId || ngoIdToUse;
        ngoName = donationRequest.ngoName;

        // Update donation request stats
        donationRequest.fundedAmount += amount;
        donationRequest.stats.totalDonors += 1;
        donationRequest.stats.totalDonations += 1;

        // Check if completed
        if (donationRequest.fundedAmount >= donationRequest.requestedAmount) {
          donationRequest.status = 'completed';
        }

        await donationRequest.save();
        console.log('✅ Donation request updated:', donationRequest._id);
      }
    }

    // Create donation record
    const donation = await Donation.create({
      donorId,
      donorName: isAnonymous ? 'Anonymous' : donorName,
      donorEmail: donorEmail,
      campaignId: campaignId || null,
      campaignTitle,
      ngoId: ngoIdToUse,
      ngoName,
      purpose: campaignTitle || 'General Donation',
      amount,
      paymentMethod: 'credit_card',
      transactionId: paymentIntentId,
      paymentStatus: 'completed',
      isAnonymous: isAnonymous || false,
      donorMessage: donorMessage || '',
      donatedAt: new Date(),
      processedAt: new Date(),
      taxReceipt: {
        is80GCertificate: is80GEligible
      }
    });

    console.log('✅ Donation saved:', donation._id);

    // 🔔 NOTIFICATION: Send notifications for the donation
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 NOTIFICATION TRIGGER: Donation Received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 Amount: ₹' + amount);
    console.log('👤 Donor:', donorName);
    console.log('📋 Campaign:', campaignTitle);

    try {
      // 1. Thank the donor (if not anonymous and has valid ID)
      if (!isAnonymous && donorId && mongoose.Types.ObjectId.isValid(donorId)) {
        console.log('📤 Creating thank you notification for donor:', donorId);
        await NotificationService.createNotification({
          recipientId: donorId,
          recipientRole: 'donor',
          type: 'donation_thank_you',
          title: '🙏 Thank You for Your Donation!',
          message: `Thank you for your generous donation of ₹${amount.toLocaleString()} to "${campaignTitle}". Your support makes a real difference!`,
          relatedEntity: {
            entityType: 'donation',
            entityId: donation._id
          },
          metadata: {
            amount: amount,
            campaignName: campaignTitle,
            campaignId: campaignId,
            donationId: donation._id
          },
          priority: 'medium'
        });
        console.log('✅ Thank you notification created for donor');
      }

      // 2. Notify ONLY the admin who created the campaign
      console.log('🔍 Finding campaign creator admin to notify...');

      let campaignCreatorAdmin = null;
      if (campaignId && Campaign) {
        const campaign = await Campaign.findById(campaignId);
        if (campaign && campaign.createdBy) {
          campaignCreatorAdmin = await User.findOne({
            _id: campaign.createdBy,
            role: 'admin'
          });

          if (campaignCreatorAdmin) {
            console.log(`📤 Creating notification for campaign creator: ${campaignCreatorAdmin._id}`);
            await NotificationService.createNotification({
              recipientId: campaignCreatorAdmin._id,
              recipientRole: 'admin',
              type: 'new_donation',
              title: '💰 New Donation Received!',
              message: `${isAnonymous ? 'An anonymous donor' : donorName} donated ₹${amount.toLocaleString()} to "${campaignTitle}"`,
              relatedEntity: {
                entityType: 'donation',
                entityId: donation._id
              },
              metadata: {
                amount: amount,
                donorName: isAnonymous ? 'Anonymous' : donorName,
                campaignName: campaignTitle,
                campaignId: campaignId,
                donationId: donation._id,
                isAnonymous: isAnonymous
              },
              priority: 'high'
            });
            console.log(`✅ Created notification for campaign creator admin only`);
          } else {
            console.log('⚠️ Campaign creator admin not found');
          }
        } else {
          console.log('⚠️ Campaign not found or has no creator');
        }
      } else {
        console.log('⚠️ No campaignId provided, skipping admin notification');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (notifError) {
      console.error('❌ Error creating donation notifications:', notifError.message);
      console.error('❌ Stack:', notifError.stack);
      // Don't fail the donation if notifications fail
    }

    // 📧 EMAIL: Send donation emails
    try {
      // Send thank you email to donor
      if (!isAnonymous && donorEmail) {
        console.log('📧 Sending donation receipt email to donor:', donorEmail);
        await sendDonationReceivedEmail(
          donorEmail,
          donorName,
          amount,
          campaignTitle,
          ngoName
        );
        console.log('✅ Donation receipt email sent to donor');
      }

      // Send notification email to the NGO admin
      if (ngoIdToUse) {
        const ngoAdmin = await User.findOne({ _id: ngoIdToUse, role: 'admin' });

        if (ngoAdmin && ngoAdmin.email) {
          console.log('📧 Sending donation notification email to admin:', ngoAdmin.email);
          await sendAdminDonationNotificationEmail(
            ngoAdmin.email,
            ngoAdmin.fullName || ngoAdmin.name || 'Admin',
            isAnonymous ? 'Anonymous Donor' : donorName,
            amount,
            campaignTitle
          );
          console.log('✅ Admin donation notification email sent');
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending donation emails:', emailError.message);
      // Don't fail the donation if emails fail
    }

    res.json({
      success: true,
      message: 'Donation successful!',
      data: {
        donationId: donation._id,
        transactionId: paymentIntentId,
        amount: amount,
        campaign: campaignTitle
      }
    });
  } catch (error) {
    console.error('❌ Donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process donation',
      error: error.message
    });
  }
});

export default router;