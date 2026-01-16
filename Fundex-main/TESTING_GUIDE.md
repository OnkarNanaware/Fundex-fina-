# How to Test and Debug Expense Submission

## 🧪 Step-by-Step Testing Guide

### Step 1: Open Browser Console
1. Open your browser (Chrome/Edge/Firefox)
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Clear the console (click 🚫 icon)

### Step 2: Try to Submit an Expense
1. Go to http://localhost:5173
2. Login as a volunteer
3. Go to **Expenses** tab
4. Click **Submit Expense**
5. Fill in the form:
   - Select an approved fund request
   - Enter amount (e.g., 5000)
   - Upload receipt image
   - Upload proof image
   - Add description
6. Click **Submit**

### Step 3: Check Console Output

You should see these logs in order:

```
🚀 Starting expense submission...
Form data: {requestId: "...", amountSpent: "5000", ...}
Receipt file: receipt.jpg
Proof file: proof.jpg
📦 Creating FormData...
📤 Sending request to /volunteer/expenses...
✅ Response received: {success: true, ...}
📊 Fraud Analysis: {score: 15, riskLevel: "LOW", ...}
💾 Expense Data: {_id: "...", gstNumber: "...", ...}
🔄 Refreshing dashboard data...
✅ Submission process completed
```

### Step 4: Check for Errors

#### If you see this:
```
❌ Error submitting expense: ...
Error details: {...}
```

**Then check:**
1. **Network Tab** in DevTools
2. Look for `/api/volunteer/expenses` request
3. Check the **Response** tab
4. Note the error message

#### Common Errors and Solutions:

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Both receipt and proof images are required" | Missing files | Upload both images |
| "Amount exceeds remaining balance" | Overspending | Check approved amount |
| "Approved fund request not found" | Wrong request | Select approved request |
| "Request ID and amount spent are required" | Empty fields | Fill all fields |
| Network error / 500 | Server issue | Check server logs |

---

## 🔍 Checking Server Logs

### In Server Terminal:

You should see:
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

### If Server Shows Errors:

```
❌ Error submitting expense: ...
```

**Common Server Errors:**

1. **Cloudinary Error**
   ```
   Error uploading to Cloudinary
   ```
   - Check `.env` file has correct Cloudinary credentials
   - Verify: `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME`

2. **OCR Error**
   ```
   ⚠️ OCR processing failed
   ```
   - This is OK, fraud detection will still work
   - OCR is optional

3. **GST API Error**
   ```
   ❌ GST validation error
   ```
   - This is OK, will fall back to format validation
   - GST API might be down

4. **Database Error**
   ```
   Error: Cannot find module...
   ```
   - Restart the server
   - Check MongoDB connection

---

## 🐛 Debugging Checklist

### Before Submitting:
- [ ] Server is running (port 5000)
- [ ] Client is running (port 5173)
- [ ] Logged in as volunteer
- [ ] Have at least one APPROVED fund request
- [ ] Both images are selected (receipt + proof)
- [ ] Amount is filled in
- [ ] Request is selected from dropdown

### During Submission:
- [ ] Console shows "🚀 Starting expense submission..."
- [ ] Console shows form data
- [ ] Console shows "📤 Sending request..."
- [ ] No red errors in console (ignore Stripe)

### After Submission:
- [ ] Console shows "✅ Response received"
- [ ] Alert popup appears with fraud analysis
- [ ] Modal closes
- [ ] New expense appears in Expenses tab
- [ ] Expense shows fraud score badge
- [ ] Expense shows GST badge (if GST found)

---

## 🎯 Quick Test with Sample Data

### Minimal Test:
1. **Request**: Select any approved request
2. **Amount**: 1000
3. **Description**: "Test expense"
4. **Category**: general
5. **Receipt**: Any image file
6. **Proof**: Any image file

### Expected Result:
- ✅ Submission successful
- 📊 Fraud score displayed
- 🏢 GST info (if found on receipt)
- Expense appears in list

---

## 📸 What to Check in UI

### In Expense Card:
1. **Fraud Score Badge** - Should show score and risk level
2. **GST Badge** - Should show if GST found
3. **Verification Status** - Should show PENDING
4. **OCR Info** - Should show detected amount (if any)
5. **Receipt Image** - Should display uploaded image

### Colors to Expect:
- 🟢 Green = Good (low fraud, valid GST)
- 🔵 Blue = OK (low risk)
- 🟡 Yellow = Caution (medium risk)
- 🟠 Orange = Warning (high risk)
- 🔴 Red = Alert (critical risk, invalid GST)

---

## 🚨 If Nothing Works

### Nuclear Option - Restart Everything:

1. **Stop both servers** (Ctrl+C in both terminals)

2. **Restart Server:**
   ```bash
   cd server
   node server.js
   ```
   Wait for: "✅ Server running on port 5000"

3. **Restart Client:**
   ```bash
   cd client
   npm run dev
   ```
   Wait for: "Local: http://localhost:5173"

4. **Clear Browser Cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Reload page (Ctrl+F5)

5. **Try Again**

---

## 📞 Report Issues

If still not working, provide:

1. **Browser Console Output** (copy all logs)
2. **Server Terminal Output** (copy all logs)
3. **Network Tab** screenshot of failed request
4. **Error message** from alert
5. **What you were trying to do**

---

## ✅ Success Indicators

You know it's working when:
- ✅ Alert shows fraud analysis
- ✅ Alert shows GST validation
- ✅ Expense appears in Expenses tab
- ✅ Fraud score badge is visible
- ✅ GST badge is visible (if GST found)
- ✅ Server logs show complete processing
- ✅ No errors in console (except Stripe - ignore that)

---

**Last Updated**: January 16, 2026
**Version**: 2.0.0 with Enhanced Debugging
