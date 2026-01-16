/**
 * Test script for NGO Verification API
 * Run this to test the backend endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/ngo-verify';

// Test Darpan IDs from mock API
const TEST_DARPAN_IDS = [
    'MH/2020/0263909',
    'TN/2011/0042860',
    'DL/2018/0192331',
    'KA/2016/0117824',
];

async function testNGOLookup() {
    console.log('\n🔍 Testing NGO Lookup...\n');

    for (const darpanId of TEST_DARPAN_IDS) {
        try {
            const response = await axios.get(`${BASE_URL}/${darpanId}`);
            console.log(`✅ Found NGO: ${response.data.data.ngoName}`);
            console.log(`   Location: ${response.data.data.district}, ${response.data.data.state}`);
            console.log(`   Email: ${response.data.data.email}\n`);
        } catch (error) {
            console.log(`❌ Error fetching ${darpanId}:`, error.response?.data?.message || error.message);
        }
    }
}

async function testOTPFlow() {
    console.log('\n📧 Testing OTP Flow...\n');

    const testDarpanId = TEST_DARPAN_IDS[0];

    try {
        // 1. Fetch NGO data
        console.log('Step 1: Fetching NGO data...');
        const ngoResponse = await axios.get(`${BASE_URL}/${testDarpanId}`);
        const ngoData = ngoResponse.data.data;
        console.log(`✅ NGO Found: ${ngoData.ngoName}`);

        // 2. Send OTP
        console.log('\nStep 2: Sending OTP...');
        const otpResponse = await axios.post(`${BASE_URL}/send-otp`, {
            email: ngoData.email,
            ngoName: ngoData.ngoName,
        });
        console.log(`✅ ${otpResponse.data.message}`);
        console.log(`   Check email: ${ngoData.email}`);

        // 3. Verify OTP (you'll need to enter the OTP from email)
        console.log('\n⚠️  To complete the test:');
        console.log('   1. Check the email for OTP');
        console.log('   2. Run: node test_ngo_verify.js verify <OTP>');

    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }
}

async function testOTPVerification(otp) {
    console.log('\n🔐 Testing OTP Verification...\n');

    const testDarpanId = TEST_DARPAN_IDS[0];

    try {
        // Get NGO data first
        const ngoResponse = await axios.get(`${BASE_URL}/${testDarpanId}`);
        const ngoData = ngoResponse.data.data;

        // Verify OTP
        const verifyResponse = await axios.post(`${BASE_URL}/verify-otp`, {
            email: ngoData.email,
            otp: otp,
        });

        console.log(`✅ ${verifyResponse.data.message}`);
        console.log('   OTP verification successful!');

    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (command === 'verify' && args[1]) {
    testOTPVerification(args[1]);
} else if (command === 'lookup') {
    testNGOLookup();
} else if (command === 'otp') {
    testOTPFlow();
} else {
    console.log('\n📋 NGO Verification API Test Suite\n');
    console.log('Usage:');
    console.log('  node test_ngo_verify.js lookup    - Test NGO lookup');
    console.log('  node test_ngo_verify.js otp       - Test OTP sending');
    console.log('  node test_ngo_verify.js verify <OTP> - Test OTP verification');
    console.log('\nExample:');
    console.log('  node test_ngo_verify.js lookup');
    console.log('  node test_ngo_verify.js otp');
    console.log('  node test_ngo_verify.js verify 123456\n');
}