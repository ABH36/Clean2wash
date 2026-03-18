const axios = require('axios');

async function testSendOTP() {
    try {
        const response = await axios.post('http://localhost:5000/api/consumer/auth/send-otp', {
            identifier: '9876543210',
            type: 'phone',
            userData: {
                name: 'Test Agent',
                phone: '9876543210',
                email: 'test@example.com'
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testSendOTP();
