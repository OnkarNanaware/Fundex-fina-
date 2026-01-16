# Admin Dashboard NGO-Specific Filtering

## Overview
All admin dashboard endpoints have been updated to filter data by the logged-in admin's NGO ID. This ensures that each admin only sees data related to their own NGO, not all records from all NGOs.

## Changes Made

### 1. **adminController.js**

#### `getPendingRequests()`
- **Before**: Fetched ALL pending volunteer requests from the database
- **After**: Filters requests to show only those related to campaigns belonging to the admin's NGO
- **Logic**: 
  1. Get admin's NGO ID
  2. Find all campaigns for this NGO
  3. Filter volunteer requests by these campaign IDs

#### `getAllExpenses()`
- **Before**: Fetched ALL expenses from the database
- **After**: Filters expenses to show only those related to the admin's NGO campaigns
- **Logic**:
  1. Get admin's NGO ID
  2. Find all campaigns for this NGO
  3. Find all volunteer requests for these campaigns
  4. Filter expenses by these request IDs

### 2. **adminStatsController.js**

#### `getOverallStats()`
- **Before**: Calculated stats across ALL NGOs
- **After**: Calculates stats only for the admin's NGO
- **Metrics Filtered**:
  - Total Approved Amount (from volunteer requests)
  - Total Spent Amount (from expenses)
  - Utilization Percentage

#### `getDashboardStats()`
- **Before**: Calculated comprehensive stats across ALL NGOs
- **After**: Calculates stats only for the admin's NGO
- **Metrics Filtered**:
  - Total Funds (donations to NGO's campaigns)
  - Available Funds
  - Total Allocated
  - Total Spent
  - Total Raised
  - Pending Requests (volunteers)
  - Pending Verification (expenses)
  - Transparency Score
  - Fraud Alerts
  - Active Campaigns
  - Total Campaigns
  - Completed/Paused Campaigns
  - Total Volunteers (for this NGO)
  - Total Donations
  - Pending Donations
  - Verified/Total Expenses

### 3. **adminRoutes.js** (Already Implemented)

#### `GET /api/admin/campaigns`
- Already filtering by admin's NGO ID ✅

#### `POST /api/admin/campaigns`
- Already creating campaigns with admin's NGO ID ✅

#### `GET /api/admin/volunteers/list`
- Already filtering volunteers by admin's NGO ID ✅

## How It Works

### Authentication Flow
1. User logs in as admin
2. JWT token contains `ngoId` from the admin's profile
3. `authMiddleware` extracts user info from token
4. Controllers access `req.user.id` to get admin ID
5. Admin's `ngoId` is fetched from User collection
6. All queries filter by this `ngoId`

### Data Hierarchy
```
Admin (User)
  └─ ngoId → NGO
              └─ Campaigns
                  └─ Volunteer Requests
                      └─ Expenses
```

### Filter Chain
1. **Admin** → Get `ngoId` from logged-in admin
2. **Campaigns** → Filter by `ngoId`
3. **Volunteer Requests** → Filter by campaign IDs
4. **Expenses** → Filter by request IDs
5. **Donations** → Filter by campaign IDs
6. **Volunteers** → Filter by `ngoId`

## Testing

### To Verify the Changes:
1. **Login as Admin A** (NGO 1)
   - Check dashboard stats
   - View campaigns
   - View volunteers
   - View expenses
   - View pending requests

2. **Login as Admin B** (NGO 2)
   - Verify you see DIFFERENT data
   - Confirm no overlap with Admin A's data

3. **Create Test Data**
   - Create campaigns for both NGOs
   - Add volunteers to both NGOs
   - Submit expenses for both NGOs
   - Verify each admin sees only their own data

## Console Logs Added

For debugging, the following console logs have been added:
- `✅ Found X campaigns for NGO {ngoId}`
- `✅ Found X pending requests for NGO {ngoId}`
- `✅ Found X expenses for NGO {ngoId}`
- `✅ Overall stats for NGO {ngoId}: Approved=X, Spent=Y`
- `📊 Fetching dashboard stats for NGO {ngoId}`
- `✅ Dashboard stats for NGO {ngoId}: campaigns=X, volunteers=Y, donations=Z`

## Important Notes

1. **NGO Registration Issue**: The error "NGO with this registration number already exists" is working correctly. Each NGO registration number must be unique in the system.

2. **Data Isolation**: Each admin can now only see and manage data for their own NGO.

3. **Performance**: Queries are optimized using:
   - Parallel Promise.all() calls where possible
   - Selective field projection (`.select('_id')`)
   - Proper indexing on `ngoId` fields

4. **Security**: All routes use `authMiddleware` to ensure only authenticated admins can access the data.

## Next Steps

If you want to further enhance the system:
1. Add NGO-specific donor tracking
2. Implement cross-NGO collaboration features (if needed)
3. Add admin role levels (super admin, NGO admin, etc.)
4. Create NGO-specific reports and analytics
