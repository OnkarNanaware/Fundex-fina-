import axios from 'axios';

const testRegistration = async () => {
    const timestamp = Date.now();
    const data = {
        fullName: `Test Admin ${timestamp}`,
        email: `admin${timestamp}@example.com`,
        phoneNumber: "1234567890",
        password: "password123",
        ngoName: `Test NGO ${timestamp}`,
        ngoRegistrationNumber: `REG${timestamp}`,
        ngoType: "Trust",
        ngoEstablishedYear: 2020,
        headOfficeState: "Maharashtra",
        headOfficeCity: "Pune"
    };

    try {
        console.log('Sending registration request...');
        const response = await axios.post('http://localhost:5000/api/auth/register-admin', data);
        console.log('✅ Success:', response.status);
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('❌ Error Status:', error.response.status);
            console.error('❌ Error Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.code === 'ECONNREFUSED') {
            console.error('❌ Connection refused. Is the server running?');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
};

testRegistration();
