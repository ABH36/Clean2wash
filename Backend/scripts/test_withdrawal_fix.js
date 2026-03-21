const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { executeWalletTransaction } = require('../utils/walletHelper');

async function testWithdrawalFix() {
    try {
        console.log('🚀 Starting Withdrawal Fix Verification...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Setup Test User
        const testPhone = '8888888888';
        await User.deleteMany({ phone: testPhone });

        const user = await User.create({
            name: 'Withdrawal Tester',
            phone: testPhone,
            email: 'tester@withdraw.com',
            password: 'password123',
            role: 'consumer',
            isVerified: true,
            wallet: { balance: 1000 }
        });
        console.log(`✅ Test user created with balance ${user.wallet.balance}`);

        // 2. Perform Withdrawal (Simulation of Controller logic)
        console.log('🧪 Attempting withdrawal of INR 500...');

        const amount = 500;
        const { balance, transaction } = await executeWalletTransaction(
            user._id,
            amount,
            'debit',
            {
                category: 'WITHDRAWAL',
                description: `Withdrawal request for INR ${amount} to bank`,
                referenceId: `TXN-WDR-TEST-${Date.now()}`,
                referenceType: 'withdrawal',
                paymentMethod: 'bank',
                status: 'pending' // THIS IS THE FIX: Pass status here
            }
        );

        // 3. Verify
        console.log('\n📊 --- VERIFICATION RESULTS ---');
        console.log(`Remaining Balance: ${balance} (Expected: 500)`);
        console.log(`Transaction Status: ${transaction.status} (Expected: pending)`);

        if (balance === 500 && transaction.status === 'pending') {
            console.log('\n✅ WITHDRAWAL FIX VERIFICATION SUCCESSFUL!');
        } else {
            console.error('\n❌ WITHDRAWAL FIX VERIFICATION FAILED');
        }

        // Cleanup
        await User.deleteOne({ _id: user._id });
        await WalletTransaction.deleteMany({ user: user._id });

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Verification Error:', error);
        process.exit(1);
    }
}

testWithdrawalFix();
