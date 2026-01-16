// server/routes/campaign.routes.js
import express from 'express';
import Campaign from '../models/Campaign.js';

const router = express.Router();

// Get all active campaigns
router.get('/active', async (req, res) => {
  try {
    const {
      search,
      category,
      urgency,
      location,
      ngoId,
      sortBy = 'trending',
      page = 1,
      limit = 12
    } = req.query;

    console.log('🔍 Fetching campaigns with filters:', { search, category, urgency, location, sortBy });

    const filter = { status: 'active', approvalStatus: 'approved' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ngoName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (urgency && urgency !== 'all') {
      filter.urgency = urgency;
    }

    if (location && location !== 'all') {
      filter['location.state'] = location;
    }

    if (ngoId && ngoId !== 'all') {
      try {
        filter.ngoId = new mongoose.Types.ObjectId(ngoId);
      } catch (e) {
        console.log('Invalid ngoId');
      }
    }

    let sort = {};
    switch (sortBy) {
      case 'trending':
        sort = { 'stats.totalDonors': -1, createdAt: -1 };
        break;
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
      default:
        sort = { createdAt: -1 };
    }

    const campaigns = await Campaign.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const campaignsWithExtras = campaigns.map(campaign => {
      const endDate = new Date(campaign.endDate);
      const today = new Date();
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      const progress = campaign.targetAmount > 0
        ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)
        : 0;

      return {
        ...campaign,
        daysLeft: Math.max(0, daysLeft),
        progress
      };
    });

    const totalCount = await Campaign.countDocuments(filter);

    console.log(`✅ Found ${campaigns.length} of ${totalCount} campaigns`);

    res.status(200).json({
      success: true,
      data: {
        campaigns: campaignsWithExtras,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCampaigns: totalCount,
          hasMore: page * limit < totalCount
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

// Get filter options
router.get('/filter-options', async (req, res) => {
  try {
    const categories = await Campaign.distinct('category', {
      status: 'active',
      approvalStatus: 'approved'
    });

    const locations = await Campaign.distinct('location.state', {
      status: 'active',
      approvalStatus: 'approved'
    });

    const ngos = await Campaign.aggregate([
      { $match: { status: 'active', approvalStatus: 'approved' } },
      { $group: { _id: '$ngoId', name: { $first: '$ngoName' } } },
      { $project: { _id: 1, name: 1 } }
    ]);

    console.log(`✅ Filter options loaded`);

    res.status(200).json({
      success: true,
      data: {
        categories: ['all', ...categories],
        locations: ['all', ...locations],
        ngos: [{ _id: 'all', name: 'All NGOs' }, ...ngos],
        urgencyLevels: ['all', 'high', 'medium', 'low'],
        fundingRanges: [
          { value: 'all', label: 'All Amounts' },
          { value: 'small', label: 'Under ₹1L' },
          { value: 'medium', label: '₹1L - ₹3L' },
          { value: 'large', label: 'Above ₹3L' }
        ]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message
    });
  }
});

// Get campaign stats
router.get('/stats', async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments({
      status: 'active',
      approvalStatus: 'approved'
    });

    const stats = await Campaign.aggregate([
      { $match: { status: 'active', approvalStatus: 'approved' } },
      {
        $group: {
          _id: null,
          totalBackers: { $sum: '$stats.totalDonors' },
          totalRaised: { $sum: '$raisedAmount' }
        }
      }
    ]);

    const data = stats[0] || { totalBackers: 0, totalRaised: 0 };

    console.log(`✅ Campaign stats loaded`);

    res.status(200).json({
      success: true,
      data: {
        totalCampaigns,
        totalBackers: data.totalBackers,
        totalRaised: data.totalRaised
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const endDate = new Date(campaign.endDate);
    const today = new Date();
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    const progress = campaign.targetAmount > 0
      ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ...campaign.toObject(),
        daysLeft: Math.max(0, daysLeft),
        progress
      }
    });
  } catch (error) {
    console.error('❌ Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign',
      error: error.message
    });
  }
});

export default router;
