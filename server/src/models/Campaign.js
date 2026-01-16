// server/src/models/Campaign.js
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true,
      sparse: true
    },

    description: {
      type: String,
      required: true
    },

    shortDescription: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true,
      enum: [
        'Healthcare',
        'Education',
        'Food & Nutrition',
        'Water & Sanitation',
        'Environment',
        'Animal Welfare',
        'Disaster Relief',
        'Women Empowerment',
        'Other'
      ]
    },

    tags: [{ type: String }],

    coverImage: {
      type: String,
      default: ''
    },

    images: [{ type: String }],

    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO', // Reference to NGO collection
      required: true
    },

    ngoName: {
      type: String,
      required: false // Optional since we can get it from NGO reference
    },

    location: {
      city: String,
      state: String,
      country: {
        type: String,
        default: 'India'
      }
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 1000
    },

    raisedAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    allocatedAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    endDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft'
    },

    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },

    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvedAt: {
      type: Date
    },

    is80GEligible: {
      type: Boolean,
      default: false
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    beneficiaries: {
      count: {
        type: Number,
        default: 0
      },
      description: String
    },

    stats: {
      totalDonors: {
        type: Number,
        default: 0
      },
      totalDonations: {
        type: Number,
        default: 0
      },
      totalVolunteers: {
        type: Number,
        default: 0
      },
      viewsCount: {
        type: Number,
        default: 0
      },
      sharesCount: {
        type: Number,
        default: 0
      },
      commentsCount: {
        type: Number,
        default: 0
      },
      updatesCount: {
        type: Number,
        default: 0
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      transparencyScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      }
    }
  },
  { timestamps: true }
);

// ---------------- INDEXES ----------------
campaignSchema.index({ status: 1, approvalStatus: 1 });
campaignSchema.index({ ngoId: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ endDate: 1 });
campaignSchema.index({ 'stats.totalDonors': -1 });
campaignSchema.index({ createdAt: -1 });

// ---------------- VIRTUALS ----------------
campaignSchema.virtual('progressPercentage').get(function () {
  if (this.targetAmount > 0) {
    return Math.round((this.raisedAmount / this.targetAmount) * 100);
  }
  return 0;
});

campaignSchema.virtual('daysRemaining').get(function () {
  if (!this.endDate) return 0;
  const today = new Date();
  const diff = new Date(this.endDate) - today;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

export default mongoose.model('Campaign', campaignSchema);
