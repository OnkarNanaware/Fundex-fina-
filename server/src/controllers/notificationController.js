import NotificationService from '../services/notificationService.js';

/**
 * Get all notifications for the current user
 */
export const getNotifications = async (req, res) => {
  try {
    console.log('📥 GET /api/notifications - Request received');
    console.log('👤 User from token:', req.user);

    const userId = req.user.id || req.user._id;
    const userRole = req.user.role; // Get user role
    console.log('🔑 User ID:', userId, 'Role:', userRole);

    const { limit = 50, skip = 0, unreadOnly = false } = req.query;
    console.log('📊 Query params:', { limit, skip, unreadOnly });

    const result = await NotificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true',
      role: userRole // Filter by role
    });

    console.log('✅ Notifications fetched:', {
      count: result.notifications.length,
      unreadCount: result.unreadCount,
      total: result.total
    });

    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      total: result.total
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res) => {
  try {
    console.log('📥 GET /api/notifications/unread-count - Request received');
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    console.log('🔑 User ID:', userId);

    const result = await NotificationService.getUserNotifications(userId, {
      limit: 0,
      unreadOnly: true,
      role: userRole
    });

    console.log('✅ Unread count:', result.unreadCount);

    res.json({
      success: true,
      count: result.unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { notificationId } = req.params;

    const notification = await NotificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const result = await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { notificationId } = req.params;

    const result = await NotificationService.deleteNotification(notificationId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const result = await NotificationService.deleteAllNotifications(userId);

    res.json({
      success: true,
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications',
      error: error.message
    });
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};
