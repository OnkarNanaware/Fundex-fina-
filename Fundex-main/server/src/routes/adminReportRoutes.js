import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import ReportGenerationService from '../services/reportGenerationService.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Admin Report Download Routes
 * All routes require authentication and admin role
 */

// Download Financial Summary Report
router.get('/financial-summary', authMiddleware, async (req, res) => {
    try {
        console.log('📊 Generating Financial Summary Report...');

        // Get admin's NGO ID
        const admin = await User.findById(req.user.id);
        if (!admin || !admin.ngoId) {
            return res.status(404).json({ error: 'Admin or NGO not found' });
        }

        await ReportGenerationService.generateFinancialSummary(admin.ngoId, res);
        console.log('✅ Financial Summary Report generated successfully');
    } catch (error) {
        console.error('❌ Error generating financial summary:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate report', details: error.message });
        }
    }
});

// Download Transparency Report
router.get('/transparency', authMiddleware, async (req, res) => {
    try {
        console.log('📊 Generating Transparency Report...');

        const admin = await User.findById(req.user.id);
        if (!admin || !admin.ngoId) {
            return res.status(404).json({ error: 'Admin or NGO not found' });
        }

        await ReportGenerationService.generateTransparencyReport(admin.ngoId, res);
        console.log('✅ Transparency Report generated successfully');
    } catch (error) {
        console.error('❌ Error generating transparency report:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate report', details: error.message });
        }
    }
});

// Download Campaign Analytics Report
router.get('/campaign-analytics', authMiddleware, async (req, res) => {
    try {
        console.log('📊 Generating Campaign Analytics Report...');

        const admin = await User.findById(req.user.id);
        if (!admin || !admin.ngoId) {
            return res.status(404).json({ error: 'Admin or NGO not found' });
        }

        await ReportGenerationService.generateCampaignAnalytics(admin.ngoId, res);
        console.log('✅ Campaign Analytics Report generated successfully');
    } catch (error) {
        console.error('❌ Error generating campaign analytics:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate report', details: error.message });
        }
    }
});

// Download Donor Report
router.get('/donor-report', authMiddleware, async (req, res) => {
    try {
        console.log('📊 Generating Donor Report...');

        const admin = await User.findById(req.user.id);
        if (!admin || !admin.ngoId) {
            return res.status(404).json({ error: 'Admin or NGO not found' });
        }

        await ReportGenerationService.generateDonorReport(admin.ngoId, res);
        console.log('✅ Donor Report generated successfully');
    } catch (error) {
        console.error('❌ Error generating donor report:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate report', details: error.message });
        }
    }
});

export default router;
