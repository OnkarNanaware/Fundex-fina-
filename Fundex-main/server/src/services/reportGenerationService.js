import PDFDocument from 'pdfkit';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import FundRequest from '../models/FundRequest.js';

/**
 * Report Generation Service
 * Generates professional PDF reports for admin dashboard
 */
class ReportGenerationService {

    /**
     * Generate Financial Summary Report
     * Complete financial overview with transactions
     */
    static async generateFinancialSummary(ngoId, res) {
        try {
            // Fetch data
            const campaigns = await Campaign.find({ ngoId }).lean();
            const donations = await Donation.find({ ngoId }).populate('donorId', 'fullName email').lean();
            const expenses = await Expense.find({ ngoId }).populate('volunteerId', 'fullName').lean();
            const fundRequests = await FundRequest.find({ ngoId }).populate('volunteerId', 'fullName').lean();

            // Calculate totals
            const totalRaised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
            const totalAllocated = fundRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.approvedAmount || 0), 0);
            const totalSpent = expenses.filter(e => e.verificationStatus === 'approved').reduce((sum, e) => sum + (e.amountSpent || 0), 0);
            const availableFunds = totalRaised - totalAllocated;
            const pendingExpenses = expenses.filter(e => e.verificationStatus === 'pending').reduce((sum, e) => sum + (e.amountSpent || 0), 0);

            // Create PDF
            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Financial_Summary_${new Date().toISOString().split('T')[0]}.pdf`);

            doc.pipe(res);

            // Header
            this.addReportHeader(doc, 'Financial Summary Report', 'Complete financial overview with transactions');

            // Summary Section
            doc.fontSize(16).fillColor('#2563eb').text('Financial Overview', { underline: true });
            doc.moveDown(0.5);

            const summaryData = [
                ['Total Funds Raised', `₹${totalRaised.toLocaleString('en-IN')}`],
                ['Total Allocated', `₹${totalAllocated.toLocaleString('en-IN')}`],
                ['Total Spent', `₹${totalSpent.toLocaleString('en-IN')}`],
                ['Available Funds', `₹${availableFunds.toLocaleString('en-IN')}`],
                ['Pending Expenses', `₹${pendingExpenses.toLocaleString('en-IN')}`],
                ['Active Campaigns', campaigns.filter(c => c.status === 'active').length.toString()],
                ['Total Donations', donations.length.toString()],
            ];

            this.addTable(doc, summaryData, ['Metric', 'Value'], 250);
            doc.moveDown(1);

            // Campaign-wise Breakdown
            doc.addPage();
            doc.fontSize(16).fillColor('#2563eb').text('Campaign-wise Financial Breakdown', { underline: true });
            doc.moveDown(0.5);

            campaigns.forEach((campaign, index) => {
                if (index > 0 && index % 8 === 0) doc.addPage();

                doc.fontSize(12).fillColor('#000000').text(`${index + 1}. ${campaign.title}`, { bold: true });
                doc.fontSize(10).fillColor('#666666');
                doc.text(`   Target: ₹${(campaign.targetAmount || 0).toLocaleString('en-IN')}`);
                doc.text(`   Raised: ₹${(campaign.raisedAmount || 0).toLocaleString('en-IN')} (${Math.round((campaign.raisedAmount / campaign.targetAmount) * 100) || 0}%)`);
                doc.text(`   Allocated: ₹${(campaign.allocatedAmount || 0).toLocaleString('en-IN')}`);
                doc.text(`   Spent: ₹${(campaign.spentAmount || 0).toLocaleString('en-IN')}`);
                doc.text(`   Status: ${campaign.status}`);
                doc.moveDown(0.5);
            });

            // Recent Transactions
            doc.addPage();
            doc.fontSize(16).fillColor('#2563eb').text('Recent Transactions (Last 20)', { underline: true });
            doc.moveDown(0.5);

            const recentDonations = donations.slice(0, 20);
            recentDonations.forEach((donation, index) => {
                if (index > 0 && index % 15 === 0) doc.addPage();

                doc.fontSize(10).fillColor('#000000');
                doc.text(`${index + 1}. ${donation.donorId?.fullName || 'Anonymous'} - ₹${(donation.amount || 0).toLocaleString('en-IN')}`);
                doc.fontSize(9).fillColor('#666666');
                doc.text(`   Date: ${new Date(donation.createdAt).toLocaleDateString('en-IN')} | Method: ${donation.paymentMethod || 'N/A'}`);
                doc.moveDown(0.3);
            });

            // Footer
            this.addReportFooter(doc);

            doc.end();
        } catch (error) {
            console.error('Error generating financial summary:', error);
            throw error;
        }
    }

    /**
     * Generate Transparency Report
     * Donor transparency and verification metrics
     */
    static async generateTransparencyReport(ngoId, res) {
        try {
            const campaigns = await Campaign.find({ ngoId }).lean();
            const expenses = await Expense.find({ ngoId }).populate('volunteerId', 'fullName').lean();
            const fundRequests = await FundRequest.find({ ngoId }).populate('volunteerId', 'fullName').lean();

            // Calculate transparency metrics
            const totalExpenses = expenses.length;
            const verifiedExpenses = expenses.filter(e => e.verificationStatus === 'approved').length;
            const flaggedExpenses = expenses.filter(e => e.verificationStatus === 'flagged').length;
            const pendingExpenses = expenses.filter(e => e.verificationStatus === 'pending').length;
            const verificationRate = totalExpenses > 0 ? ((verifiedExpenses / totalExpenses) * 100).toFixed(1) : 0;
            const fraudDetectionRate = totalExpenses > 0 ? ((flaggedExpenses / totalExpenses) * 100).toFixed(1) : 0;

            const totalRequests = fundRequests.length;
            const approvedRequests = fundRequests.filter(r => r.status === 'approved').length;
            const rejectedRequests = fundRequests.filter(r => r.status === 'rejected').length;
            const approvalRate = totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : 0;

            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Transparency_Report_${new Date().toISOString().split('T')[0]}.pdf`);

            doc.pipe(res);

            // Header
            this.addReportHeader(doc, 'Transparency Report', 'Donor transparency and verification metrics');

            // Transparency Score
            const transparencyScore = Math.round((parseFloat(verificationRate) + (100 - parseFloat(fraudDetectionRate))) / 2);
            doc.fontSize(20).fillColor('#10b981').text(`Overall Transparency Score: ${transparencyScore}%`, { align: 'center' });
            doc.moveDown(1);

            // Verification Metrics
            doc.fontSize(16).fillColor('#2563eb').text('Verification Metrics', { underline: true });
            doc.moveDown(0.5);

            const verificationData = [
                ['Total Expenses Submitted', totalExpenses.toString()],
                ['Verified & Approved', `${verifiedExpenses} (${verificationRate}%)`],
                ['Flagged for Review', `${flaggedExpenses} (${fraudDetectionRate}%)`],
                ['Pending Verification', pendingExpenses.toString()],
                ['Verification Rate', `${verificationRate}%`],
            ];

            this.addTable(doc, verificationData, ['Metric', 'Value'], 250);
            doc.moveDown(1);

            // Fund Request Metrics
            doc.fontSize(16).fillColor('#2563eb').text('Fund Request Metrics', { underline: true });
            doc.moveDown(0.5);

            const requestData = [
                ['Total Requests', totalRequests.toString()],
                ['Approved Requests', `${approvedRequests} (${approvalRate}%)`],
                ['Rejected Requests', rejectedRequests.toString()],
                ['Pending Requests', fundRequests.filter(r => r.status === 'pending').length.toString()],
                ['Approval Rate', `${approvalRate}%`],
            ];

            this.addTable(doc, requestData, ['Metric', 'Value'], 250);
            doc.moveDown(1);

            // Campaign Transparency
            doc.addPage();
            doc.fontSize(16).fillColor('#2563eb').text('Campaign Transparency Breakdown', { underline: true });
            doc.moveDown(0.5);

            campaigns.forEach((campaign, index) => {
                if (index > 0 && index % 10 === 0) doc.addPage();

                const campaignTransparency = campaign.stats?.transparencyScore || 0;
                doc.fontSize(12).fillColor('#000000').text(`${index + 1}. ${campaign.title}`);
                doc.fontSize(10).fillColor('#666666');
                doc.text(`   Transparency Score: ${campaignTransparency}%`);
                doc.text(`   Total Donors: ${campaign.stats?.totalDonors || 0}`);
                doc.text(`   Total Volunteers: ${campaign.stats?.totalVolunteers || 0}`);
                doc.text(`   Status: ${campaign.status}`);
                doc.moveDown(0.5);
            });

            // Flagged Expenses Details
            if (flaggedExpenses > 0) {
                doc.addPage();
                doc.fontSize(16).fillColor('#ef4444').text('Flagged Expenses (Requires Attention)', { underline: true });
                doc.moveDown(0.5);

                const flaggedList = expenses.filter(e => e.verificationStatus === 'flagged');
                flaggedList.forEach((expense, index) => {
                    if (index > 0 && index % 8 === 0) doc.addPage();

                    doc.fontSize(11).fillColor('#000000').text(`${index + 1}. ${expense.purpose || 'Expense'}`);
                    doc.fontSize(9).fillColor('#666666');
                    doc.text(`   Amount: ₹${(expense.amountSpent || 0).toLocaleString('en-IN')}`);
                    doc.text(`   Volunteer: ${expense.volunteerId?.fullName || 'Unknown'}`);
                    doc.text(`   Reason: ${expense.flaggedReason || 'Fraud detection'}`);
                    doc.text(`   Date: ${new Date(expense.createdAt).toLocaleDateString('en-IN')}`);
                    doc.moveDown(0.5);
                });
            }

            this.addReportFooter(doc);
            doc.end();
        } catch (error) {
            console.error('Error generating transparency report:', error);
            throw error;
        }
    }

    /**
     * Generate Campaign Analytics Report
     * Detailed campaign performance analysis
     */
    static async generateCampaignAnalytics(ngoId, res) {
        try {
            const campaigns = await Campaign.find({ ngoId }).lean();
            const donations = await Donation.find({ ngoId }).populate('campaignId', 'title').lean();

            // Calculate analytics
            const totalCampaigns = campaigns.length;
            const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
            const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
            const pausedCampaigns = campaigns.filter(c => c.status === 'paused').length;

            const totalTarget = campaigns.reduce((sum, c) => sum + (c.targetAmount || 0), 0);
            const totalRaised = campaigns.reduce((sum, c) => sum + (c.raisedAmount || 0), 0);
            const avgProgress = totalCampaigns > 0 ? ((totalRaised / totalTarget) * 100).toFixed(1) : 0;

            // Category breakdown
            const categoryStats = {};
            campaigns.forEach(c => {
                const cat = c.category || 'Other';
                if (!categoryStats[cat]) {
                    categoryStats[cat] = { count: 0, raised: 0, target: 0 };
                }
                categoryStats[cat].count++;
                categoryStats[cat].raised += c.raisedAmount || 0;
                categoryStats[cat].target += c.targetAmount || 0;
            });

            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Campaign_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);

            doc.pipe(res);

            // Header
            this.addReportHeader(doc, 'Campaign Analytics Report', 'Detailed campaign performance analysis');

            // Overview
            doc.fontSize(16).fillColor('#2563eb').text('Campaign Overview', { underline: true });
            doc.moveDown(0.5);

            const overviewData = [
                ['Total Campaigns', totalCampaigns.toString()],
                ['Active Campaigns', activeCampaigns.toString()],
                ['Completed Campaigns', completedCampaigns.toString()],
                ['Paused Campaigns', pausedCampaigns.toString()],
                ['Total Target Amount', `₹${totalTarget.toLocaleString('en-IN')}`],
                ['Total Raised Amount', `₹${totalRaised.toLocaleString('en-IN')}`],
                ['Average Progress', `${avgProgress}%`],
            ];

            this.addTable(doc, overviewData, ['Metric', 'Value'], 250);
            doc.moveDown(1);

            // Category Breakdown
            doc.fontSize(16).fillColor('#2563eb').text('Category-wise Performance', { underline: true });
            doc.moveDown(0.5);

            Object.entries(categoryStats).forEach(([category, stats]) => {
                const progress = stats.target > 0 ? ((stats.raised / stats.target) * 100).toFixed(1) : 0;
                doc.fontSize(12).fillColor('#000000').text(`${category}:`);
                doc.fontSize(10).fillColor('#666666');
                doc.text(`   Campaigns: ${stats.count}`);
                doc.text(`   Target: ₹${stats.target.toLocaleString('en-IN')}`);
                doc.text(`   Raised: ₹${stats.raised.toLocaleString('en-IN')} (${progress}%)`);
                doc.moveDown(0.5);
            });

            // Top Performing Campaigns
            doc.addPage();
            doc.fontSize(16).fillColor('#2563eb').text('Top Performing Campaigns', { underline: true });
            doc.moveDown(0.5);

            const topCampaigns = campaigns
                .sort((a, b) => (b.raisedAmount || 0) - (a.raisedAmount || 0))
                .slice(0, 10);

            topCampaigns.forEach((campaign, index) => {
                const progress = campaign.targetAmount > 0 ? ((campaign.raisedAmount / campaign.targetAmount) * 100).toFixed(1) : 0;
                doc.fontSize(11).fillColor('#000000').text(`${index + 1}. ${campaign.title}`);
                doc.fontSize(9).fillColor('#666666');
                doc.text(`   Category: ${campaign.category}`);
                doc.text(`   Raised: ₹${(campaign.raisedAmount || 0).toLocaleString('en-IN')} / ₹${(campaign.targetAmount || 0).toLocaleString('en-IN')} (${progress}%)`);
                doc.text(`   Donors: ${campaign.stats?.totalDonors || 0} | Volunteers: ${campaign.stats?.totalVolunteers || 0}`);
                doc.text(`   Status: ${campaign.status}`);
                doc.moveDown(0.5);
            });

            // Campaign Timeline
            doc.addPage();
            doc.fontSize(16).fillColor('#2563eb').text('All Campaigns Details', { underline: true });
            doc.moveDown(0.5);

            campaigns.forEach((campaign, index) => {
                if (index > 0 && index % 6 === 0) doc.addPage();

                const progress = campaign.targetAmount > 0 ? ((campaign.raisedAmount / campaign.targetAmount) * 100).toFixed(1) : 0;
                const daysLeft = campaign.endDate ? Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 'N/A';

                doc.fontSize(11).fillColor('#000000').text(`${index + 1}. ${campaign.title}`);
                doc.fontSize(9).fillColor('#666666');
                doc.text(`   Category: ${campaign.category} | Urgency: ${campaign.urgency || 'medium'}`);
                doc.text(`   Progress: ${progress}% (₹${(campaign.raisedAmount || 0).toLocaleString('en-IN')} / ₹${(campaign.targetAmount || 0).toLocaleString('en-IN')})`);
                doc.text(`   Allocated: ₹${(campaign.allocatedAmount || 0).toLocaleString('en-IN')} | Spent: ₹${(campaign.spentAmount || 0).toLocaleString('en-IN')}`);
                doc.text(`   Days Left: ${daysLeft} | Status: ${campaign.status}`);
                doc.text(`   Location: ${campaign.location?.city || ''}, ${campaign.location?.state || ''}`);
                doc.moveDown(0.5);
            });

            this.addReportFooter(doc);
            doc.end();
        } catch (error) {
            console.error('Error generating campaign analytics:', error);
            throw error;
        }
    }

    /**
     * Generate Donor Report
     * Donor demographics and contribution history
     */
    static async generateDonorReport(ngoId, res) {
        try {
            const donations = await Donation.find({ ngoId })
                .populate('donorId', 'fullName email phone')
                .populate('campaignId', 'title category')
                .lean();

            // Aggregate donor data
            const donorMap = new Map();
            donations.forEach(donation => {
                const donorId = donation.donorId?._id?.toString();
                if (!donorId) return;

                if (!donorMap.has(donorId)) {
                    donorMap.set(donorId, {
                        donor: donation.donorId,
                        totalDonated: 0,
                        donationCount: 0,
                        campaigns: new Set(),
                        firstDonation: donation.createdAt,
                        lastDonation: donation.createdAt,
                        donations: []
                    });
                }

                const donorData = donorMap.get(donorId);
                donorData.totalDonated += donation.amount || 0;
                donorData.donationCount++;
                if (donation.campaignId?.title) {
                    donorData.campaigns.add(donation.campaignId.title);
                }
                donorData.lastDonation = new Date(donation.createdAt) > new Date(donorData.lastDonation)
                    ? donation.createdAt
                    : donorData.lastDonation;
                donorData.donations.push(donation);
            });

            const donors = Array.from(donorMap.values());
            const totalDonors = donors.length;
            const totalDonations = donations.length;
            const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
            const avgDonation = totalDonations > 0 ? (totalAmount / totalDonations).toFixed(2) : 0;

            // Top donors
            const topDonors = donors.sort((a, b) => b.totalDonated - a.totalDonated).slice(0, 20);

            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Donor_Report_${new Date().toISOString().split('T')[0]}.pdf`);

            doc.pipe(res);

            // Header
            this.addReportHeader(doc, 'Donor Report', 'Donor demographics and contribution history');

            // Overview
            doc.fontSize(16).fillColor('#2563eb').text('Donor Overview', { underline: true });
            doc.moveDown(0.5);

            const overviewData = [
                ['Total Registered Donors', totalDonors.toString()],
                ['Total Donations', totalDonations.toString()],
                ['Total Amount Donated', `₹${totalAmount.toLocaleString('en-IN')}`],
                ['Average Donation', `₹${parseFloat(avgDonation).toLocaleString('en-IN')}`],
                ['Average Donations per Donor', (totalDonations / totalDonors || 0).toFixed(1)],
            ];

            this.addTable(doc, overviewData, ['Metric', 'Value'], 250);
            doc.moveDown(1);

            // Top Donors
            doc.fontSize(16).fillColor('#2563eb').text('Top 20 Donors', { underline: true });
            doc.moveDown(0.5);

            topDonors.forEach((donorData, index) => {
                if (index > 0 && index % 10 === 0) doc.addPage();

                doc.fontSize(11).fillColor('#000000').text(`${index + 1}. ${donorData.donor?.fullName || 'Anonymous'}`);
                doc.fontSize(9).fillColor('#666666');
                doc.text(`   Email: ${donorData.donor?.email || 'N/A'}`);
                doc.text(`   Total Donated: ₹${donorData.totalDonated.toLocaleString('en-IN')}`);
                doc.text(`   Number of Donations: ${donorData.donationCount}`);
                doc.text(`   Campaigns Supported: ${donorData.campaigns.size}`);
                doc.text(`   First Donation: ${new Date(donorData.firstDonation).toLocaleDateString('en-IN')}`);
                doc.text(`   Last Donation: ${new Date(donorData.lastDonation).toLocaleDateString('en-IN')}`);
                doc.moveDown(0.5);
            });

            // Recent Donations
            doc.addPage();
            doc.fontSize(16).fillColor('#2563eb').text('Recent Donations (Last 30)', { underline: true });
            doc.moveDown(0.5);

            const recentDonations = donations
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 30);

            recentDonations.forEach((donation, index) => {
                if (index > 0 && index % 12 === 0) doc.addPage();

                doc.fontSize(10).fillColor('#000000');
                doc.text(`${index + 1}. ${donation.donorId?.fullName || 'Anonymous'} - ₹${(donation.amount || 0).toLocaleString('en-IN')}`);
                doc.fontSize(9).fillColor('#666666');
                doc.text(`   Campaign: ${donation.campaignId?.title || 'General'}`);
                doc.text(`   Date: ${new Date(donation.createdAt).toLocaleDateString('en-IN')} | Method: ${donation.paymentMethod || 'N/A'}`);
                doc.moveDown(0.3);
            });

            // Donation Trends
            doc.addPage();
            doc.fontSize(16).fillColor('#2563eb').text('Donation Distribution', { underline: true });
            doc.moveDown(0.5);

            // Group by payment method
            const paymentMethods = {};
            donations.forEach(d => {
                const method = d.paymentMethod || 'Unknown';
                paymentMethods[method] = (paymentMethods[method] || 0) + 1;
            });

            doc.fontSize(12).fillColor('#000000').text('By Payment Method:');
            doc.fontSize(10).fillColor('#666666');
            Object.entries(paymentMethods).forEach(([method, count]) => {
                const percentage = ((count / totalDonations) * 100).toFixed(1);
                doc.text(`   ${method}: ${count} donations (${percentage}%)`);
            });

            this.addReportFooter(doc);
            doc.end();
        } catch (error) {
            console.error('Error generating donor report:', error);
            throw error;
        }
    }

    /**
     * Helper: Add report header
     */
    static addReportHeader(doc, title, subtitle) {
        doc.fontSize(24).fillColor('#1e40af').text(title, { align: 'center', bold: true });
        doc.fontSize(12).fillColor('#666666').text(subtitle, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#999999').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
        doc.moveDown(1);
    }

    /**
     * Helper: Add report footer
     */
    static addReportFooter(doc) {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(pages.start + i);
            doc.fontSize(8).fillColor('#999999');
            doc.text(
                `Page ${i + 1} of ${pages.count} | Generated by Fundex Admin Dashboard`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
        }
    }

    /**
     * Helper: Add table to PDF
     */
    static addTable(doc, data, headers, colWidth) {
        const startY = doc.y;
        const rowHeight = 25;

        // Headers
        doc.fontSize(11).fillColor('#1e40af');
        headers.forEach((header, i) => {
            doc.text(header, 50 + (i * colWidth), startY, { width: colWidth, bold: true });
        });

        // Separator
        doc.moveTo(50, startY + 15).lineTo(50 + (headers.length * colWidth), startY + 15).stroke('#cccccc');

        // Data rows
        doc.fontSize(10).fillColor('#000000');
        data.forEach((row, rowIndex) => {
            const y = startY + rowHeight + (rowIndex * rowHeight);
            row.forEach((cell, colIndex) => {
                doc.text(cell, 50 + (colIndex * colWidth), y, { width: colWidth });
            });
        });

        doc.y = startY + rowHeight + (data.length * rowHeight) + 10;
    }
}

export default ReportGenerationService;
