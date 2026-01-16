# Trust & Transparency Score Implementation Guide

## Overview
This document explains the implementation of the NGO Trust & Transparency Score system and fraud score visibility features in Fundex.

## Features Implemented

### Feature 1: Fraud Score Display in Admin Expense Verification
**Location:** `client/src/pages/AdminExpenses.jsx`

**What it does:**
- Displays the calculated fraud score for each expense submission in the admin expense verification tab
- Color-coded risk levels for quick identification:
  - 🟢 **Green (0-19)**: Minimal Risk
  - 🔵 **Blue (20-39)**: Low Risk
  - 🟡 **Yellow (40-59)**: Medium Risk
  - 🟠 **Orange (60-79)**: High Risk
  - 🔴 **Red (80-100)**: Critical Risk

**How it works:**
- The fraud score is calculated when volunteers submit expenses (already implemented in `fraudDetectionService.js`)
- The score is stored in the Expense model's `fraudScore` field
- Admin dashboard fetches expenses with fraud scores via `/api/admin/expenses`
- Scores are displayed in a dedicated column with color-coding

---

### Feature 2: NGO Trust & Transparency Score System

#### 2.1 Trust Score Calculation
**Location:** `server/src/services/trustScoreService.js`

**Scoring Components (Total: 100 points)**

1. **Fraud Score Component (40 points)**
   - Based on average fraud scores across all expenses
   - Lower fraud scores = Higher trust
   - Formula: `40 × (1 - avgFraudScore/100)`
   - Tracks high-risk expense percentage

2. **Fund Utilization Component (30 points)**
   - Measures how efficiently approved funds are being used
   - Optimal range: 80-95% utilization
   - Penalties for overspending or underutilization
   - Formula varies based on utilization rate

3. **Transparency Component (20 points)**
   - Expense verification rate (10 points)
   - Fund request processing rate (10 points)
   - Rewards timely verification and processing

4. **Donor Confidence Component (10 points)**
   - Campaign success rate (completed campaigns reaching 80%+ of target)
   - Average progress of active campaigns
   - Weighted combination of both metrics

**Trust Score Breakdown:**
```javascript
{
  trustScore: 85,  // Overall score (0-100)
  breakdown: {
    fraudScore: {
      score: 38,
      avgFraudScore: "5.2",
      highRiskPercentage: "2.5"
    },
    utilization: {
      score: 28,
      utilizationRate: "87.5"
    },
    transparency: {
      score: 18,
      verificationRate: "90.0"
    },
    donorConfidence: {
      score: 9,
      successRate: "75.0"
    }
  },
  fundMetrics: { ... },
  lastCalculated: "2026-01-17T00:00:00Z"
}
```

#### 2.2 Fund Utilization Metrics
**What's tracked:**
- Total funds raised from donations
- Total funds allocated to volunteers
- Total funds spent (verified expenses only)
- Available funds remaining
- Utilization percentage
- Number of donors, campaigns, and active campaigns

**Purpose:**
- Shows donors exactly how their money is being used
- Builds trust through transparency
- Encourages donations to well-managed NGOs

#### 2.3 NGO Model Updates
**Location:** `server/src/models/NGO.js`

**New Fields:**
```javascript
trustScore: {
  score: Number (0-100),
  lastCalculated: Date,
  breakdown: {
    fraudScore: Object,
    utilization: Object,
    transparency: Object,
    donorConfidence: Object
  }
},
fundMetrics: {
  totalRaised: Number,
  totalAllocated: Number,
  totalSpent: Number,
  availableFunds: Number,
  utilizationPercentage: Number,
  totalDonors: Number,
  totalCampaigns: Number,
  activeCampaigns: Number
}
```

#### 2.4 Campaign API with Trust Scores
**Location:** `server/src/routes/campaignRoutes.js`

**Endpoints:**

1. **GET `/api/campaigns/active`**
   - Returns all active campaigns with NGO trust scores
   - Supports filtering, sorting, and pagination
   - Smart caching: Uses cached score if less than 24 hours old
   - Automatically recalculates and updates stale scores

2. **GET `/api/campaigns/filter-options`**
   - Returns available filter options for campaigns

3. **GET `/api/campaigns/stats`**
   - Returns overall campaign statistics

4. **GET `/api/campaigns/:id`**
   - Returns single campaign with NGO trust score

**Response Format:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "_id": "...",
        "title": "Campaign Title",
        "ngoName": "NGO Name",
        "progress": 75,
        "daysLeft": 30,
        "ngoTrustScore": 85,
        "ngoFundMetrics": {
          "totalRaised": 500000,
          "totalSpent": 437500,
          "utilizationPercentage": "87.5",
          "totalDonors": 150
        },
        ...
      }
    ],
    "pagination": { ... }
  }
}
```

#### 2.5 Donor UI Updates
**Location:** `client/src/Donor Dashboard/FindCampaigns.jsx`

**What donors see:**

1. **Trust Score Badge**
   - Displayed prominently on each campaign card
   - Color-coded:
     - 🟢 Green (80-100): Highly Trustworthy
     - 🔵 Blue (60-79): Trustworthy
     - 🟡 Yellow (40-59): Moderate Trust
     - 🔴 Red (0-39): Low Trust

2. **Fund Utilization Percentage**
   - Shows how efficiently the NGO uses donated funds
   - Helps donors make informed decisions

**Visual Design:**
- Clean, professional trust metrics section
- Gradient background for visual appeal
- Icons for quick recognition
- Responsive layout

---

## How It All Works Together

### Flow Diagram

```
Volunteer Submits Expense
         ↓
Fraud Score Calculated (fraudDetectionService.js)
         ↓
Stored in Expense Model
         ↓
Admin Views in Expense Verification Tab
         ↓
Admin Approves/Rejects Expense
         ↓
Trust Score Service Calculates NGO Score
         ↓
Score Cached in NGO Model (24hr TTL)
         ↓
Donor Views Campaigns
         ↓
Campaign API Enriches with Trust Score
         ↓
Donor Sees Trust Score & Fund Metrics
         ↓
Donor Makes Informed Donation Decision
```

### Caching Strategy

**Why caching?**
- Trust score calculation involves multiple database queries
- Prevents performance issues when loading campaign lists
- Balances freshness with performance

**How it works:**
1. When a campaign is requested, check NGO's cached trust score
2. If score is less than 24 hours old, use cached value
3. If score is stale or missing, calculate fresh score
4. Update NGO model with new score (fire-and-forget)
5. Return enriched campaign data to frontend

**Cache invalidation:**
- Automatic: Every 24 hours
- Manual: Can force recalculation by passing `forceRecalculate: true`

---

## Testing the Implementation

### 1. Test Fraud Score Display (Admin)
1. Log in as admin
2. Navigate to Expense Verification tab
3. Verify fraud scores are displayed with color coding
4. Check that high-risk expenses (60+) are clearly marked

### 2. Test Trust Score Calculation
```javascript
// In browser console or API testing tool
fetch('/api/campaigns/active')
  .then(r => r.json())
  .then(data => {
    console.log('Trust Scores:', data.data.campaigns.map(c => ({
      campaign: c.title,
      trustScore: c.ngoTrustScore,
      utilization: c.ngoFundMetrics.utilizationPercentage
    })));
  });
```

### 3. Test Donor View
1. Log in as donor
2. Navigate to Find Campaigns page
3. Verify trust score badges are visible
4. Check fund utilization percentages
5. Verify color coding matches score ranges

---

## Database Migrations

**Note:** The NGO model has been updated with new fields. Existing NGOs will have default values:
- `trustScore.score`: 75 (neutral)
- `fundMetrics`: All zeros
- `lastCalculated`: Current timestamp

**To populate scores for existing NGOs:**
```javascript
// Run this script once to calculate scores for all NGOs
import NGO from './models/NGO.js';
import { calculateNGOTrustScore } from './services/trustScoreService.js';

const ngos = await NGO.find({});
for (const ngo of ngos) {
  const scoreData = await calculateNGOTrustScore(ngo._id);
  await NGO.findByIdAndUpdate(ngo._id, {
    'trustScore.score': scoreData.trustScore,
    'trustScore.lastCalculated': new Date(),
    'trustScore.breakdown': scoreData.breakdown,
    fundMetrics: scoreData.fundMetrics
  });
  console.log(`Updated ${ngo.ngoName}: ${scoreData.trustScore}/100`);
}
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/admin/expenses` | GET | Get expenses with fraud scores | Admin |
| `/api/campaigns/active` | GET | Get campaigns with trust scores | No |
| `/api/campaigns/filter-options` | GET | Get filter options | No |
| `/api/campaigns/stats` | GET | Get campaign statistics | No |
| `/api/campaigns/:id` | GET | Get single campaign with trust score | No |

---

## Future Enhancements

1. **Real-time Score Updates**
   - WebSocket integration for live score updates
   - Trigger recalculation on significant events

2. **Historical Tracking**
   - Store trust score history
   - Show trends over time
   - Generate trust score reports

3. **Detailed Breakdown View**
   - Modal showing full score breakdown
   - Explanations for each component
   - Recommendations for improvement

4. **NGO Dashboard**
   - Show NGOs their own trust score
   - Provide actionable insights
   - Track improvement over time

5. **Donor Filters**
   - Filter campaigns by minimum trust score
   - Sort by trust score
   - Show only highly-rated NGOs

---

## Troubleshooting

### Trust Score Not Showing
1. Check if NGO exists in database
2. Verify campaign has valid `ngoId`
3. Check browser console for errors
4. Verify API endpoint is returning data

### Fraud Score Not Displaying
1. Verify expense has `fraudScore` field
2. Check admin expense API response
3. Ensure fraud detection service ran on submission

### Performance Issues
1. Check if caching is working (24hr TTL)
2. Monitor database query performance
3. Consider adding indexes on frequently queried fields

---

## Files Modified/Created

### Created:
- `server/src/services/trustScoreService.js`
- `server/src/routes/campaignRoutes.js`
- `TRUST_SCORE_IMPLEMENTATION.md` (this file)

### Modified:
- `server/src/models/NGO.js` - Added trust score and fund metrics fields
- `server/src/app.js` - Registered campaign routes
- `client/src/pages/AdminExpenses.jsx` - Added fraud score column
- `client/src/Donor Dashboard/FindCampaigns.jsx` - Added trust metrics display
- `client/src/Donor Dashboard/FindCampaigns.css` - Added trust metrics styling

---

## Conclusion

This implementation provides a comprehensive trust and transparency system that:
- ✅ Shows fraud scores to admins for better decision-making
- ✅ Calculates multi-dimensional NGO trust scores
- ✅ Displays trust metrics to donors for informed giving
- ✅ Tracks fund utilization for complete transparency
- ✅ Uses smart caching for optimal performance
- ✅ Provides color-coded visual indicators for quick assessment

The system encourages donors to support well-managed, transparent NGOs while helping admins identify and address potential fraud risks.
