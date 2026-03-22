const axios = require('axios');
const PORT = 5000;
const BASE_AUTH_URL = `http://localhost:${PORT}/api/consumer`;
const BASE_WALLET_URL = `http://localhost:${PORT}/api/consumer/wallet`;

async function testWalletReal() {
    try {
        console.log('--- Step 1: Requesting OTP ---');
        const otpRes = await axios.post(`${BASE_AUTH_URL}/send-otp`, {
            identifier: '9999999999',
            type: 'phone'
        });

        const otp = otpRes.data.data.otp;
        console.log('✅ Received OTP:', otp);

        console.log('\n--- Step 2: Verifying OTP ---');
        const loginRes = await axios.post(`${BASE_AUTH_URL}/verify-otp`, {
            identifier: '9999999999',
            otp: otp
        });

        const token = loginRes.data.token;
        console.log('✅ Login Successful, Token obtained');

        const authHeader = { Authorization: `Bearer ${token}` };

        // 1. Test Get Wallet
        console.log('\n--- Step 3: GET /api/consumer/wallet ---');
        const getRes = await axios.get(BASE_WALLET_URL, { headers: authHeader });
        console.log('Balance:', getRes.data.data.wallet.balance);
        console.log('Recent Txns Count:', getRes.data.data.transactions.length);

        // 2. Test Create Order
        console.log('\n--- Step 4: POST /create-order ---');
        const orderRes = await axios.post(`${BASE_WALLET_URL}/create-order`, { amount: 100 }, { headers: authHeader });
        console.log('Order ID:', orderRes.data.data.order_id);

        // 3. Test Withdraw
        console.log('\n--- Step 5: POST /withdraw ---');
        const withdrawRes = await axios.post(`${BASE_WALLET_URL}/withdraw`, { amount: 10 }, { headers: authHeader });
        console.log('Withdraw Status:', withdrawRes.data.status);
        console.log('New Balance:', withdrawRes.data.data.balance);

        console.log('\n✅ ALL BACKEND TESTS PASSED WITH REAL TOKEN');
        process.exit();
    } catch (err) {
        console.error('❌ TEST FAILED:', err.response?.data || err.message);
        process.exit(1);
    }
}

testWalletReal();
