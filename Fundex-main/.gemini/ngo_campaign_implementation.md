# Admin Registration & Campaign Management Implementation

## Summary of Changes

This implementation separates NGO details into a dedicated collection and links them with admin users. Campaigns are now filtered by NGO ID, and the campaign creation form has been simplified.

## Changes Made

### 1. **Created New NGO Model** (`server/src/models/NGO.js`)
- New collection to store NGO details separately
- Fields: ngoName, ngoRegistrationNumber, ngoType, ngoEstablishedYear, headOfficeState, headOfficeCity
- References admin user via `adminId`
- Includes status and verification status fields

### 2. **Updated User Model** (`server/src/models/User.js`)
- Added `ngoId` field to reference the NGO collection
- Kept existing NGO fields for backward compatibility

### 3. **Updated Campaign Model** (`server/src/models/Campaign.js`)
- Changed `ngoId` reference from 'User' to 'NGO'
- Made `ngoName` optional (can be populated from NGO reference)

### 4. **Updated Admin Registration** (`server/src/routes/authRoutes.js`)
- Creates admin user in Users collection
- Creates NGO in NGOs collection
- Links both: Users.ngoId → NGO._id and NGO.adminId → User._id
- Returns ngoId in registration response
- Validates unique NGO registration number
- Updated `/me` and `/login` endpoints to include ngoId

### 5. **Updated Campaign Routes** (`server/src/routes/adminRoutes.js`)
- GET `/admin/campaigns`: Filters campaigns by admin's NGO ID
- POST `/admin/campaigns`: Automatically uses admin's NGO ID and fetches NGO name
- No need to pass ngoId or ngoName from frontend

### 6. **Updated Admin Registration Form** (`client/src/pages/AdminRegistration.jsx`)
- Added default "Select NGO Type" option to dropdown
- Set initial ngoType value to empty string

### 7. **Updated Admin Dashboard** (`client/src/Admin Dashboard/AdminDashboard.jsx`)
- Removed NGO name input field from campaign creation form
- Removed `ngo` and `ngoId` from campaign form state
- Moved urgency field to location row for balanced layout
- Backend automatically populates ngoId and ngoName from logged-in admin

## Data Flow

### Admin Registration:
1. Admin fills registration form (admin details + NGO details)
2. Backend creates User document
3. Backend creates NGO document with adminId reference
4. Backend updates User with ngoId reference
5. Response includes both user and NGO details
6. Frontend stores complete user object (including ngoId) in localStorage

### Campaign Creation:
1. Admin creates campaign (no NGO field needed)
2. Backend fetches admin's user data
3. Backend gets ngoId from user
4. Backend fetches NGO details using ngoId
5. Backend creates campaign with ngoId and ngoName
6. Campaign is linked to NGO, not to user

### Campaign Fetching:
1. Admin requests campaigns
2. Backend gets admin's ngoId from user data
3. Backend filters campaigns by ngoId
4. Only campaigns for that specific NGO are returned

## Benefits

1. **Separation of Concerns**: NGO data is separate from user data
2. **Data Integrity**: One NGO can have multiple admins in the future
3. **Simplified UI**: No need to enter NGO name when creating campaigns
4. **Better Filtering**: Campaigns are properly filtered by NGO
5. **Scalability**: Easy to add more NGO-specific features

## Testing Checklist

- [ ] Register new admin with NGO details
- [ ] Verify NGO is created in NGOs collection
- [ ] Verify User has ngoId reference
- [ ] Verify localStorage contains ngoId
- [ ] Login as admin and check ngoId is returned
- [ ] Create campaign without NGO name field
- [ ] Verify campaign has correct ngoId and ngoName
- [ ] Verify only campaigns for current NGO are displayed
- [ ] Edit campaign and verify NGO name doesn't change
- [ ] Check "Select NGO Type" appears as default option

## Database Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  role: "admin",
  ngoId: ObjectId, // Reference to NGO
  // ... other fields
}
```

### NGOs Collection
```javascript
{
  _id: ObjectId,
  ngoName: String,
  ngoRegistrationNumber: String,
  ngoType: String,
  adminId: ObjectId, // Reference to User
  // ... other fields
}
```

### Campaigns Collection
```javascript
{
  _id: ObjectId,
  title: String,
  ngoId: ObjectId, // Reference to NGO
  ngoName: String, // Populated from NGO
  createdBy: ObjectId, // Reference to User (admin)
  // ... other fields
}
```
