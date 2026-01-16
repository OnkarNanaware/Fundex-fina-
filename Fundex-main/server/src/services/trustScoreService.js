/**
 * Trust & Transparency Score Service
 * Calculates NGO-wide trust score based on fraud detection, fund utilization, and transparency metrics
 */

import Expense from '../models/Expense.js';
import FundRequest from '../models/FundRequest.js';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';

/**
 * Calculate comprehensive Trust & Transparency Score for an NGO
 * Score is out of 100, higher is better
 * 
 * @param {String} ngoId - NGO ID
 * @returns {Object} - Trust score and breakdown
 */
export const calculateNGOTrustScore = async (ngoId) => {
    try {
        // Fetch all relevant data
        const [expenses, fundRequests, campaigns, donations] = await Promise.all([
            Expense.find({ ngoId }).lean(),
            FundRequest.find({ ngoId }).lean(),
            Campaign.find({ ngoId }).lean(),
            Donation.find({ ngoId }).lean()
        ]);

        // 1. FRAUD SCORE COMPONENT (40 points)
        // Lower fraud scores = higher trust
        const fraudScoreComponent = calculateFraudScoreComponent(expenses);

        // 2. FUND UTILIZATION COMPONENT (30 points)
        // How efficiently funds are being used
        const utilizationComponent = calculateUtilizationComponent(expenses, fundRequests);

        // 3. TRANSPARENCY COMPONENT (20 points)
        // Verification rates, approval rates
        const transparencyComponent = calculateTransparencyComponent(expenses, fundRequests);

        // 4. DONOR CONFIDENCE COMPONENT (10 points)
        // Campaign success rates, donor retention
        const donorConfidenceComponent = calculateDonorConfidenceComponent(campaigns, donations);

        // Calculate total score
        const totalScore = Math.round(
            fraudScoreComponent.score +
            utilizationComponent.score +
            transparencyComponent.score +
            donorConfidenceComponent.score
        );

        // Calculate fund utilization metrics
        const fundMetrics = calculateFundMetrics(campaigns, donations, expenses, fundRequests);

        return {
            trustScore: Math.min(100, Math.max(0, totalScore)),
            breakdown: {
                fraudScore: fraudScoreComponent,
                utilization: utilizationComponent,
                transparency: transparencyComponent,
                donorConfidence: donorConfidenceComponent
            },
            fundMetrics,
            lastCalculated: new Date()
        };
    } catch (error) {
        console.error('Error calculating NGO trust score:', error);
        throw error;
    }
};

/**
 * Calculate Fraud Score Component (40 points max)
 * Lower fraud scores across expenses = higher trust
 */
const calculateFraudScoreComponent = (expenses) => {
    if (!expenses || expenses.length === 0) {
        return {
            score: 40,
            details: 'No expenses submitted yet',
            avgFraudScore: 0
        };
    }

    // Calculate average fraud score
    const totalFraudScore = expenses.reduce((sum, e) => sum + (e.fraudScore || 0), 0);
    const avgFraudScore = totalFraudScore / expenses.length;

    // Convert fraud score to trust score (inverse relationship)
    // 0 fraud = 40 points, 100 fraud = 0 points
    const score = Math.round(40 * (1 - avgFraudScore / 100));

    // Count high-risk expenses
    const highRiskCount = expenses.filter(e => (e.fraudScore || 0) >= 60).length;
    const highRiskPercentage = ((highRiskCount / expenses.length) * 100).toFixed(1);

    return {
        score,
        details: `Average fraud score: ${avgFraudScore.toFixed(1)}/100`,
        avgFraudScore: avgFraudScore.toFixed(1),
        highRiskPercentage,
        totalExpenses: expenses.length,
        highRiskExpenses: highRiskCount
    };
};

/**
 * Calculate Fund Utilization Component (30 points max)
 * How efficiently approved funds are being utilized
 */
const calculateUtilizationComponent = (expenses, fundRequests) => {
    const approvedRequests = fundRequests.filter(r => r.status === 'approved');

    if (approvedRequests.length === 0) {
        return {
            score: 30,
            details: 'No fund requests approved yet',
            utilizationRate: 100
        };
    }

    const totalApproved = approvedRequests.reduce((sum, r) => sum + (r.approvedAmount || 0), 0);
    const verifiedExpenses = expenses.filter(e => e.verificationStatus === 'approved');
    const totalSpent = verifiedExpenses.reduce((sum, e) => sum + (e.amountSpent || 0), 0);

    // Calculate utilization rate
    const utilizationRate = totalApproved > 0 ? (totalSpent / totalApproved) * 100 : 0;

    // Optimal utilization is 80-95% (not too low, not overspending)
    let score;
    if (utilizationRate >= 80 && utilizationRate <= 95) {
        score = 30; // Perfect range
    } else if (utilizationRate >= 70 && utilizationRate < 80) {
        score = 25; // Good but underutilized
    } else if (utilizationRate > 95 && utilizationRate <= 100) {
        score = 28; // Fully utilized
    } else if (utilizationRate > 100) {
        score = Math.max(0, 30 - (utilizationRate - 100) * 2); // Penalty for overspending
    } else {
        score = Math.round((utilizationRate / 70) * 20); // Low utilization
    }

    return {
        score: Math.round(score),
        details: `${utilizationRate.toFixed(1)}% of approved funds utilized`,
        utilizationRate: utilizationRate.toFixed(1),
        totalApproved,
        totalSpent
    };
};

/**
 * Calculate Transparency Component (20 points max)
 * Verification rates and approval processes
 */
const calculateTransparencyComponent = (expenses, fundRequests) => {
    let score = 0;

    // Expense verification rate (10 points)
    if (expenses.length > 0) {
        const verifiedExpenses = expenses.filter(e => e.verificationStatus === 'approved').length;
        const verificationRate = (verifiedExpenses / expenses.length) * 100;
        score += Math.round((verificationRate / 100) * 10);
    } else {
        score += 10; // No expenses yet, give benefit of doubt
    }

    // Fund request approval transparency (10 points)
    if (fundRequests.length > 0) {
        const processedRequests = fundRequests.filter(r => r.status !== 'pending').length;
        const processingRate = (processedRequests / fundRequests.length) * 100;
        score += Math.round((processingRate / 100) * 10);
    } else {
        score += 10; // No requests yet, give benefit of doubt
    }

    const verifiedCount = expenses.filter(e => e.verificationStatus === 'approved').length;
    const verificationRate = expenses.length > 0 ? ((verifiedCount / expenses.length) * 100).toFixed(1) : 100;

    return {
        score,
        details: `${verificationRate}% expenses verified`,
        verificationRate,
        verifiedExpenses: verifiedCount,
        totalExpenses: expenses.length
    };
};

/**
 * Calculate Donor Confidence Component (10 points max)
 * Campaign success and donor engagement
 */
const calculateDonorConfidenceComponent = (campaigns, donations) => {
    if (campaigns.length === 0) {
        return {
            score: 10,
            details: 'New NGO - building track record',
            successRate: 0
        };
    }

    // Calculate campaign success rate
    const completedCampaigns = campaigns.filter(c => c.status === 'completed');
    const successfulCampaigns = completedCampaigns.filter(c =>
        c.raisedAmount >= c.targetAmount * 0.8 // 80% of target = success
    );

    const successRate = completedCampaigns.length > 0
        ? (successfulCampaigns.length / completedCampaigns.length) * 100
        : 50; // Neutral for new NGOs

    // Active campaign performance
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const avgProgress = activeCampaigns.length > 0
        ? activeCampaigns.reduce((sum, c) => sum + ((c.raisedAmount / c.targetAmount) * 100), 0) / activeCampaigns.length
        : 50;

    // Combine metrics
    const score = Math.round(((successRate * 0.6) + (avgProgress * 0.4)) / 10);

    return {
        score: Math.min(10, score),
        details: `${successRate.toFixed(0)}% campaign success rate`,
        successRate: successRate.toFixed(1),
        completedCampaigns: completedCampaigns.length,
        successfulCampaigns: successfulCampaigns.length,
        avgProgress: avgProgress.toFixed(1)
    };
};

/**
 * Calculate Fund Metrics for Donor Display
 */
const calculateFundMetrics = (campaigns, donations, expenses, fundRequests) => {
    const totalRaised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalAllocated = fundRequests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.approvedAmount || 0), 0);
    const totalSpent = expenses
        .filter(e => e.verificationStatus === 'approved')
        .reduce((sum, e) => sum + (e.amountSpent || 0), 0);
    const availableFunds = totalRaised - totalAllocated;

    // Calculate utilization percentage
    const utilizationPercentage = totalRaised > 0 ? ((totalSpent / totalRaised) * 100).toFixed(1) : 0;

    return {
        totalRaised,
        totalAllocated,
        totalSpent,
        availableFunds,
        utilizationPercentage,
        totalDonors: new Set(donations.map(d => d.donorId?.toString())).size,
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length
    };
};

/**
 * Get cached trust score or calculate new one
 */
export const getNGOTrustScore = async (ngoId, forceRecalculate = false) => {
    try {
        // For now, always calculate fresh
        // In production, you might want to cache this in the NGO model
        return await calculateNGOTrustScore(ngoId);
    } catch (error) {
        console.error('Error getting NGO trust score:', error);
        // Return default safe score
        return {
            trustScore: 75,
            breakdown: {},
            fundMetrics: {},
            lastCalculated: new Date(),
            error: 'Could not calculate trust score'
        };
    }
};

export default {
    calculateNGOTrustScore,
    getNGOTrustScore
};
