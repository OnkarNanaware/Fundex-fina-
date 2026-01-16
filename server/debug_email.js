
import 'dotenv/config'; // Load env vars
import { sendOTP } from './src/services/emailService.js';

async function test() {
    console.log('--- Testing Email Service Direct ---');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass:', process.env.EMAIL_PASSWORD ? '******' : 'MISSING');

    // Use the email from env to send to itself
    const targetEmail = process.env.EMAIL_USER;
    if (!targetEmail) {
        console.error('No EMAIL_USER found in .env');
        return;
    }

    try {
        console.log(`Sending test OTP to ${targetEmail}...`);
        const otp = await sendOTP(targetEmail, 'Debug NGO');
        console.log('Result OTP:', otp);
    } catch (e) {
        console.error('Test failed with error:', e);
    }
}

test();
