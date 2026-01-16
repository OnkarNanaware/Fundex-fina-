// server/src/routes/fundRequestRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import FundRequest from '../models/FundRequest.js';

const router = express.Router();

// Get Campaign model
let Campaign;
try {
    Campaign = mongoose.model('Campaign');
} catch (error) {
    console.log('⚠️ Campaign model not found in fundRequestRoutes');
}

// @route   GET /api/fundrequests
// @desc    Get all funding requests (with filters)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            status,
            urgency,
            campaignId,
            volunteerId,
            sortBy = 'requestDate',
            order = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        console.log('🔍 Fetching funding requests with filters:', { status, urgency, campaignId });

        const filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (urgency && urgency !== 'all') {
            filter.urgency = urgency;
        }

        if (campaignId && campaignId !== 'all') {
            try {
                filter.campaignId = new mongoose.Types.ObjectId(campaignId);
            } catch (e) {
                console.log('Invalid campaignId');
            }
        }

        if (volunteerId) {
            try {
                filter.volunteerId = new mongoose.Types.ObjectId(volunteerId);
            } catch (e) {
                console.log('Invalid volunteerId');
            }
        }

        const sortOrder = order === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortOrder };

        const fundRequests = await FundRequest.find(filter)
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('campaignId', 'title ngoName location category targetAmount raisedAmount endDate status')
            .populate('volunteerId', 'fullName email')
            .lean();

        // Enrich with campaign data if available
        const enrichedRequests = fundRequests.map(request => {
            const campaign = request.campaignId;

            if (campaign && typeof campaign === 'object') {
                const progress = campaign.targetAmount > 0
                    ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)
                    : 0;

                const endDate = new Date(campaign.endDate);
                const today = new Date();
                const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                return {
                    ...request,
                    campaign: {
                        ...campaign,
                        progress,
                        daysLeft: Math.max(0, daysLeft)
                    }
                };
            }

            return request;
        });

        const totalCount = await FundRequest.countDocuments(filter);

        console.log(`✅ Found ${fundRequests.length} of ${totalCount} funding requests`);

        res.status(200).json({
            success: true,
            data: {
                fundRequests: enrichedRequests,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalRequests: totalCount,
                    hasMore: page * limit < totalCount
                }
            }
        });
    } catch (error) {
        console.error('❌ Error fetching funding requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch funding requests',
            error: error.message
        });
    }
});

// @route   GET /api/fundrequests/:id
// @desc    Get single funding request by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const fundRequest = await FundRequest.findById(req.params.id)
            .populate('campaignId', 'title ngoName location category targetAmount raisedAmount endDate status images')
            .populate('volunteerId', 'fullName email phone');

        if (!fundRequest) {
            return res.status(404).json({
                success: false,
                message: 'Funding request not found'
            });
        }

        res.status(200).json({
            success: true,
            data: fundRequest
        });
    } catch (error) {
        console.error('❌ Error fetching funding request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch funding request',
            error: error.message
        });
    }
});

// @route   POST /api/fundrequests
// @desc    Create a new funding request
// @access  Private (Volunteer)
router.post('/', async (req, res) => {
    try {
        const {
            volunteerId,
            campaignId,
            campaignTitle,
            purpose,
            description,
            requestedAmount,
            urgency,
            documents
        } = req.body;

        // Validate required fields
        if (!volunteerId || !campaignId || !campaignTitle || !purpose || !description || !requestedAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const fundRequest = await FundRequest.create({
            volunteerId,
            campaignId,
            campaignTitle,
            purpose,
            description,
            requestedAmount,
            urgency: urgency || 'medium',
            documents: documents || [],
            status: 'pending',
            requestDate: new Date()
        });

        console.log('✅ Funding request created:', fundRequest._id);

        res.status(201).json({
            success: true,
            message: 'Funding request created successfully',
            data: fundRequest
        });
    } catch (error) {
        console.error('❌ Error creating funding request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create funding request',
            error: error.message
        });
    }
});

// @route   PATCH /api/fundrequests/:id/status
// @desc    Update funding request status
// @access  Private (Admin)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, approvedBy, rejectionReason } = req.body;

        const updateData = { status };

        if (status === 'approved') {
            updateData.approvedBy = approvedBy;
            updateData.approvedAt = new Date();
        }

        if (status === 'rejected' && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const fundRequest = await FundRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!fundRequest) {
            return res.status(404).json({
                success: false,
                message: 'Funding request not found'
            });
        }

        console.log(`✅ Funding request ${req.params.id} status updated to ${status}`);

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: fundRequest
        });
    } catch (error) {
        console.error('❌ Error updating funding request status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
});

// @route   GET /api/fundrequests/stats/summary
// @desc    Get funding requests statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
    try {
        const totalRequests = await FundRequest.countDocuments();
        const pendingRequests = await FundRequest.countDocuments({ status: 'pending' });
        const approvedRequests = await FundRequest.countDocuments({ status: 'approved' });
        const urgentRequests = await FundRequest.countDocuments({ urgency: 'high', status: 'pending' });

        const totalAmountRequested = await FundRequest.aggregate([
            { $match: { status: { $in: ['pending', 'approved'] } } },
            { $group: { _id: null, total: { $sum: '$requestedAmount' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalRequests,
                pendingRequests,
                approvedRequests,
                urgentRequests,
                totalAmountRequested: totalAmountRequested[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('❌ Error fetching funding request stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

export default router;
