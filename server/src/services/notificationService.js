import Notification from '../models/Notification.js';

class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    relatedEntity = {},
    metadata = {},
    priority = 'medium'
  }) {
    try {
      const notification = await Notification.create({
        recipientId,
        recipientRole,
        type,
        title,
        message,
        relatedEntity,
        metadata,
        priority
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications at once
   */
  static async createBulkNotifications(notifications) {
    try {
      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId, { limit = 50, skip = 0, unreadOnly = false, role = null } = {}) {
    try {
      const query = { recipientId: userId };

      // If role is provided, filter by role to show relevant notifications only
      if (role) {
        query.recipientRole = role;
      }

      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const unreadQuery = {
        recipientId: userId,
        isRead: false
      };

      if (role) {
        unreadQuery.recipientRole = role;
      }

      const unreadCount = await Notification.countDocuments(unreadQuery);

      return {
        notifications,
        unreadCount,
        total: await Notification.countDocuments(query)
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        recipientId: userId
      });
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId) {
    try {
      const result = await Notification.deleteMany({ recipientId: userId });
      return result;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  // ==================== DONOR NOTIFICATIONS ====================

  /**
   * Donor: Thank you notification after donation
   */
  static async notifyDonationThankYou(donorId, donationData) {
    return this.createNotification({
      recipientId: donorId,
      recipientRole: 'donor',
      type: 'donation_thank_you',
      title: '🙏 Thank You for Your Donation!',
      message: `Your generous donation of ₹${donationData.amount.toLocaleString()} to ${donationData.campaignName} has been received. Your support makes a real difference!`,
      relatedEntity: {
        entityType: 'donation',
        entityId: donationData.donationId
      },
      metadata: {
        amount: donationData.amount,
        campaignName: donationData.campaignName,
        campaignId: donationData.campaignId
      },
      priority: 'high'
    });
  }

  /**
   * Donor: Task added to campaign they invested in
   */
  static async notifyDonorTaskAdded(donorId, taskData) {
    return this.createNotification({
      recipientId: donorId,
      recipientRole: 'donor',
      type: 'task_added',
      title: '📋 New Task Added to Your Campaign',
      message: `A new task "${taskData.taskName}" has been added to ${taskData.campaignName}. Budget: ₹${taskData.budget.toLocaleString()}`,
      relatedEntity: {
        entityType: 'task',
        entityId: taskData.taskId
      },
      metadata: {
        taskName: taskData.taskName,
        campaignName: taskData.campaignName,
        campaignId: taskData.campaignId,
        budget: taskData.budget
      },
      priority: 'medium'
    });
  }

  /**
   * Donor: Expense submitted by volunteer
   */
  static async notifyDonorExpenseSubmitted(donorId, expenseData) {
    return this.createNotification({
      recipientId: donorId,
      recipientRole: 'donor',
      type: 'expense_submitted',
      title: '💰 Expense Submitted for Review',
      message: `An expense of ₹${expenseData.amount.toLocaleString()} has been submitted for ${expenseData.campaignName}. Description: ${expenseData.description}`,
      relatedEntity: {
        entityType: 'expense',
        entityId: expenseData.expenseId
      },
      metadata: {
        amount: expenseData.amount,
        campaignName: expenseData.campaignName,
        campaignId: expenseData.campaignId,
        description: expenseData.description
      },
      priority: 'medium'
    });
  }

  // ==================== ADMIN NOTIFICATIONS ====================

  /**
   * Admin: New donation received
   */
  static async notifyAdminNewDonation(adminId, donationData) {
    return this.createNotification({
      recipientId: adminId,
      recipientRole: 'admin',
      type: 'new_donation',
      title: '💵 New Donation Received',
      message: `${donationData.donorName} donated ₹${donationData.amount.toLocaleString()} to ${donationData.campaignName}`,
      relatedEntity: {
        entityType: 'donation',
        entityId: donationData.donationId
      },
      metadata: {
        donorName: donationData.donorName,
        amount: donationData.amount,
        campaignName: donationData.campaignName,
        campaignId: donationData.campaignId
      },
      priority: 'high'
    });
  }

  /**
   * Admin: Fund request received from volunteer
   */
  static async notifyAdminFundRequest(adminId, requestData) {
    return this.createNotification({
      recipientId: adminId,
      recipientRole: 'admin',
      type: 'fund_request_received',
      title: '💼 New Fund Request',
      message: `${requestData.volunteerName} requested ₹${requestData.amount.toLocaleString()} for ${requestData.campaignName}`,
      relatedEntity: {
        entityType: 'fundRequest',
        entityId: requestData.requestId
      },
      metadata: {
        volunteerName: requestData.volunteerName,
        amount: requestData.amount,
        campaignName: requestData.campaignName,
        campaignId: requestData.campaignId
      },
      priority: 'high'
    });
  }

  /**
   * Admin: Task added by volunteer
   */
  static async notifyAdminTaskAdded(adminId, taskData) {
    return this.createNotification({
      recipientId: adminId,
      recipientRole: 'admin',
      type: 'task_added_admin',
      title: '📋 New Task Created',
      message: `${taskData.volunteerName} added task "${taskData.taskName}" to ${taskData.campaignName}. Budget: ₹${taskData.budget.toLocaleString()}`,
      relatedEntity: {
        entityType: 'task',
        entityId: taskData.taskId
      },
      metadata: {
        volunteerName: taskData.volunteerName,
        taskName: taskData.taskName,
        campaignName: taskData.campaignName,
        campaignId: taskData.campaignId,
        budget: taskData.budget
      },
      priority: 'medium'
    });
  }

  /**
   * Admin: Expense submitted by volunteer
   */
  static async notifyAdminExpenseSubmitted(adminId, expenseData) {
    return this.createNotification({
      recipientId: adminId,
      recipientRole: 'admin',
      type: 'expense_submitted_admin',
      title: '💰 Expense Awaiting Verification',
      message: `${expenseData.volunteerName} submitted an expense of ₹${expenseData.amount.toLocaleString()} for ${expenseData.campaignName}`,
      relatedEntity: {
        entityType: 'expense',
        entityId: expenseData.expenseId
      },
      metadata: {
        volunteerName: expenseData.volunteerName,
        amount: expenseData.amount,
        campaignName: expenseData.campaignName,
        campaignId: expenseData.campaignId,
        description: expenseData.description
      },
      priority: 'high'
    });
  }

  // ==================== VOLUNTEER NOTIFICATIONS ====================

  /**
   * Volunteer: Fund request approved
   */
  static async notifyVolunteerFundRequestApproved(volunteerId, requestData) {
    return this.createNotification({
      recipientId: volunteerId,
      recipientRole: 'volunteer',
      type: 'fund_request_approved',
      title: '✅ Fund Request Approved',
      message: `Your fund request of ₹${requestData.amount.toLocaleString()} for ${requestData.campaignName} has been approved!`,
      relatedEntity: {
        entityType: 'fundRequest',
        entityId: requestData.requestId
      },
      metadata: {
        amount: requestData.amount,
        campaignName: requestData.campaignName,
        campaignId: requestData.campaignId
      },
      priority: 'high'
    });
  }

  /**
   * Volunteer: Fund request rejected
   */
  static async notifyVolunteerFundRequestRejected(volunteerId, requestData) {
    return this.createNotification({
      recipientId: volunteerId,
      recipientRole: 'volunteer',
      type: 'fund_request_rejected',
      title: '❌ Fund Request Rejected',
      message: `Your fund request of ₹${requestData.amount.toLocaleString()} for ${requestData.campaignName} was not approved. ${requestData.reason || ''}`,
      relatedEntity: {
        entityType: 'fundRequest',
        entityId: requestData.requestId
      },
      metadata: {
        amount: requestData.amount,
        campaignName: requestData.campaignName,
        campaignId: requestData.campaignId,
        reason: requestData.reason
      },
      priority: 'high'
    });
  }

  /**
   * Volunteer: Expense approved
   */
  static async notifyVolunteerExpenseApproved(volunteerId, expenseData) {
    return this.createNotification({
      recipientId: volunteerId,
      recipientRole: 'volunteer',
      type: 'expense_approved',
      title: '✅ Expense Approved',
      message: `Your expense of ₹${expenseData.amount.toLocaleString()} for ${expenseData.campaignName} has been verified and approved!`,
      relatedEntity: {
        entityType: 'expense',
        entityId: expenseData.expenseId
      },
      metadata: {
        amount: expenseData.amount,
        campaignName: expenseData.campaignName,
        campaignId: expenseData.campaignId,
        description: expenseData.description
      },
      priority: 'high'
    });
  }

  /**
   * Volunteer: Expense rejected
   */
  static async notifyVolunteerExpenseRejected(volunteerId, expenseData) {
    return this.createNotification({
      recipientId: volunteerId,
      recipientRole: 'volunteer',
      type: 'expense_rejected',
      title: '❌ Expense Rejected',
      message: `Your expense of ₹${expenseData.amount.toLocaleString()} for ${expenseData.campaignName} was not approved. ${expenseData.reason || ''}`,
      relatedEntity: {
        entityType: 'expense',
        entityId: expenseData.expenseId
      },
      metadata: {
        amount: expenseData.amount,
        campaignName: expenseData.campaignName,
        campaignId: expenseData.campaignId,
        description: expenseData.description,
        reason: expenseData.reason
      },
      priority: 'high'
    });
  }

  /**
   * Volunteer: Volunteer request approved
   */
  static async notifyVolunteerRequestApproved(volunteerId, campaignData) {
    return this.createNotification({
      recipientId: volunteerId,
      recipientRole: 'volunteer',
      type: 'volunteer_approved',
      title: '🎉 Volunteer Request Approved',
      message: `Congratulations! You've been approved as a volunteer for ${campaignData.campaignName}`,
      relatedEntity: {
        entityType: 'campaign',
        entityId: campaignData.campaignId
      },
      metadata: {
        campaignName: campaignData.campaignName,
        campaignId: campaignData.campaignId
      },
      priority: 'high'
    });
  }

  /**
   * Volunteer: Volunteer request rejected
   */
  static async notifyVolunteerRequestRejected(volunteerId, campaignData) {
    return this.createNotification({
      recipientId: volunteerId,
      recipientRole: 'volunteer',
      type: 'volunteer_rejected',
      title: 'Volunteer Request Update',
      message: `Your volunteer request for ${campaignData.campaignName} was not approved at this time.`,
      relatedEntity: {
        entityType: 'campaign',
        entityId: campaignData.campaignId
      },
      metadata: {
        campaignName: campaignData.campaignName,
        campaignId: campaignData.campaignId
      },
      priority: 'medium'
    });
  }
}

export default NotificationService;
