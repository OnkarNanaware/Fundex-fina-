# Receipt Processing with GST Validation and Fraud Detection

## Overview

This feature automatically processes volunteer expense receipts to extract and validate GST numbers, detect amounts, and calculate comprehensive fraud scores. This helps admins quickly identify suspicious expenses and verify legitimate ones.

## Features Implemented

### 1. **GST Number Extraction & Validation**
- **Automatic Extraction**: GST numbers are automatically extracted from receipt images using OCR
- **Format Validation**: Validates GST number format using regex pattern
- **Online Verification**: Verifies GST numbers against the GST registry API
- **Business Details**: Retrieves business name, status, and registration details

#### GST Number Format
- Pattern: `[State Code (2 digits)][PAN (10 chars)][Entity (1 digit)][Z][Checksum (1 char)]`
- Example: `29ABCDE1234F1Z5`

### 2. **Fraud Score Calculation**

The system calculates a fraud score from 0-100 based on multiple factors:

#### Scoring Factors

| Factor | Max Points | Description |
|--------|-----------|-------------|
| **Amount Mismatch** | 30 | Difference between claimed and OCR-detected amounts |
| **GST Validation** | 25 | Missing, invalid, or unverified GST numbers |
| **OCR Quality** | 15 | Quality and completeness of text extraction |
| **Overspending** | 20 | Claiming more than remaining approved balance |
| **Suspicious Patterns** | 10 | Round numbers, unusually high amounts |

#### Risk Levels

| Score Range | Risk Level | Action |
|-------------|-----------|--------|
| 0-14 | MINIMAL | Standard verification |
| 15-29 | LOW | Quick admin check |
| 30-49 | MEDIUM | Admin should verify details |
| 50-69 | HIGH | Thorough admin review required |
| 70-100 | CRITICAL | Manual investigation required |

### 3. **Auto-Flagging**

Expenses with fraud scores ≥ 50 are automatically flagged for admin review with detailed reasons.

## API Endpoints

### Volunteer Endpoints

#### Submit Expense with Receipt
```http
POST /api/volunteer/expenses
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
- requestId: string (required)
- amountSpent: number (required)
- description: string
- category: string
- receipt: file (required) - Receipt image
- proof: file (required) - Proof image
```

**Response:**
```json
{
  "success": true,
  "message": "Expense submitted successfully",
  "data": {
    "_id": "...",
    "amountSpent": 5000,
    "gstNumber": "29ABCDE1234F1Z5",
    "gstValid": true,
    "gstBusinessName": "ABC Enterprises",
    "fraudScore": 15,
    "fraudRiskLevel": "LOW",
    "verificationStatus": "pending"
  },
  "fraudAnalysis": {
    "score": 15,
    "riskLevel": "LOW",
    "recommendation": "CAUTION - Minor concerns noted. Quick admin check recommended.",
    "autoFlagged": false
  }
}
```

### Admin Endpoints

#### Get All Expenses (Enhanced)
```http
GET /api/admin/expenses
Authorization: Bearer <admin-token>
```

**Response includes:**
- `fraudScore`: 0-100
- `fraudRiskLevel`: MINIMAL | LOW | MEDIUM | HIGH | CRITICAL
- `gstNumber`: Extracted GST number
- `gstValid`: Boolean indicating GST validity

#### Get Detailed Fraud Analysis
```http
GET /api/admin/expenses/:id/fraud-analysis
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expenseId": "...",
    "volunteer": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "expense": {
      "amountSpent": 5000,
      "receiptImage": "https://...",
      "proofImage": "https://..."
    },
    "ocr": {
      "extractedText": "...",
      "detectedAmount": 5000,
      "textLength": 450
    },
    "gst": {
      "number": "29ABCDE1234F1Z5",
      "valid": true,
      "businessName": "ABC Enterprises",
      "status": "Active",
      "apiVerified": true,
      "validationError": null
    },
    "fraud": {
      "score": 15,
      "riskLevel": "LOW",
      "flags": ["MINOR_AMOUNT_MISMATCH"],
      "details": {
        "amountMismatch": {
          "severity": "low",
          "claimed": 5000,
          "detected": 4950,
          "difference": 50,
          "percentageDiff": "1.00"
        }
      },
      "recommendation": "CAUTION - Minor concerns noted.",
      "report": "🔍 FRAUD ANALYSIS REPORT\n..."
    },
    "verification": {
      "status": "pending",
      "verifiedBy": null,
      "flaggedReason": null
    }
  }
}
```

## Database Schema Updates

### Expense Model

New fields added:

```javascript
{
  // GST Information
  gstNumber: String,              // Extracted GST number
  gstValid: Boolean,              // Is GST valid?
  gstBusinessName: String,        // Business name from GST registry
  gstStatus: String,              // Active/Inactive
  gstApiVerified: Boolean,        // Was it verified via API?
  gstValidationError: String,     // Any validation errors
  
  // Fraud Detection
  fraudScore: Number,             // 0-100
  fraudRiskLevel: String,         // MINIMAL, LOW, MEDIUM, HIGH, CRITICAL
  fraudAnalysis: {
    flags: [String],              // List of fraud flags
    details: Mixed,               // Detailed analysis
    recommendation: String        // Action recommendation
  }
}
```

## Services

### 1. GST Validation Service
**Location:** `server/src/services/gstValidationService.js`

**Functions:**
- `validateGSTFormat(gstNumber)` - Validates GST format using regex
- `validateGSTOnline(gstNumber)` - Validates GST via API
- `extractGSTFromText(text)` - Extracts GST from OCR text
- `validateAndExtractGST(text)` - Complete extraction + validation

### 2. Fraud Detection Service
**Location:** `server/src/services/fraudDetectionService.js`

**Functions:**
- `calculateFraudScore(expenseData)` - Calculates comprehensive fraud score
- `generateFraudReport(fraudAnalysis)` - Generates human-readable report

## Usage Examples

### For Volunteers

When submitting an expense:
1. Upload receipt and proof images
2. System automatically:
   - Extracts text from receipt using OCR
   - Detects amount from receipt
   - Extracts and validates GST number
   - Calculates fraud score
   - Auto-flags if score ≥ 50

### For Admins

Reviewing expenses:
1. View all expenses with fraud scores and risk levels
2. Filter by risk level to prioritize reviews
3. Click on expense to see detailed fraud analysis
4. Review GST validation details
5. See OCR-extracted text and detected amounts
6. Make informed decision to approve/flag

## Testing

### Test GST Numbers

**Valid GST Numbers:**
- Format: `29ABCDE1234F1Z5`
- Use real GST numbers for actual validation

**Invalid GST Numbers:**
- `12INVALID123` - Wrong format
- `00AAAAA0000A0A0` - Invalid checksum

### Test Scenarios

1. **Low Fraud Score:**
   - Receipt with valid GST
   - Amount matches claimed amount
   - Good OCR quality

2. **High Fraud Score:**
   - No GST number on receipt
   - Large amount mismatch
   - Poor OCR quality
   - Overspending

3. **Auto-Flagged:**
   - Invalid GST number
   - 50%+ amount mismatch
   - Overspending + no GST

## Logging

The system provides detailed console logging:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 EXPENSE SUBMISSION WITH FRAUD DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 Uploading receipt to Cloudinary...
✅ Receipt uploaded: https://...
🔍 Starting OCR processing...
✅ OCR extraction completed
📄 Extracted text length: 450 characters
💰 Detected amount: 5000
🔍 Starting GST validation...
📋 GST Validation Result: {...}
✅ Valid GST found: 29ABCDE1234F1Z5
🏢 Business Name: ABC Enterprises
🎯 Calculating fraud score...
📊 Fraud Analysis:
   Score: 15
   Risk Level: LOW
   Flags: []
   Recommendation: CAUTION - Minor concerns noted.
✅ Expense submitted successfully with fraud analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Configuration

### GST API

The system uses a public GST verification API. For production:

1. Consider using official GST portal APIs
2. Add API keys to `.env`:
   ```
   GST_API_KEY=your_api_key
   GST_API_URL=https://api.gst.gov.in/...
   ```

### Fraud Score Thresholds

Adjust thresholds in `fraudDetectionService.js`:

```javascript
// Auto-flag threshold
const AUTO_FLAG_THRESHOLD = 50;

// Risk level thresholds
const RISK_THRESHOLDS = {
  CRITICAL: 70,
  HIGH: 50,
  MEDIUM: 30,
  LOW: 15,
  MINIMAL: 0
};
```

## Future Enhancements

1. **Machine Learning**: Train ML model on historical fraud patterns
2. **Image Quality Check**: Validate receipt image quality before processing
3. **Duplicate Detection**: Check for duplicate receipts
4. **Vendor Verification**: Maintain whitelist/blacklist of vendors
5. **Pattern Analysis**: Detect patterns across multiple expenses
6. **Real-time Alerts**: Notify admins immediately for critical fraud scores
7. **Batch Processing**: Process multiple receipts at once
8. **Export Reports**: Generate fraud analysis reports in PDF/Excel

## Troubleshooting

### GST Validation Fails
- Check internet connectivity
- Verify GST API is accessible
- Falls back to format validation if API fails

### OCR Not Detecting Amount
- Ensure receipt image is clear and high quality
- Check if receipt has proper formatting
- Verify Tesseract is properly installed

### Fraud Score Always 0
- Check if all services are imported correctly
- Verify expense data is being passed to fraud calculator
- Check console logs for errors

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review fraud analysis report for specific issues
3. Verify all services are properly configured
4. Ensure database schema is updated

---

**Last Updated:** January 16, 2026
**Version:** 1.0.0
