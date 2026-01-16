// Test email sending for campaign creation
import dotenv from 'dotenv';
import { sendCampaignCreatedEmail } from './src/services/emailService.js';

dotenv.config();

const testEmail = async () => {
    console.log('🧪 Testing campaign creation email...');
    console.log('📧 Email User:', process.env.EMAIL_USER);
    console.log('📧 Client URL:', process.env.CLIENT_URL);

    try {
        await sendCampaignCreatedEmail(
            process.env.EMAIL_USER, // Send to yourself for testing
            'Test Admin',
            'Test Campaign for Email Verification',
            100000
        );
        console.log('✅ Test email sent successfully!');
        console.log('📬 Check your inbox:', process.env.EMAIL_USER);
    } catch (error) {
        console.error('❌ Test email failed:', error);
        console.error('Error details:', error.message);
    }

    process.exit(0);
};

testEmail();
