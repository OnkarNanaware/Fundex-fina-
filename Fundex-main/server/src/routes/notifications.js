import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for current user
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

export default router;
