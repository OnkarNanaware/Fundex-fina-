import express from 'express';
import NotificationService from '../services/notificationService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint to create a notification for the current user
router.post('/test-notification', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    
    console.log('🧪 Creating test notification for user:', userId, 'Role:', userRole);
    
    const notification = await NotificationService.createNotification({
      recipientId: userId,
      recipientRole: userRole,
      type: 'campaign_created',
      title: '🧪 Test Notification',
      message: `This is a test notification created at ${new Date().toLocaleTimeString()}. If you can see this, the notification system is working!`,
      relatedEntity: {
        entityType: 'campaign',
        entityId: userId // Just using user ID as placeholder
      },
      metadata: {
        testData: true,
        createdAt: new Date()
      },
      priority: 'high'
    });
    
    console.log('✅ Test notification created:', notification._id);
    
    res.json({
      success: true,
      message: 'Test notification created successfully!',
      notification
    });
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message
    });
  }
});

export default router;
