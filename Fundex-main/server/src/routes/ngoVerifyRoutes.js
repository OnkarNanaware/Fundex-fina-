import express from 'express';
import axios from 'axios';
import { sendOTP, verifyOTP } from '../services/emailService.js';

const router = express.Router();

const MOCK_API_URL = 'https://6969026e69178471522c4469.mockapi.io/api/ngo-verify/ngos';

/**
 * @route   GET /api/ngo-verify/:darpanId
 * @desc    Fetch NGO details from mock API by Darpan ID
 * @access  Public
 */
router.get('/:darpanId(*)', async (req, res) => {
    try {
        const darpanId = req.params.darpanId;

        // Fetch all NGOs from mock API
        const response = await axios.get(MOCK_API_URL);
        const ngos = response.data;

        // Find NGO by darpan_id (case-insensitive)
        const ngo = ngos.find(
            n => n.darpan_id && n.darpan_id.toLowerCase() === darpanId.toLowerCase()
        );

        if (!ngo) {
            return res.status(404).json({
                success: false,
                message: 'NGO not found with this registration ID'
            });
        }

        // Return NGO details
        res.json({
            success: true,
            data: {
                darpanId: ngo.darpan_id,
                ngoName: ngo.ngo_name || ngo.name,
                state: ngo.state,
                district: ngo.district,
                registrationYear: ngo.registration_year,
                sector: ngo.sector,
                status: ngo.status,
                email: ngo.email
            }
        });
    } catch (error) {
        console.error('Error fetching NGO data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch NGO data'
        });
    }
});

/**
 * @route   POST /api/ngo-verify/send-otp
 * @desc    Send OTP to NGO email
 * @access  Public
 */
router.post('/send-otp', async (req, res) => {
    try {
        const { email, ngoName } = req.body;

        if (!email || !ngoName) {
            return res.status(400).json({
                success: false,
                message: 'Email and NGO name are required'
            });
        }

        // Send OTP
        await sendOTP(email, ngoName);

        res.json({
            success: true,
            message: 'OTP sent successfully to ' + email
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.'
        });
    }
});

/**
 * @route   POST /api/ngo-verify/verify-otp
 * @desc    Verify OTP
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const isValid = verifyOTP(email, otp);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP'
        });
    }
});

export default router;