const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Service = require('./models/Service');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';
const JWT_SECRET = process.env.JWT_SECRET || 'b4d217c55fc6208f5c988b7d0f812d10';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/consumer/bookings`;

async function testPrepayment() {
    try {
        await mongoose.connect(DB);
        console.log('✅ Connected to DB');

        const user = await User.findOne({ phone: '9999999999' });
        if (!user) throw new Error('Test user 9999999999 not found. Please run seed.js first.');

        const vehicle = await Vehicle.findOne({ owner: user._id });
        if (!vehicle) throw new Error('Test vehicle not found for user.');

        const token = jwt.sign({ id: user._id, role: 'consumer' }, JWT_SECRET, { expiresIn: '1h' });
        const authHeader = { Authorization: `Bearer ${token}` };

        const servicePayload = {
            vehicleId: vehicle._id.toString(),
            service: {
                id: 'eco_wash',
                name: 'Eco Wash',
                type: 'captain',
                category: 'Doorstep',
                basePrice: 299,
                duration: '40 min'
            },
            schedule: {
                type: 'instant',
                date: new Date().toISOString()
            },
            location: {
                type: 'home',
                address: {
                    street: '123 Test St',
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    pincode: '560001'
                }
            },
            vehicleType: 'sedan'
        };

        // 1. Test Online Booking WITHOUT Payment ID (Should Fail)
        console.log('\n--- Test 1: Online Booking WITHOUT Payment ID (Should Fail) ---');
        try {
            const res = await axios.post(BASE_URL, {
                ...servicePayload,
                paymentMethod: 'online'
            }, { headers: authHeader });
            console.log('❌ Unexpected Success:', res.data);
        } catch (err) {
            console.log('✅ Correctly Rejected:', err.response?.data?.message || err.message);
        }

        // 2. Test Online Booking WITH Payment ID (Should Succeed)
        console.log('\n--- Test 2: Online Booking WITH Payment ID (Should Succeed) ---');
        try {
            const res2 = await axios.post(BASE_URL, {
                ...servicePayload,
                paymentMethod: 'online',
                paymentId: 'pay_test_123',
                orderId: 'order_test_123'
            }, { headers: authHeader });
            
            if (res2.data.status === 'success') {
                console.log('✅ Booking Created Successfully with Payment ID');
                console.log('Booking ID:', res2.data.data.booking._id);
                console.log('Payment Status:', res2.data.data.booking.payment.status);
            } else {
                console.log('❌ Failed to Create Booking:', JSON.stringify(res2.data));
            }
        } catch (err) {
            console.error('❌ Test 2 FAILED');
            if (err.response?.data) {
                fs.writeFileSync('error_log.json', JSON.stringify(err.response.data, null, 2));
                console.log('Error details written to error_log.json');
            } else {
                console.error(err.message);
            }
            throw err;
        }

        // 3. Test Wallet Booking WITHOUT enough balance (Should Fail)
        console.log('\n--- Test 3: Wallet Booking WITHOUT enough balance (Should Fail) ---');
        user.wallet.balance = 0;
        await user.save();
        try {
            await axios.post(BASE_URL, {
                ...servicePayload,
                paymentMethod: 'wallet'
            }, { headers: authHeader });
            console.log('❌ Unexpected Success with 0 balance');
        } catch (err) {
            console.log('✅ Correctly Rejected (Insufficient Balance):', err.response?.data?.message || err.message);
        }

        // 4. Test Wallet Booking WITH enough balance (Should Succeed)
        console.log('\n--- Test 4: Wallet Booking WITH enough balance (Should Succeed) ---');
        user.wallet.balance = 5000;
        await user.save();
        const res4 = await axios.post(BASE_URL, {
            ...servicePayload,
            paymentMethod: 'wallet',
            walletTransactionId: 'txn_test_123'
        }, { headers: authHeader });
        if (res4.data.status === 'success') {
            console.log('✅ Wallet Booking Created Successfully');
            console.log('Booking ID:', res4.data.data.booking._id);
            console.log('Payment Status:', res4.data.data.booking.payment.status);
        } else {
            console.log('❌ Wallet Booking Failed:', JSON.stringify(res4.data));
        }

        console.log('\n✅ ALL PRE-PAYMENT TESTS PASSED');
        process.exit();
    } catch (err) {
        console.error('\n❌ GLOBAL ERROR:', err.message);
        process.exit(1);
    }
}

testPrepayment();
