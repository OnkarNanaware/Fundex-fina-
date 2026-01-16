import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipientRole: {
    type: String,
    enum: ['donor', 'volunteer', 'admin'],
    required: true
  },
  type: {
    type: String,
    enum: [
      // Donor notifications
      'donation_thank_you',
      'task_added',
      'expense_submitted',
      // Admin notifications
      'new_donation',
      'fund_request_received',
      'task_added_admin',
      'expense_submitted_admin',
      // Volunteer notifications
      'fund_request_approved',
      'fund_request_rejected',
      'expense_approved',
      'expense_rejected',
      // General
      'campaign_created',
      'campaign_updated',
      'volunteer_approved',
      'volunteer_rejected',
      'account_approved',
      'account_rejected'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['donation', 'campaign', 'task', 'expense', 'fundRequest', 'volunteerRequest']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
