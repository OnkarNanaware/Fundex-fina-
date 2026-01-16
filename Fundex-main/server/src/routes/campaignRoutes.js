// server/src/routes/campaignRoutes.js
import express from 'express';
import Campaign from '../models/Campaign.js';
import NGO from '../models/NGO.js';
import { getNGOTrustScore } from '../services/trustScoreService.js';

const router = express.Router();

/**
 * GET /api/campaigns/active
 * Get all active campaigns with filters, sorting, and pagination
 * Includes NGO trust score and fund utilization metrics
 */
router.get('/active', async (req, res) => {
    try {
        const {
            search,
            category,
            urgency,
            location,
            fundingRange,
            ngoId,
            sortBy = 'trending',
            page = 1,
            limit = 12
        } = req.query;

        // Build query
        const query = {
            status: 'active',
            approvalStatus: 'approved'
        };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (urgency && urgency !== 'all') {
            query.urgency = urgency;
        }

        if (location && location !== 'all') {
            query['location.state'] = location;
        }

        if (ngoId && ngoId !== 'all') {
            query.ngoId = ngoId;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { ngoName: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        if (fundingRange && fundingRange !== 'all') {
            const ranges = {
                'under-50k': { $lt: 50000 },
                '50k-1l': { $gte: 50000, $lt: 100000 },
                '1l-5l': { $gte: 100000, $lt: 500000 },
                'above-5l': { $gte: 500000 }
            };
            if (ranges[fundingRange]) {
                query.targetAmount = ranges[fundingRange];
            }
        }

        // Build sort
        let sort = {};
        switch (sortBy) {
            case 'newest':
                sort = { createdAt: -1 };
                break;
            case 'ending-soon':
                sort = { endDate: 1 };
                break;
            case 'most-funded':
                sort = { raisedAmount: -1 };
                break;
            case 'least-funded':
                sort = { raisedAmount: 1 };
                break;
            case 'trending':
            default:
                sort = { 'stats.totalDonors': -1, raisedAmount: -1 };
                break;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalCampaigns = await Campaign.countDocuments(query);
        const totalPages = Math.ceil(totalCampaigns / parseInt(limit));

        // Fetch campaigns
        const campaigns = await Campaign.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Enrich with NGO trust scores
        const enrichedCampaigns = await Promise.all(
            campaigns.map(async (campaign) => {
                try {
                    // Get NGO trust score
                    const ngo = await NGO.findById(campaign.ngoId).lean();
                    let trustScore = 75; // Default
                    let fundMetrics = {};

                    if (ngo) {
                        // Check if we have cached trust score (less than 24 hours old)
                        const cacheAge = ngo.trustScore?.lastCalculated
                            ? Date.now() - new Date(ngo.trustScore.lastCalculated).getTime()
                            : Infinity;

                        if (cacheAge < 24 * 60 * 60 * 1000 && ngo.trustScore?.score) {
                            // Use cached score
                            trustScore = ngo.trustScore.score;
                            fundMetrics = ngo.fundMetrics || {};
                        } else {
                            // Calculate fresh score
                            const scoreData = await getNGOTrustScore(campaign.ngoId);
                            trustScore = scoreData.trustScore;
                            fundMetrics = scoreData.fundMetrics;

                            // Update NGO with new score (fire and forget)
                            NGO.findByIdAndUpdate(campaign.ngoId, {
                                'trustScore.score': trustScore,
                                'trustScore.lastCalculated': new Date(),
                                'trustScore.breakdown': scoreData.breakdown,
                                fundMetrics: fundMetrics
                            }).catch(err => console.error('Error updating NGO trust score:', err));
                        }
                    }

                    // Calculate campaign progress and days left
                    const progress = campaign.targetAmount > 0
                        ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)
                        : 0;

                    const daysLeft = campaign.endDate
                        ? Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
                        : 0;

                    return {
                        ...campaign,
                        progress,
                        daysLeft,
                        ngoTrustScore: trustScore,
                        ngoFundMetrics: fundMetrics
                    };
                } catch (error) {
                    console.error(`Error enriching campaign ${campaign._id}:`, error);
                    return {
                        ...campaign,
                        progress: 0,
                        daysLeft: 0,
                        ngoTrustScore: 75,
                        ngoFundMetrics: {}
                    };
                }
            })
        );

        res.json({
            success: true,
            data: {
                campaigns: enrichedCampaigns,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCampaigns,
                    hasMore: parseInt(page) < totalPages
                }
            }
        });
    } catch (error) {
        console.error('Error fetching active campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch campaigns',
            error: error.message
        });
    }
});

/**
 * GET /api/campaigns/filter-options
 * Get available filter options
 */
router.get('/filter-options', async (req, res) => {
    try {
        const [categories, locations, ngos] = await Promise.all([
            Campaign.distinct('category', { status: 'active', approvalStatus: 'approved' }),
            Campaign.distinct('location.state', { status: 'active', approvalStatus: 'approved' }),
            NGO.find({ status: 'active' }).select('_id ngoName').lean()
        ]);

        res.json({
            success: true,
            data: {
                categories: ['all', ...categories],
                locations: ['all', ...locations.filter(Boolean)],
                ngos: [
                    { _id: 'all', name: 'All NGOs' },
                    ...ngos.map(ngo => ({ _id: ngo._id, name: ngo.ngoName }))
                ],
                urgencyLevels: ['all', 'high', 'medium', 'low'],
                fundingRanges: [
                    { value: 'all', label: 'All Amounts' },
                    { value: 'under-50k', label: 'Under ₹50,000' },
                    { value: '50k-1l', label: '₹50,000 - ₹1,00,000' },
                    { value: '1l-5l', label: '₹1,00,000 - ₹5,00,000' },
                    { value: 'above-5l', label: 'Above ₹5,00,000' }
                ]
            }
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch filter options',
            error: error.message
        });
    }
});

/**
 * GET /api/campaigns/stats
 * Get overall campaign statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const campaigns = await Campaign.find({
            status: 'active',
            approvalStatus: 'approved'
        }).lean();

        const totalCampaigns = campaigns.length;
        const totalBackers = campaigns.reduce((sum, c) => sum + (c.stats?.totalDonors || 0), 0);
        const totalRaised = campaigns.reduce((sum, c) => sum + (c.raisedAmount || 0), 0);

        res.json({
            success: true,
            data: {
                totalCampaigns,
                totalBackers,
                totalRaised
            }
        });
    } catch (error) {
        console.error('Error fetching campaign stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch campaign stats',
            error: error.message
        });
    }
});

/**
 * GET /api/campaigns/:id
 * Get single campaign by ID with NGO trust score
 */
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id).lean();

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Get NGO trust score
        const scoreData = await getNGOTrustScore(campaign.ngoId);

        const progress = campaign.targetAmount > 0
            ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)
            : 0;

        const daysLeft = campaign.endDate
            ? Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
            : 0;

        res.json({
            success: true,
            data: {
                ...campaign,
                progress,
                daysLeft,
                ngoTrustScore: scoreData.trustScore,
                ngoFundMetrics: scoreData.fundMetrics
            }
        });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch campaign',
            error: error.message
        });
    }
});

export default router;
