import express from 'express';
import mongoose from 'mongoose';
import VolunteerRequest from '../models/VolunteerRequest.js';
import Expense from '../models/Expense.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import cloudinary from '../services/cloudinaryService.js';
import { analyzeBill, extractAmountFromBill, extractGSTFromBill } from '../services/ocrService.js';
import { validateAndExtractGST } from '../services/gstValidationService.js';
import { calculateFraudScore, generateFraudReport } from '../services/fraudDetectionService.js';

import User from '../models/User.js';

const router = express.Router();

// Get Campaign model
let Campaign;
try {
    Campaign = mongoose.model('Campaign');
} catch (error) {
    console.log('⚠️ Campaign model not found in volunteerRoutes');
}

// ==================== DASHBOARD ====================
// @route   GET /api/volunteer/dashboard
// @desc    Get complete volunteer dashboard data
// @access  Private (Volunteer)
router.get('/dashboard', protect, async (req, res) => {
    try {
        const volunteerId = req.user.id;

        // Fetch user to ensure we have the correct ngoId
        const user = await User.findById(volunteerId);
        const ngoId = user ? user.ngoId : null;

        // Fetch all data in parallel
        const [volunteerRequests, expenses, tasks, campaigns] = await Promise.all([
            VolunteerRequest.find({ volunteerId })
                .populate('campaignId', 'title ngoName targetAmount raisedAmount status')
                .sort({ createdAt: -1 })
                .lean(),
            Expense.find({ volunteerId })
                .populate('requestId', 'purpose requestedAmount')
                .sort({ createdAt: -1 })
                .lean(),
            Task.find({ volunteerId })
                .populate('campaignId', 'title')
                .sort({ createdAt: -1 })
                .lean(),
            Campaign ? Campaign.find({ ngoId: ngoId, status: { $in: ['active', 'draft'] } })
                .sort({ createdAt: -1 })
                .lean() : []
        ]);

        // Calculate statistics
        const stats = {
            // Fund Requests Stats
            totalRequests: volunteerRequests.length,
            approvedRequests: volunteerRequests.filter(r => r.status === 'approved').length,
            pendingRequests: volunteerRequests.filter(r => r.status === 'pending').length,
            rejectedRequests: volunteerRequests.filter(r => r.status === 'rejected').length,
            totalAllocated: volunteerRequests
                .filter(r => r.status === 'approved')
                .reduce((sum, r) => sum + (r.approvedAmount || 0), 0),

            // Expense Stats
            totalExpenses: expenses.length,
            totalSpent: expenses.reduce((sum, e) => sum + (e.amountSpent || 0), 0),

            // Task Stats
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            pendingTasks: tasks.filter(t => t.status === 'pending').length,
            inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        };

        stats.remainingBalance = stats.totalAllocated - stats.totalSpent;

        res.status(200).json({
            success: true,
            data: {
                stats,
                volunteerRequests,
                expenses,
                tasks,
                campaigns: Array.isArray(campaigns) ? campaigns : []
            }
        });
    } catch (error) {
        console.error('❌ Error fetching volunteer dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});

// ==================== VOLUNTEER REQUESTS (FUND REQUESTS) ====================
// @route   POST /api/volunteer/requests
// @desc    Create a new volunteer fund request
// @access  Private (Volunteer)
router.post('/requests', protect, async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { campaignId, purpose, description, requestedAmount, urgency } = req.body;

        // Validate required fields
        if (!purpose || !requestedAmount) {
            return res.status(400).json({
                success: false,
                message: 'Purpose and requested amount are required'
            });
        }

        const volunteerRequest = await VolunteerRequest.create({
            volunteerId,
            campaignId: campaignId || null,
            purpose,
            description: description || '',
            requestedAmount: parseFloat(requestedAmount),
            urgency: urgency || 'medium',
            status: 'pending',
            approvedAmount: 0,
            totalSpent: 0,
            remainingAmount: 0
        });

        const populatedRequest = await VolunteerRequest.findById(volunteerRequest._id)
            .populate('campaignId', 'title ngoName');

        console.log('✅ Volunteer request created:', volunteerRequest._id);

        // 🔔 NOTIFICATION: Notify all admins about the new fund request
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔔 NOTIFICATION TRIGGER: Fund Request Submitted');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💼 Request ID:', volunteerRequest._id);
        console.log('💰 Amount:', requestedAmount);
        console.log('📋 Purpose:', purpose);
        console.log('👤 Volunteer ID:', volunteerId);

        try {
            const NotificationService = (await import('../services/notificationService.js')).default;

            console.log('🔍 Finding volunteer details...');
            const volunteer = await User.findById(volunteerId);

            if (volunteer) {
                console.log('✅ Volunteer found:', {
                    id: volunteer._id,
                    name: volunteer.name,
                    fullName: volunteer.fullName,
                    email: volunteer.email
                });
            } else {
                console.log('⚠️ Volunteer not found!');
            }

            // Get admins for the volunteer's NGO
            console.log(`🔍 Finding admins for NGO ${volunteer.ngoId} to notify...`);
            const allAdmins = await User.find({
                role: 'admin',
                ngoId: volunteer.ngoId
            });
            console.log(`📊 Found ${allAdmins.length} admin(s)`);

            if (allAdmins.length === 0) {
                console.log('⚠️ NO ADMINS FOUND - Cannot send notifications!');
                console.log('💡 Make sure at least one user has role: "admin"');
            } else {
                console.log('👥 Admin IDs:', allAdmins.map(a => a._id.toString()));

                const volunteerName = volunteer?.fullName || volunteer?.name || 'A volunteer';
                console.log('📝 Using volunteer name:', volunteerName);

                const notificationPromises = allAdmins.map((admin, index) => {
                    console.log(`📤 [${index + 1}/${allAdmins.length}] Creating notification for admin: ${admin._id}`);
                    return NotificationService.notifyAdminFundRequest(
                        admin._id,
                        {
                            volunteerName: volunteerName,
                            amount: parseFloat(requestedAmount),
                            campaignName: purpose || 'Campaign',
                            campaignId: volunteerRequest._id,
                            requestId: volunteerRequest._id
                        }
                    );
                });

                await Promise.all(notificationPromises);
                console.log(`✅ Successfully sent fund request notifications to ${allAdmins.length} admins`);
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } catch (notifError) {
            console.error('❌ Error sending fund request notifications:', notifError.message);
            console.error('❌ Stack:', notifError.stack);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }

        res.status(201).json({
            success: true,
            message: 'Fund request submitted successfully',
            data: populatedRequest
        });
    } catch (error) {
        console.error('❌ Error creating volunteer request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit fund request',
            error: error.message
        });
    }
});

// @route   GET /api/volunteer/requests
// @desc    Get all volunteer requests for logged-in volunteer
// @access  Private (Volunteer)
router.get('/requests', protect, async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { status, campaignId } = req.query;

        const filter = { volunteerId };

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (campaignId && campaignId !== 'all') {
            filter.campaignId = campaignId;
        }

        const requests = await VolunteerRequest.find(filter)
            .populate('campaignId', 'title ngoName targetAmount raisedAmount')
            .populate('approvedBy', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('❌ Error fetching volunteer requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requests',
            error: error.message
        });
    }
});

// ==================== EXPENSES ====================
// @route   POST /api/volunteer/expenses
// @desc    Submit a new expense with image upload and OCR
// @access  Private (Volunteer)
router.post('/expenses', protect, upload.fields([
    { name: 'receipt', maxCount: 1 },
    { name: 'proof', maxCount: 1 }
]), async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { requestId, amountSpent, description, category } = req.body;

        // Validate required fields
        if (!requestId || !amountSpent) {
            return res.status(400).json({
                success: false,
                message: 'Request ID and amount spent are required'
            });
        }

        // Validate that both receipt and proof images are provided
        if (!req.files || !req.files.receipt || !req.files.proof) {
            return res.status(400).json({
                success: false,
                message: 'Both receipt and proof images are required'
            });
        }

        // Verify the volunteer request exists and belongs to this volunteer
        const volunteerRequest = await VolunteerRequest.findOne({
            _id: requestId,
            volunteerId,
            status: 'approved'
        });

        if (!volunteerRequest) {
            return res.status(404).json({
                success: false,
                message: 'Approved fund request not found or does not belong to you'
            });
        }

        // Calculate remaining balance
        const existingExpenses = await Expense.find({ requestId });
        const totalSpent = existingExpenses.reduce((sum, e) => sum + (e.amountSpent || 0), 0);
        const remainingBalance = volunteerRequest.approvedAmount - totalSpent;

        if (parseFloat(amountSpent) > remainingBalance) {
            return res.status(400).json({
                success: false,
                message: `Amount exceeds remaining balance of ₹${remainingBalance}`
            });
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 EXPENSE SUBMISSION WITH FRAUD DETECTION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // -------------------------------
        // UPLOAD RECEIPT IMAGE TO CLOUDINARY
        // -------------------------------
        console.log('📤 Uploading receipt to Cloudinary...');
        const receiptImageUrl = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'fundex/receipts' },
                (error, result) => error ? reject(error) : resolve(result.secure_url)
            ).end(req.files.receipt[0].buffer);
        });
        console.log('✅ Receipt uploaded:', receiptImageUrl);

        // -------------------------------
        // INTELLIGENT BILL ANALYSIS
        // -------------------------------
        console.log('🔍 Starting intelligent bill analysis...');
        let extractedText = '';
        let detectedAmount = null;
        let fraudFlags = [];
        let gstNumber = null;

        try {
            // Use intelligent bill analysis
            const billAnalysis = await analyzeBill(receiptImageUrl);

            if (billAnalysis.success) {
                extractedText = billAnalysis.text || '';
                detectedAmount = billAnalysis.amount;
                gstNumber = billAnalysis.gstNumber;

                console.log('✅ Bill analysis completed');
                console.log('📄 Extracted text length:', extractedText.length, 'characters');
                console.log('💰 Detected amount:', detectedAmount ? `₹${detectedAmount}` : 'Not found');
                console.log('🏢 Detected GST:', gstNumber || 'Not found');
            } else {
                console.log('⚠️ Bill analysis failed, using fallback');
                fraudFlags.push('Bill analysis failed - manual verification required.');
            }

            // Validate amount detection
            if (!detectedAmount) {
                fraudFlags.push('OCR could not detect any valid amount from the receipt.');
                console.log('⚠️ No amount detected from OCR');
            } else {
                // Check for amount mismatch
                const claimedAmount = parseFloat(amountSpent);
                const difference = Math.abs(detectedAmount - claimedAmount);
                const percentageDiff = (difference / claimedAmount) * 100;

                if (percentageDiff > 5) {
                    fraudFlags.push(
                        `Amount mismatch: Claimed ₹${claimedAmount}, OCR detected ₹${detectedAmount} (${percentageDiff.toFixed(1)}% difference)`
                    );
                    console.log(`⚠️ Amount mismatch: ${percentageDiff.toFixed(1)}% difference`);
                } else {
                    console.log('✅ Amount matches claimed amount');
                }
            }
        } catch (ocrError) {
            console.warn('⚠️ Bill analysis failed:', ocrError.message);
            fraudFlags.push('Bill analysis failed - manual verification required.');
        }

        // -------------------------------
        // GST VALIDATION
        // -------------------------------
        console.log('🔍 Starting GST validation...');
        let gstValidation = null;
        let gstValid = null;
        let gstBusinessName = null;
        let gstStatus = null;
        let gstApiVerified = false;
        let gstValidationError = null;

        try {
            if (gstNumber) {
                // GST was found by intelligent OCR, now validate it
                console.log('📋 Validating extracted GST:', gstNumber);
                gstValidation = await validateAndExtractGST(gstNumber);
            } else {
                // Fallback: try to extract from text
                console.log('📋 No GST found by OCR, trying text extraction...');
                gstValidation = await validateAndExtractGST(extractedText);
                if (gstValidation.found) {
                    gstNumber = gstValidation.extracted;
                }
            }

            console.log('📋 GST Validation Result:', JSON.stringify(gstValidation, null, 2));

            if (gstValidation && gstValidation.found) {
                gstValid = gstValidation.valid;
                gstBusinessName = gstValidation.businessName || null;
                gstStatus = gstValidation.status || null;
                gstApiVerified = gstValidation.apiVerified || false;
                gstValidationError = gstValidation.error || null;

                if (gstValid) {
                    console.log('✅ Valid GST found:', gstNumber);
                    if (gstBusinessName) {
                        console.log('🏢 Business Name:', gstBusinessName);
                    }
                } else {
                    console.log('❌ Invalid GST:', gstNumber);
                    fraudFlags.push(`Invalid GST number: ${gstNumber}`);
                }
            } else {
                console.log('⚠️ No GST number found in receipt');
                fraudFlags.push('No GST number found on receipt');
            }
        } catch (gstError) {
            console.error('❌ GST validation error:', gstError.message);
            gstValidationError = gstError.message;
            fraudFlags.push('GST validation failed - manual verification required.');
        }

        // -------------------------------
        // FRAUD SCORE CALCULATION
        // -------------------------------
        console.log('🎯 Calculating fraud score...');
        const fraudAnalysis = calculateFraudScore({
            claimedAmount: parseFloat(amountSpent),
            detectedAmount: detectedAmount,
            gstValidation: gstValidation,
            ocrExtracted: extractedText,
            remainingBalance: remainingBalance
        });

        console.log('📊 Fraud Analysis:');
        console.log('   Score:', fraudAnalysis.score);
        console.log('   Risk Level:', fraudAnalysis.riskLevel);
        console.log('   Flags:', fraudAnalysis.flags);
        console.log('   Recommendation:', fraudAnalysis.recommendation);

        // Generate fraud report
        const fraudReport = generateFraudReport(fraudAnalysis);
        console.log('\n' + fraudReport);

        // -------------------------------
        // UPLOAD PROOF IMAGE TO CLOUDINARY
        // -------------------------------
        console.log('📤 Uploading proof image to Cloudinary...');
        const proofImageUrl = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'fundex/proofs' },
                (error, result) => error ? reject(error) : resolve(result.secure_url)
            ).end(req.files.proof[0].buffer);
        });
        console.log('✅ Proof image uploaded:', proofImageUrl);

        // -------------------------------
        // CREATE EXPENSE ENTRY
        // -------------------------------
        const expense = await Expense.create({
            volunteerId,
            requestId,
            amountSpent: parseFloat(amountSpent),
            description: description || '',
            receiptImage: receiptImageUrl,
            proofImage: proofImageUrl,
            category: category || 'general',

            // OCR Data
            ocrExtracted: extractedText || '',
            detectedAmount: detectedAmount || null,

            // GST Data
            gstNumber: gstNumber,
            gstValid: gstValid,
            gstBusinessName: gstBusinessName,
            gstStatus: gstStatus,
            gstApiVerified: gstApiVerified,
            gstValidationError: gstValidationError,

            // Fraud Detection
            fraudFlags: fraudFlags,
            fraudScore: fraudAnalysis.score,
            fraudRiskLevel: fraudAnalysis.riskLevel,
            fraudAnalysis: {
                flags: fraudAnalysis.flags,
                details: fraudAnalysis.details,
                recommendation: fraudAnalysis.recommendation
            },

            // Auto-flag high-risk expenses
            verificationStatus: fraudAnalysis.score >= 50 ? 'flagged' : 'pending',
            flaggedReason: fraudAnalysis.score >= 50 ? fraudAnalysis.recommendation : null
        });

        // Check for overspending
        const newTotalSpent = totalSpent + parseFloat(amountSpent);
        if (newTotalSpent > volunteerRequest.approvedAmount) {
            expense.fraudFlags.push('Volunteer has overspent more than approved amount.');
            // No need to await expense.save() here, it's already part of the create operation
            // and fraudFlags are already included.
            // If we want to update the verificationStatus based on this, it should be done before create.
            // For now, let's assume fraudFlags are collected and passed to create.
        }

        // Update volunteer request totals
        await VolunteerRequest.findByIdAndUpdate(requestId, {
            totalSpent: newTotalSpent,
            remainingAmount: volunteerRequest.approvedAmount - newTotalSpent
        });

        const populatedExpense = await Expense.findById(expense._id)
            .populate('requestId', 'purpose requestedAmount approvedAmount');

        console.log('✅ Expense submitted successfully with fraud analysis');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.status(201).json({
            success: true,
            message: 'Expense submitted successfully',
            data: populatedExpense,
            fraudAnalysis: {
                score: fraudAnalysis.score,
                riskLevel: fraudAnalysis.riskLevel,
                recommendation: fraudAnalysis.recommendation,
                autoFlagged: fraudAnalysis.score >= 50
            }
        });
    } catch (error) {
        console.error('❌ Error submitting expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit expense',
            error: error.message
        });
    }
});

// @route   GET /api/volunteer/expenses
// @desc    Get all expenses for logged-in volunteer
// @access  Private (Volunteer)
router.get('/expenses', protect, async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { requestId } = req.query;

        const filter = { volunteerId };

        if (requestId && requestId !== 'all') {
            filter.requestId = requestId;
        }

        const expenses = await Expense.find(filter)
            .populate('requestId', 'purpose requestedAmount approvedAmount campaignId')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: expenses
        });
    } catch (error) {
        console.error('❌ Error fetching expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expenses',
            error: error.message
        });
    }
});

// ==================== TASKS ====================
// @route   POST /api/volunteer/tasks
// @desc    Create a new task
// @access  Private (Volunteer)
router.post('/tasks', protect, async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { campaignId, title, description, priority, dueDate, notes } = req.body;

        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        const task = await Task.create({
            volunteerId,
            campaignId: campaignId || null,
            title,
            description,
            priority: priority || 'medium',
            dueDate: dueDate || null,
            notes: notes || '',
            status: 'pending',
            assignedBy: volunteerId // Self-assigned
        });

        const populatedTask = await Task.findById(task._id)
            .populate('campaignId', 'title ngoName');

        console.log('✅ Task created:', task._id);

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: populatedTask
        });
    } catch (error) {
        console.error('❌ Error creating task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create task',
            error: error.message
        });
    }
});

// @route   GET /api/volunteer/tasks
// @desc    Get all tasks for logged-in volunteer
// @access  Private (Volunteer)
router.get('/tasks', protect, async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { status, campaignId } = req.query;

        const filter = { volunteerId };

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (campaignId && campaignId !== 'all') {
            filter.campaignId = campaignId;
        }

        const tasks = await Task.find(filter)
            .populate('campaignId', 'title ngoName')
            .populate('assignedBy', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error: error.message
        });
    }
});

// @route   PATCH /api/volunteer/tasks/:id
// @desc    Update task status
// @access  Private (Volunteer)
router.patch('/tasks/:id', protect, async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { status, notes } = req.body;

        const task = await Task.findOne({ _id: req.params.id, volunteerId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found or does not belong to you'
            });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (status === 'completed') updateData.completedAt = new Date();

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('campaignId', 'title ngoName');

        console.log('✅ Task updated:', req.params.id);

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask
        });
    } catch (error) {
        console.error('❌ Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task',
            error: error.message
        });
    }
});

// ==================== CAMPAIGNS ====================
// @route   GET /api/volunteer/campaigns
// @desc    Get campaigns for volunteer's NGO
// @access  Private (Volunteer)
router.get('/campaigns', protect, async (req, res) => {
    try {
        if (!Campaign) {
            return res.status(500).json({
                success: false,
                message: 'Campaign model not available'
            });
        }

        // Fetch user to ensure we have the correct ngoId
        const user = await User.findById(req.user.id);
        const ngoId = user ? user.ngoId : null;

        const campaigns = await Campaign.find({
            ngoId: ngoId,
            status: { $in: ['active', 'draft'] }
        })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: campaigns
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

// ==================== STATISTICS ====================
// @route   GET /api/volunteer/stats
// @desc    Get detailed volunteer statistics
// @access  Private (Volunteer)
router.get('/stats', protect, async (req, res) => {
    try {
        const volunteerId = req.user.id;

        const [volunteerRequests, expenses, tasks] = await Promise.all([
            VolunteerRequest.find({ volunteerId }).lean(),
            Expense.find({ volunteerId }).lean(),
            Task.find({ volunteerId }).lean()
        ]);

        const stats = {
            // Fund Requests
            totalRequests: volunteerRequests.length,
            approvedRequests: volunteerRequests.filter(r => r.status === 'approved').length,
            pendingRequests: volunteerRequests.filter(r => r.status === 'pending').length,
            rejectedRequests: volunteerRequests.filter(r => r.status === 'rejected').length,
            totalAllocated: volunteerRequests
                .filter(r => r.status === 'approved')
                .reduce((sum, r) => sum + (r.approvedAmount || 0), 0),

            // Expenses
            totalExpenses: expenses.length,
            totalSpent: expenses.reduce((sum, e) => sum + (e.amountSpent || 0), 0),

            // Tasks
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            pendingTasks: tasks.filter(t => t.status === 'pending').length,
            inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,

            // Calculated
            remainingBalance: 0,
            approvalRate: 0,
            completionRate: 0
        };

        stats.remainingBalance = stats.totalAllocated - stats.totalSpent;
        stats.approvalRate = stats.totalRequests > 0
            ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
            : 0;
        stats.completionRate = stats.totalTasks > 0
            ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
            : 0;

        res.status(200).json({
            success: true,
            data: stats
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

export default router;
