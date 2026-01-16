import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getOverallStats, getDashboardStats, getReportsStats } from "../controllers/adminStatsController.js";
import pdfService from "../services/pdfService.js";
import { sendReportEmail } from "../services/emailService.js";
import User from "../models/User.js";
import NGO from "../models/NGO.js";

const router = express.Router();

router.get("/overall-utilization", authMiddleware, getOverallStats);
router.get("/dashboard", authMiddleware, getDashboardStats);
router.get("/reports", authMiddleware, getReportsStats);

// PDF Download Route
router.get("/reports/download-pdf", authMiddleware, async (req, res) => {
    try {
        // Get admin details
        const admin = await User.findById(req.user.id);
        if (!admin || !admin.ngoId) {
            return res.status(404).json({ message: 'Admin details not found' });
        }

        // Get NGO details
        const ngo = await NGO.findById(admin.ngoId);
        if (!ngo) {
            return res.status(404).json({ message: 'NGO not found' });
        }

        // Fetch reports data using the existing controller logic
        const reportsResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/admin/stats/reports`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        if (!reportsResponse.ok) {
            throw new Error('Failed to fetch reports data');
        }

        const reportsData = await reportsResponse.json();

        // Generate PDF
        const pdfBuffer = await pdfService.generateReportPDF(
            reportsData,
            ngo.ngoName,
            admin.email
        );

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${ngo.ngoName.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: 'Failed to generate PDF report', error: error.message });
    }
});

// Email Report Route
router.post("/reports/email", authMiddleware, async (req, res) => {
    try {
        // Get admin details
        const admin = await User.findById(req.user.id);
        if (!admin || !admin.ngoId) {
            return res.status(404).json({ message: 'Admin details not found' });
        }

        // Get NGO details
        const ngo = await NGO.findById(admin.ngoId);
        if (!ngo) {
            return res.status(404).json({ message: 'NGO not found' });
        }

        // Fetch reports data
        const reportsResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/admin/stats/reports`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        if (!reportsResponse.ok) {
            throw new Error('Failed to fetch reports data');
        }

        const reportsData = await reportsResponse.json();

        // Generate PDF
        const pdfBuffer = await pdfService.generateReportPDF(
            reportsData,
            ngo.ngoName,
            admin.email
        );

        // Send email with PDF attachment
        await sendReportEmail(
            admin.email,
            admin.fullName || admin.name || 'Admin',
            ngo.ngoName,
            pdfBuffer
        );

        res.json({
            success: true,
            message: `Report has been sent to ${admin.email}`
        });

    } catch (error) {
        console.error('Error emailing PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to email PDF report',
            error: error.message
        });
    }
});

export default router;