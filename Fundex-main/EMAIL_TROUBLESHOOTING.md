## Email Not Sending - Troubleshooting Guide

### Current Status
✅ Email configuration is correct (test email sent successfully)
✅ Code changes are in place
❌ Emails not being sent when creating campaigns

### Root Cause
The server needs to be **fully restarted** to load the updated code. The server that's currently running was started before the email code was added.

### Solution Steps

**Step 1: Stop ALL running servers**
1. Go to the terminal running `node server.js`
2. Press `Ctrl + C` to stop it
3. Wait for it to fully stop

**Step 2: Clear Node.js cache (important!)**
```bash
# Run this in the server directory:
rm -rf node_modules/.cache
# Or on Windows:
rd /s /q node_modules\.cache
```

**Step 3: Restart the server**
```bash
node server.js
```

**Step 4: Verify the server loaded the new code**
Look for these lines in the startup logs:
- ✅ MongoDB connected
- 🚀 Server running at http://localhost:5000

**Step 5: Create a campaign**
1. Go to admin dashboard
2. Create a new campaign
3. Watch the server console

**Step 6: Look for these logs**
You should see:
```
📧 Attempting to send campaign creation email to: [your-email]
📧 Admin details: { email: '...', fullName: '...', name: '...' }
✅ Campaign creation email sent successfully to: [your-email]
```

### If You Still Don't See the Logs

**Option A: The route might not be the one being called**

Check the browser Network tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Create a campaign
4. Look for the POST request
5. Check the URL - it should be: `http://localhost:5000/api/admin/campaigns`

**Option B: Test the email directly**

Run this command:
```bash
node test_campaign_email.js
```

This will send a test email directly. If this works but the campaign creation doesn't send emails, then the issue is with the route.

### Common Issues

**Issue 1: Server not restarted**
- Solution: Fully stop and restart the server

**Issue 2: Wrong route being called**
- Check if frontend is calling `/api/admin/campaigns` or a different endpoint
- Solution: Update frontend to use correct endpoint

**Issue 3: Email credentials expired**
- Test with: `node test_campaign_email.js`
- If it fails, regenerate Google App Password

**Issue 4: Admin email is undefined**
- Check the admin user in database has an email field
- Solution: Update admin user record

### Quick Test Commands

```bash
# Test email sending
node test_campaign_email.js

# Check if email env vars are set
node -e "require('dotenv').config(); console.log('EMAIL_USER:', process.env.EMAIL_USER); console.log('CLIENT_URL:', process.env.CLIENT_URL);"

# Restart server with verbose logging
DEBUG=* node server.js
```

### What to Send Me

If it still doesn't work, please send:
1. Screenshot of server console when creating campaign
2. Screenshot of browser Network tab showing the POST request
3. Output of: `node test_campaign_email.js`
