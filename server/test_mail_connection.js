
import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testConnection() {
    console.log('--- Config ---');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass Length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verification successful!');
    } catch (error) {
        console.error('❌ Connection verification failed!');
        console.error(error);
    }

    try {
        console.log('Sending test mail...');
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test Mail',
            text: 'Hello world'
        });
        console.log('✅ Email sent!');
    } catch (error) {
        console.error('❌ Email sending failed!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        // console.error('Full Error:', JSON.stringify(error, null, 2)); 
    }
}

testConnection();
