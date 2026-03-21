const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const WalletTransaction = require('../models/WalletTransaction');
const referralService = require('../utils/referralService');

async function verifyPhase4() {
    try {
        console.log('🚀 Starting Phase 4 Verification (Hardened Mock)...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Setup Test Users
        const referrerPhone = '9999999901';
        const refereePhone = '9999999902';

        await User.deleteMany({ phone: { $in: [referrerPhone, refereePhone] } });
        await Vehicle.deleteMany({ plate: 'MH12AA1234' });

        const referrer = await User.create({
            name: 'Referrer User',
            phone: referrerPhone,
            email: 'referrer@test.com',
            password: 'password123',
            role: 'consumer',
            isVerified: true
        });

        const referee = await User.create({
            name: 'Referee User',
            phone: refereePhone,
            email: 'referee@test.com',
            password: 'password123',
            role: 'consumer',
            isVerified: true,
            referredBy: referrer._id
        });

        console.log(`✅ Test users created. Referrer: ${referrer._id}, Referee: ${referee._id}`);

        // 2. Create Mock Vehicle for Referee
        const vehicle = await Vehicle.create({
            owner: referee._id,
            brand: 'Honda',
            model: 'City',
            type: 'Sedan',
            color: 'White',
            plate: 'MH12AA1234',
            isPrimary: true
        });
        console.log(`✅ Mock vehicle created: ${vehicle._id}`);

        // 3. Create and Complete Booking (Full Schema Compliance)
        const booking = await Booking.create({
            bookingId: 'BK-TEST-P4-' + Date.now().toString(36),
            consumer: referee._id,
            vehicle: vehicle._id,
            service: {
                id: 'SRV-TEST',
                name: 'Full Wash',
                category: 'Doorstep',
                type: 'captain'
            },
            pricing: {
                baseAmount: 500,
                totalAmount: 500,
                currency: 'INR'
            },
            location: {
                type: 'home',
                address: { street: 'Test St', city: 'Test City', state: 'Test State', pincode: '411001' }
            },
            provider: {
                type: 'captain',
                model: 'Captain',
                id: new mongoose.Types.ObjectId()
            },
            status: 'completed',
            isActive: true
        });

        console.log(`✅ Mock completed booking created: ${booking.bookingId}`);

        // 4. Trigger Referral Reward
        console.log('🧪 Triggering Referral Service...');
        await referralService.processReferralReward(referee._id, booking._id);

        // 5. Verify Results
        const updatedReferrer = await User.findById(referrer._id);
        const updatedReferee = await User.findById(referee._id);

        // Wait a bit for async operations if any (though referralService is awaited)
        const transactions = await WalletTransaction.find({
            user: { $in: [referrer._id, referee._id] },
            category: 'REFERRAL'
        });

        console.log('\n📊 --- VERIFICATION RESULTS ---');
        console.log(`Referrer Balance: ${updatedReferrer.wallet?.balance || 0} (Expected: 50)`);
        console.log(`Referrer Invites: ${updatedReferrer.referralsCount} (Expected: 1)`);
        console.log(`Referee Balance: ${updatedReferee.wallet?.balance || 0} (Expected: 50)`);
        console.log(`Referral Transactions found: ${transactions.length} (Expected: 2)`);

        if ((updatedReferrer.wallet?.balance === 50) && (updatedReferee.wallet?.balance === 50) && transactions.length === 2) {
            console.log('\n✅ PHASE 4 VERIFICATION SUCCESSFUL!');
        } else {
            console.error('\n❌ PHASE 4 VERIFICATION FAILED: Data mismatch');
            console.log('Referrer Wallet:', updatedReferrer.wallet);
            console.log('Referee Wallet:', updatedReferee.wallet);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Verification Error:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Field: ${key}, Message: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
}

verifyPhase4();
