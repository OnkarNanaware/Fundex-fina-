import Expense from "../models/Expense.js";
import VolunteerRequest from "../models/VolunteerRequest.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import User from "../models/User.js";

export const getOverallStats = async (req, res) => {
  try {
    // Only admin/finance allowed
    if (req.user.role !== "admin" && req.user.role !== "finance") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get logged in admin
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.ngoId) {
      return res.status(404).json({ message: 'Admin details not found' });
    }

    // Get all campaigns for this NGO
    const campaigns = await Campaign.find({ ngoId: admin.ngoId }).select('_id');
    const campaignIds = campaigns.map(c => c._id);

    // Get volunteer requests for this NGO's campaigns
    const requests = await VolunteerRequest.find({
      status: "approved",
      campaignId: { $in: campaignIds }
    });

    // Get request IDs to filter expenses
    const requestIds = requests.map(r => r._id);
    const expenses = await Expense.find({
      requestId: { $in: requestIds }
    });

    const totalApproved = requests.reduce((sum, r) => sum + (r.approvedAmount || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amountSpent || 0), 0);

    const utilization =
      totalApproved > 0
        ? ((totalSpent / totalApproved) * 100).toFixed(2)
        : 0;

    console.log(`✅ Overall stats for NGO ${admin.ngoId}: Approved=${totalApproved}, Spent=${totalSpent}`);
    res.json({
      totalApproved,
      totalSpent,
      utilization: Number(utilization),
    });
  } catch (err) {
    console.error('Error fetching overall stats:', err);
    res.status(500).json({ message: err.message });
  }
};

// New comprehensive dashboard stats endpoint
export const getDashboardStats = async (req, res) => {
  try {
    // Get logged in admin
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.ngoId) {
      return res.status(404).json({ message: 'Admin details not found' });
    }

    console.log(`📊 Fetching dashboard stats for NGO ${admin.ngoId}`);

    // Get all campaigns for this NGO first
    const campaigns = await Campaign.find({ ngoId: admin.ngoId });
    const campaignIds = campaigns.map(c => c._id);

    // Get volunteer requests for this NGO's campaigns
    const volunteerRequests = await VolunteerRequest.find({
      campaignId: { $in: campaignIds }
    });

    // Get request IDs to filter expenses
    const requestIds = volunteerRequests.map(r => r._id);

    // Parallel queries for better performance (filtered by NGO)
    const [
      // donations removed from here

      expenses,
      volunteers
    ] = await Promise.all([
      // Donation query moved below to fix status check
      Expense.find({
        requestId: { $in: requestIds }
      }),
      User.countDocuments({
        role: 'volunteer',
        ngoId: admin.ngoId
      })
    ]);

    // Calculate total funds from verified donations for this NGO's campaigns
    // Fixed: Check paymentStatus instead of status, and check both ngoId and campaignId
    const donations = await Donation.find({
      $or: [
        { campaignId: { $in: campaignIds } },
        { ngoId: admin.ngoId }
      ],
      paymentStatus: { $in: ['verified', 'completed'] }
    });

    const totalFunds = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate total allocated to this NGO's campaigns (Budgeted)
    const totalAllocated = campaigns.reduce((sum, c) => sum + (c.allocatedAmount || 0), 0);

    // Calculate total distributed to volunteers (Approved requests)
    const approvedRequests = volunteerRequests.filter(r => r.status === 'approved');
    const totalDistributed = approvedRequests.reduce((sum, r) => sum + (r.approvedAmount || 0), 0);

    // Calculate total spent from expenses
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amountSpent || 0), 0);

    // Calculate available funds (Total Donations - Total Distributed/Approved to Volunteers)
    // The user requested: "when admin give some money to the volunteer then avialable fund filed should updated"
    const availableFunds = totalFunds - totalDistributed;

    // Count pending volunteer requests
    const pendingRequests = volunteerRequests.filter(r => r.status === 'pending').length;

    // Count pending expense verifications (expenses without approval)
    const pendingVerification = expenses.filter(e => !e.verified).length;

    // Calculate transparency score (campaigns with high transparency)
    const campaignsWithHighTransparency = campaigns.filter(c =>
      (c.stats?.transparencyScore || 0) >= 80
    ).length;
    const transparencyScore = campaigns.length > 0
      ? Math.round((campaignsWithHighTransparency / campaigns.length) * 100)
      : 100;

    // Count fraud alerts (expenses flagged or high fraud score)
    const fraudAlerts = expenses.filter(e =>
      e.fraudScore > 30 || e.aiStatus === 'flagged'
    ).length;

    // Count active campaigns
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    // Calculate total raised across all campaigns
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.raisedAmount || 0), 0);

    // Calculate total donors (unique donors from campaigns stats)
    const totalDonors = campaigns.reduce((sum, c) => sum + (c.stats?.totalDonors || 0), 0);

    // Calculate average campaign progress
    const avgProgress = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.stats?.progress || 0), 0) / campaigns.length
      : 0;

    // Count donors who donated to this NGO's campaigns
    const registeredDonors = await User.countDocuments({
      role: 'donor',
      // Note: We can't directly filter donors by NGO, so we count all donors
      // In a real scenario, you might want to track which donors donated to which NGO
    });

    const stats = {
      totalFunds,
      availableFunds,
      totalAllocated,
      totalSpent,
      totalRaised,
      pendingRequests,
      pendingVerification,
      transparencyScore,
      fraudAlerts,
      activeCampaigns,
      totalCampaigns: campaigns.length,
      completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
      pausedCampaigns: campaigns.filter(c => c.status === 'paused').length,
      totalDonors,
      totalVolunteers: volunteers,
      registeredDonors,
      approvedRequests: volunteerRequests.filter(r => r.status === 'approved').length,
      rejectedRequests: volunteerRequests.filter(r => r.status === 'rejected').length,
      avgCampaignProgress: Math.round(avgProgress),
      totalDonations: donations.length,
      pendingDonations: await Donation.countDocuments({
        campaignId: { $in: campaignIds },
        status: 'pending'
      }),
      verifiedExpenses: expenses.filter(e => e.verified).length,
      totalExpenses: expenses.length
    };

    console.log(`✅ Dashboard stats for NGO ${admin.ngoId}:`, {
      campaigns: stats.totalCampaigns,
      volunteers: stats.totalVolunteers,
      donations: stats.totalDonations
    });

    res.json(stats);
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: err.message });
  }
};

// Report stats endpoint
export const getReportsStats = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.ngoId) {
      return res.status(404).json({ message: 'Admin details not found' });
    }

    // Get campaigns
    const campaigns = await Campaign.find({ ngoId: admin.ngoId });
    const campaignIds = campaigns.map(c => c._id);

    // Get donations
    const donations = await Donation.find({
      $or: [
        { campaignId: { $in: campaignIds } },
        { ngoId: admin.ngoId }
      ],
      paymentStatus: { $in: ['verified', 'completed'] }
    });

    // Sort donations by date for correct processing
    donations.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const totalFunds = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Get expenses
    const requests = await VolunteerRequest.find({
      campaignId: { $in: campaignIds }
    });
    const requestIds = requests.map(r => r._id);
    const expenses = await Expense.find({
      requestId: { $in: requestIds }
    });

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    const transparencyScore = campaigns.length > 0
      ? Math.round(campaigns.reduce((sum, c) => sum + (c.stats?.transparencyScore || 0), 0) / campaigns.length)
      : 100;

    // Monthly Trends (Last 6 months)
    const monthlyDonations = {};
    const monthlyExpenses = {};
    const monthlyCampaigns = {};

    // Initialize last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      last6Months.push(monthKey);
      monthlyDonations[monthKey] = 0;
      monthlyExpenses[monthKey] = 0;
      monthlyCampaigns[monthKey] = 0;
    }

    donations.forEach(d => {
      const month = new Date(d.createdAt).toLocaleString('default', { month: 'short' });
      if (monthlyDonations.hasOwnProperty(month)) {
        monthlyDonations[month] += d.amount || 0;
      }
    });

    expenses.forEach(e => {
      const month = new Date(e.createdAt).toLocaleString('default', { month: 'short' });
      if (monthlyExpenses.hasOwnProperty(month)) {
        monthlyExpenses[month] += e.amountSpent || 0;
      }
    });

    campaigns.forEach(c => {
      const month = new Date(c.createdAt).toLocaleString('default', { month: 'short' });
      if (monthlyCampaigns.hasOwnProperty(month)) {
        monthlyCampaigns[month] += 1;
      }
    });

    const monthlyData = last6Months.map(month => ({
      month,
      donations: monthlyDonations[month],
      expenses: monthlyExpenses[month],
      campaigns: monthlyCampaigns[month]
    }));

    // Category Breakdown
    const categories = {};
    campaigns.forEach(c => {
      const cat = c.category || 'Other';
      if (!categories[cat]) {
        categories[cat] = { amount: 0, campaigns: 0 };
      }
      categories[cat].amount += c.raisedAmount || 0;
      categories[cat].campaigns += 1;
    });

    const categoryColors = {
      "Healthcare": "#E53935",
      "Education": "#1E88E5",
      "Food & Nutrition": "#FB8C00",
      "Water & Sanitation": "#039BE5",
      "Environment": "#43A047",
      "Animal Welfare": "#8E24AA"
    };

    const categoryBreakdown = Object.keys(categories).map(cat => ({
      category: cat,
      amount: categories[cat].amount,
      percentage: totalFunds > 0 ? Math.round((categories[cat].amount / totalFunds) * 100) : 0,
      campaigns: categories[cat].campaigns,
      color: categoryColors[cat] || '#757575'
    })).sort((a, b) => b.amount - a.amount);

    // Donor Insights
    const uniqueDonorIds = [...new Set(donations.map(d => d.donorId?.toString()).filter(Boolean))];
    const totalDonors = uniqueDonorIds.length;

    // Simple logic: donor count > 1 means recurring
    const donorCounts = {};
    donations.forEach(d => {
      if (d.donorId) {
        const id = d.donorId.toString();
        donorCounts[id] = (donorCounts[id] || 0) + 1;
      }
    });
    const recurringDonors = Object.values(donorCounts).filter(c => c > 1).length;

    // New donors in current month
    const thisMonth = new Date().getMonth();
    const newDonors = uniqueDonorIds.filter(id => {
      const theirDonations = donations.filter(d => d.donorId?.toString() === id);
      // If their first donation was this month
      return theirDonations.length > 0 && new Date(theirDonations[0].createdAt).getMonth() === thisMonth;
    }).length;

    // Campaign Performance
    const campaignPerformance = campaigns.map(c => ({
      id: c._id,
      title: c.title,
      raised: c.raisedAmount || 0,
      target: c.targetAmount || 0,
      transparency: c.stats?.transparencyScore || 100,
      rating: ((c.stats?.transparencyScore || 80) / 20).toFixed(1), // Mock rating based on transparency
      status: c.status
    }));

    res.json({
      stats: {
        totalFunds,
        totalDonors,
        activeCampaigns,
        transparencyScore
      },
      monthlyData,
      categoryBreakdown,
      donorInsights: {
        totalDonors,
        newDonors,
        recurringDonors,
        averageDonation: donations.length > 0 ? Math.round(totalFunds / donations.length) : 0,
        topDonorAmount: donations.length > 0 ? Math.max(...donations.map(d => d.amount)) : 0,
        donorRetention: totalDonors > 0 ? Math.round((recurringDonors / totalDonors) * 100) : 0
      },
      transparencyMetrics: {
        overallScore: transparencyScore,
        receiptsVerified: expenses.filter(e => e.verified).length,
        receiptsPending: expenses.filter(e => !e.verified).length,
        fraudCases: expenses.filter(e => (e.fraudFlags && e.fraudFlags.length > 0)).length,
        gstVerified: Math.round(transparencyScore * 0.9), // Mock
        aiAccuracy: 98 // Mock
      },
      campaignPerformance // Replacing ngoPerformance
    });

  } catch (err) {
    console.error('Error fetching report stats:', err);
    res.status(500).json({ message: err.message });
  }
};
