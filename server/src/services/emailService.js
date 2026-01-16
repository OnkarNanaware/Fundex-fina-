import nodemailer from 'nodemailer';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to email
 * @param {string} email - Recipient email
 * @param {string} ngoName - NGO name for personalization
 * @returns {Promise<string>} - Returns the OTP
 */
const sendOTP = async (email, ngoName) => {
  const otp = generateOTP();

  // Store OTP with 10-minute expiry
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: 'NGO Verification OTP - Fundex',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #efe5d7;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #171411;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
          .header {
            background-color: #2a241f;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #efe5d7;
            font-size: 36px;
            margin: 0;
            letter-spacing: 2px;
          }
          .divider {
            width: 100px;
            height: 3px;
            background-color: #dd23bb;
            margin: 15px auto;
          }
          .content {
            padding: 40px 30px;
            color: #efe5d7;
          }
          .content h2 {
            color: #efe5d7;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
            opacity: 0.9;
          }
          .otp-box {
            background-color: #2a241f;
            border: 2px solid #dd23bb;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 42px;
            font-weight: bold;
            color: #dd23bb;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .otp-label {
            font-size: 14px;
            color: #efe5d7;
            opacity: 0.7;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .footer {
            background-color: #2a241f;
            padding: 20px;
            text-align: center;
            color: #efe5d7;
            opacity: 0.7;
            font-size: 14px;
          }
          .warning {
            background-color: rgba(221, 35, 187, 0.1);
            border-left: 4px solid #dd23bb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>NGO Verification Code</h2>
            <p>Hello,</p>
            <p>You are registering <strong>${ngoName}</strong> on Fundex. Please use the following One-Time Password (OTP) to verify your NGO registration:</p>
            
            <div class="otp-box">
              <div class="otp-label">Your OTP Code</div>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
              <p style="margin: 5px 0 0 0;">This OTP is valid for 10 minutes. Do not share this code with anyone. Fundex will never ask for your OTP via phone or email.</p>
            </div>
            
            <p>If you did not request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log(`🔐 [DEV MODE] Generated OTP for ${email}: ${otp}`);
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    return otp;
  } catch (error) {
    // In production, we should throw. In dev/demo without creds, we proceed.
    console.error('❌ Email send failed:', error.message);
    console.error('   Hint: Check your EMAIL_USER and EMAIL_PASSWORD in .env');
    console.log(`⚠️  [DEV MODE] OTP for ${email} is: ${otp}`);
    console.log(`👉 Enter ${otp} in the website to proceed.`);
    return otp; // Return OTP so the flow continues successfully
  }
};

/**
 * Verify OTP
 * @param {string} email - Email to verify
 * @param {string} otp - OTP to verify
 * @returns {boolean} - True if valid, false otherwise
 */
const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);

  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return false;
  }

  if (stored.otp === otp) {
    otpStore.delete(email); // Remove OTP after successful verification
    return true;
  }

  return false;
};

/**
 * Send email notification for volunteer approval
 */
const sendVolunteerApprovalEmail = async (email, volunteerName, ngoName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: '🎉 Your Volunteer Application has been Approved!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #4CAF50; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .success-box { background-color: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; background-color: #4CAF50; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>Congratulations, ${volunteerName}! 🎉</h2>
            <p>Great news! Your volunteer application for <strong>${ngoName}</strong> has been approved.</p>
            <div class="success-box">
              <p style="margin: 0; font-size: 18px; color: #4CAF50;"><strong>✓ Application Approved</strong></p>
            </div>
            <p>You can now access your volunteer dashboard and start making a difference!</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/volunteer/dashboard" class="cta-button">Go to Dashboard</a>
            <p>Thank you for joining us in making the world a better place.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Volunteer approval email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send volunteer approval email:', error.message);
  }
};

/**
 * Send email notification for volunteer rejection
 */
const sendVolunteerRejectionEmail = async (email, volunteerName, ngoName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: 'Update on Your Volunteer Application',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #ff5252; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #efe5d7; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>Application Update</h2>
            <p>Dear ${volunteerName},</p>
            <p>Thank you for your interest in volunteering with <strong>${ngoName}</strong>.</p>
            <p>Unfortunately, your application has not been approved at this time. This decision may be based on current capacity or specific requirements.</p>
            <p>We encourage you to explore other opportunities on Fundex or reach out to the NGO directly for more information.</p>
            <p>Thank you for your commitment to making a positive impact.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Volunteer rejection email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send volunteer rejection email:', error.message);
  }
};

/**
 * Send email notification for fund request approval
 */
const sendFundRequestApprovedEmail = async (email, volunteerName, amount, campaignName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: '✅ Your Fund Request has been Approved',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #4CAF50; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .amount-box { background-color: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }
          .amount { font-size: 36px; font-weight: bold; color: #4CAF50; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>Fund Request Approved! 🎉</h2>
            <p>Dear ${volunteerName},</p>
            <p>Your fund request for <strong>${campaignName}</strong> has been approved.</p>
            <div class="amount-box">
              <div style="font-size: 14px; opacity: 0.7; margin-bottom: 10px;">APPROVED AMOUNT</div>
              <div class="amount">₹${amount.toLocaleString('en-IN')}</div>
            </div>
            <p>You can now proceed with your planned activities. Please ensure to submit expense receipts for transparency.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Fund request approval email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send fund request approval email:', error.message);
  }
};

/**
 * Send email notification for fund request rejection
 */
const sendFundRequestRejectedEmail = async (email, volunteerName, amount, campaignName, reason) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: 'Update on Your Fund Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #ff5252; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #efe5d7; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .reason-box { background-color: rgba(255, 82, 82, 0.1); border-left: 4px solid #ff5252; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>Fund Request Update</h2>
            <p>Dear ${volunteerName},</p>
            <p>Your fund request of <strong>₹${amount.toLocaleString('en-IN')}</strong> for <strong>${campaignName}</strong> has not been approved.</p>
            ${reason ? `<div class="reason-box"><strong>Reason:</strong> ${reason}</div>` : ''}
            <p>Please feel free to submit a revised request or contact your admin for more information.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Fund request rejection email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send fund request rejection email:', error.message);
  }
};

/**
 * Send email notification for new donation
 */
const sendDonationReceivedEmail = async (email, donorName, amount, campaignName, ngoName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: '💝 Thank You for Your Generous Donation!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #dd23bb; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #dd23bb; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .donation-box { background-color: rgba(221, 35, 187, 0.1); border: 2px solid #dd23bb; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }
          .amount { font-size: 36px; font-weight: bold; color: #dd23bb; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>Thank You for Your Donation! 💝</h2>
            <p>Dear ${donorName},</p>
            <p>Your generous donation has been successfully received!</p>
            <div class="donation-box">
              <div style="font-size: 14px; opacity: 0.7; margin-bottom: 10px;">DONATION AMOUNT</div>
              <div class="amount">₹${amount.toLocaleString('en-IN')}</div>
              <div style="font-size: 14px; margin-top: 15px; opacity: 0.8;">
                <strong>Campaign:</strong> ${campaignName}<br>
                <strong>NGO:</strong> ${ngoName}
              </div>
            </div>
            <p>Your contribution will make a real difference in the lives of those we serve. You can track the impact of your donation through your donor dashboard.</p>
            <p>A tax receipt will be generated and available in your dashboard shortly.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Donation receipt email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send donation receipt email:', error.message);
  }
};

/**
 * Send email notification to admin for new donation
 */
const sendAdminDonationNotificationEmail = async (email, adminName, donorName, amount, campaignName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: '💰 New Donation Received!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #4CAF50; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .info-box { background-color: #2a241f; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>New Donation Received! 💰</h2>
            <p>Dear ${adminName},</p>
            <p>Great news! A new donation has been received for your campaign.</p>
            <div class="info-box">
              <p style="margin: 5px 0;"><strong>Donor:</strong> ${donorName}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
              <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaignName}</p>
            </div>
            <p>You can view more details in your admin dashboard.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin donation notification email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send admin donation notification email:', error.message);
  }
};

/**
 * Send email notification for new funding request to donor
 */
const sendFundingRequestToDonorEmail = async (email, donorName, ngoName, campaignName, amount, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: `🙏 Funding Request from ${ngoName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #dd23bb; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #dd23bb; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .request-box { background-color: #2a241f; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .message-box { background-color: rgba(221, 35, 187, 0.1); border-left: 4px solid #dd23bb; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .cta-button { display: inline-block; background-color: #dd23bb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>New Funding Request 🙏</h2>
            <p>Dear ${donorName},</p>
            <p><strong>${ngoName}</strong> has sent you a funding request for their campaign.</p>
            <div class="request-box">
              <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaignName}</p>
              <p style="margin: 5px 0;"><strong>Requested Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
            </div>
            ${message ? `<div class="message-box"><strong>Message from NGO:</strong><br>${message}</div>` : ''}
            <p>Your support can make a significant impact. Please review this request in your donor dashboard.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/donor/dashboard" class="cta-button">View Request</a>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Funding request email sent to donor ${email}`);
  } catch (error) {
    console.error('❌ Failed to send funding request email:', error.message);
  }
};

/**
 * Send email notification for campaign creation
 */
const sendCampaignCreatedEmail = async (email, adminName, campaignTitle, targetAmount) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: '🚀 New Campaign Created Successfully!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #4CAF50; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .campaign-box { background-color: #2a241f; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>Campaign Created Successfully! 🚀</h2>
            <p>Dear ${adminName},</p>
            <p>Your new campaign has been created and is now live on Fundex!</p>
            <div class="campaign-box">
              <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaignTitle}</p>
              <p style="margin: 5px 0;"><strong>Target Amount:</strong> ₹${targetAmount.toLocaleString('en-IN')}</p>
            </div>
            <p>Donors can now discover and contribute to your campaign. You can track progress and manage the campaign from your admin dashboard.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Campaign creation email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send campaign creation email:', error.message);
  }
};

/**
 * Send PDF report via email
 */
const sendReportEmail = async (email, adminName, ngoName, pdfBuffer) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Fundex <noreply@fundex.com>',
    to: email,
    subject: `📊 ${ngoName} - Financial Report`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #efe5d7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #171411; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
          .header { background-color: #2a241f; padding: 30px; text-align: center; }
          .header h1 { color: #efe5d7; font-size: 36px; margin: 0; letter-spacing: 2px; }
          .divider { width: 100px; height: 3px; background-color: #3b82f6; margin: 15px auto; }
          .content { padding: 40px 30px; color: #efe5d7; }
          .content h2 { color: #3b82f6; font-size: 24px; margin-bottom: 20px; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
          .report-box { background-color: #2a241f; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #2a241f; padding: 20px; text-align: center; color: #efe5d7; opacity: 0.7; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUNDEX</h1>
            <div class="divider"></div>
          </div>
          <div class="content">
            <h2>Your Financial Report is Ready! 📊</h2>
            <p>Dear ${adminName},</p>
            <p>Your comprehensive financial and transparency report for <strong>${ngoName}</strong> has been generated.</p>
            <div class="report-box">
              <p style="margin: 5px 0;"><strong>Report Type:</strong> Financial & Transparency Report</p>
              <p style="margin: 5px 0;"><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
              <p style="margin: 5px 0;"><strong>Format:</strong> PDF</p>
            </div>
            <p>The report is attached to this email. It includes:</p>
            <ul style="opacity: 0.9;">
              <li>Key Performance Indicators</li>
              <li>Monthly Financial Trends</li>
              <li>Category Breakdown</li>
              <li>Donor Insights</li>
              <li>Transparency Metrics</li>
              <li>Campaign Performance</li>
            </ul>
            <p>You can also generate and download reports anytime from your admin dashboard.</p>
          </div>
          <div class="footer">
            <p>© 2026 Fundex - Transparent NGO Funding Platform</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `${ngoName.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Report email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send report email:', error.message);
    throw error;
  }
};

export {
  sendOTP,
  verifyOTP,
  sendVolunteerApprovalEmail,
  sendVolunteerRejectionEmail,
  sendFundRequestApprovedEmail,
  sendFundRequestRejectedEmail,
  sendDonationReceivedEmail,
  sendAdminDonationNotificationEmail,
  sendFundingRequestToDonorEmail,
  sendCampaignCreatedEmail,
  sendReportEmail
};