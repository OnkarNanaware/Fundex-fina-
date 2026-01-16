// server/src/routes/donationRequestRoutes.js
import express from 'express';
import DonationRequest from '../models/DonationRequest.js';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { sendFundingRequestToDonorEmail } from '../services/emailService.js';

const router = express.Router();

// Get donation requests for a specific donor
router.get('/donor/:donorId', authMiddleware, async (req, res) => {
    try {
        const { donorId } = req.params;
        const { status } = req.query;

        console.log('📥 Fetching donation requests for donor:', donorId);

        const query = { donorId };
        if (status && status !== 'all') {
            query.status = status;
        }

        const requests = await DonationRequest.find(query)
            .populate('campaignId', 'title description category coverImage targetAmount raisedAmount progress location')
            .populate('ngoId', 'ngoName email')
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${requests.length} donation requests for donor`);

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('❌ Error fetching donor requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donation requests',
            error: error.message
        });
    }
});

// Get donation requests created by NGO
router.get('/ngo/:ngoId', authMiddleware, async (req, res) => {
    try {
        const { ngoId } = req.params;
        const { status } = req.query;

        const query = { ngoId };
        if (status && status !== 'all') {
            query.status = status;
        }

        const requests = await DonationRequest.find(query)
            .populate('campaignId', 'title description category targetAmount raisedAmount')
            .populate('donorId', 'donorFirstName donorLastName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Error fetching NGO requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donation requests',
            error: error.message
        });
    }
});

// Create new donation request (NGO to Donor)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            campaignId,
            donorId,
            requestedAmount,
            message,
            urgency,
            expiryDate
        } = req.body;

        console.log('📝 Creating donation request:', {
            campaignId,
            donorId,
            requestedAmount
        });

        // Validate campaign exists
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Validate donor exists
        const donor = await User.findById(donorId);
        if (!donor || donor.role !== 'donor') {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        // Get NGO details from authenticated user
        const ngo = await User.findById(req.user.id);
        if (!ngo || ngo.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only NGOs can create donation requests'
            });
        }

        // Create donation request
        const donationRequest = await DonationRequest.create({
            campaignId,
            ngoId: ngo._id,
            ngoName: ngo.ngoName,
            donorId,
            donorName: `${donor.donorFirstName} ${donor.donorLastName}`.trim() || donor.fullName,
            donorEmail: donor.email,
            requestedAmount,
            message: message || '',
            urgency: urgency || 'medium',
            expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            status: 'pending'
        });

        console.log('✅ Donation request created:', donationRequest._id);

        // Populate campaign details for response
        await donationRequest.populate('campaignId', 'title description category coverImage');

        // 📧 EMAIL: Send funding request email to donor
        try {
            await sendFundingRequestToDonorEmail(
                donor.email,
                `${donor.donorFirstName} ${donor.donorLastName}`.trim() || donor.fullName,
                ngo.ngoName,
                campaign.title,
                requestedAmount,
                message || ''
            );
            console.log('✅ Funding request email sent to donor');
        } catch (emailError) {
            console.error('❌ Error sending funding request email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Donation request sent successfully',
            data: donationRequest
        });
    } catch (error) {
        console.error('❌ Error creating donation request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create donation request',
            error: error.message
        });
    }
});

// Update donation request status (donor response)
router.patch('/:id/respond', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;

        const donationRequest = await DonationRequest.findById(id);

        if (!donationRequest) {
            return res.status(404).json({
                success: false,
                message: 'Donation request not found'
            });
        }

        // Verify the authenticated user is the donor
        if (donationRequest.donorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to respond to this request'
            });
        }

        donationRequest.status = status;
        donationRequest.donorResponse = {
            message: message || '',
            respondedAt: new Date()
        };

        await donationRequest.save();

        res.json({
            success: true,
            message: `Request ${status} successfully`,
            data: donationRequest
        });
    } catch (error) {
        console.error('Error updating donation request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update donation request',
            error: error.message
        });
    }
});

// Get single donation request
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const request = await DonationRequest.findById(req.params.id)
            .populate('campaignId')
            .populate('ngoId', 'ngoName email')
            .populate('donorId', 'donorFirstName donorLastName email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Donation request not found'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error fetching donation request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donation request',
            error: error.message
        });
    }
});

// Search donors (for NGO to create requests)
router.get('/search/donors', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const donors = await User.find({
            role: 'donor',
            $or: [
                { donorFirstName: { $regex: query, $options: 'i' } },
                { donorLastName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } }
            ]
        })
            .select('donorFirstName donorLastName email fullName')
            .limit(10);

        const formattedDonors = donors.map(donor => ({
            _id: donor._id,
            name: `${donor.donorFirstName || ''} ${donor.donorLastName || ''}`.trim() || donor.fullName,
            email: donor.email
        }));

        res.json({
            success: true,
            data: formattedDonors
        });
    } catch (error) {
        console.error('Error searching donors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search donors',
            error: error.message
        });
    }
});

export default router;
