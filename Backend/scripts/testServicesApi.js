const axios = require('axios');

const testApi = async () => {
    try {
        const response = await axios.get('http://localhost:5001/api/consumer/services');
        console.log('Status Code:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        
        const homeResponse = await axios.get('http://localhost:5001/api/consumer/services/home');
        console.log('Home Data Status:', homeResponse.status);
        if (homeResponse.data.data && homeResponse.data.data.config) {
            console.log('WASH_PASS_CONFIG found:', !!homeResponse.data.data.config.find(c => c.key === 'WASH_PASS_CONFIG'));
        }
    } catch (error) {
        console.error('API Test Failed:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
    }
};

testApi();
