const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';
const JWT_SECRET = process.env.JWT_SECRET || 'b4d217c55fc6208f5c988b7d0f812d10';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/consumer/wallet`;

async function testWallet() {
    try {
        await mongoose.connect(DB);
        const user = await User.findOne({ phone: '9999999999' });
        if (!user) throw new Error('User not found');

        const token = jwt.sign({ id: user._id, role: 'consumer' }, JWT_SECRET, { expiresIn: '1h' });
        console.log('✅ Generated Token');

        const authHeader = { Authorization: `Bearer ${token}` };

        // 1. Test Get Wallet
        console.log('\n--- Testing GET / ---');
        const getRes = await axios.get(BASE_URL, { headers: authHeader });
        console.log('Balance:', getRes.data.data.wallet.balance);
        console.log('Recent Txns Count:', getRes.data.data.transactions.length);

        // 2. Test Create Order
        console.log('\n--- Testing POST /create-order ---');
        const orderRes = await axios.post(`${BASE_URL}/create-order`, { amount: 100 }, { headers: authHeader });
        console.log('Order ID:', orderRes.data.data.order_id);

        // 3. Test Withdraw
        console.log('\n--- Testing POST /withdraw ---');
        // Let's ensure user has some balance first if 0
        if (user.wallet.balance < 10) {
            user.wallet.balance = 100;
            await user.save();
            console.log('Injected ₹100 for withdrawal test');
        }

        const withdrawRes = await axios.post(`${BASE_URL}/withdraw`, { amount: 50 }, { headers: authHeader });
        console.log('Withdraw Status:', withdrawRes.data.status);
        console.log('New Balance:', withdrawRes.data.data.balance);

        console.log('\n✅ ALL BACKEND TESTS PASSED');
        process.exit();
    } catch (err) {
        console.error('❌ TEST FAILED:', err.response?.data || err.message);
        process.exit(1);
    }
}

testWallet();
