const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const WalletTransaction = require('./models/WalletTransaction');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const seedProfile = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const phone = '9999999999';
        const user = await User.findOne({ phone });

        if (!user) {
            console.error('User not found. Please run existing seeds first.');
            process.exit(1);
        }

        console.log(`Seeding data for user: ${user.name} (${phone})`);

        // 1. Ensure User Profile Info
        user.name = 'Aryan Pathak';
        user.email = 'aryan@example.com';
        user.profile.address = {
            street: '123 Luxury Lane',
            city: 'Jabalpur',
            state: 'MP',
            pincode: '482001',
            landmark: 'Near Marble Rocks',
            coordinates: { lat: 23.1815, lng: 79.9864 }
        };

        // 2. Seed Trusted Contacts (New Feature)
        user.profile.trustedContacts = [
            { name: 'Rahul Sharma', phone: '9876543210', relation: 'Brother' },
            { name: 'Priya Verma', phone: '9123456789', relation: 'Friend' }
        ];

        await user.save();
        console.log('User profile and safety contacts updated.');

        // 3. Seed Vehicles
        const vehiclesData = [
            {
                owner: user._id,
                brand: 'BMW',
                model: 'X5',
                type: 'suv',
                color: 'Black',
                plate: 'MP-20-BMW-001',
                isPrimary: true
            },
            {
                owner: user._id,
                brand: 'Tesla',
                model: 'Model S',
                type: 'sedan',
                color: 'White',
                plate: 'MP-20-TSL-002',
                isPrimary: false
            }
        ];

        for (const v of vehiclesData) {
            await Vehicle.findOneAndUpdate({ plate: v.plate }, v, { upsert: true, new: true });
        }

        const userVehicles = await Vehicle.find({ owner: user._id, isActive: true });
        user.vehicles = userVehicles.map(v => v._id);
        user.primaryVehicle = userVehicles.find(v => v.isPrimary)?._id;
        await user.save();
        console.log('Vehicles seeded and linked.');

        // 4. Seed Wallet Transactions
        const txns = [
            {
                user: user._id,
                amount: 500,
                type: 'credit',
                status: 'completed',
                category: 'WALLET_RECHARGE',
                description: 'Bonus Credits Added',
                referenceId: 'TXN-REF-101'
            },
            {
                user: user._id,
                amount: 150,
                type: 'debit',
                status: 'completed',
                category: 'SERVICE_BOOKING',
                description: 'Car Wash Payment',
                referenceId: 'TXN-REF-102'
            },
            {
                user: user._id,
                amount: 50,
                type: 'credit',
                status: 'completed',
                category: 'REWARD',
                description: 'Referral Reward',
                referenceId: 'TXN-REF-103'
            }
        ];

        // Clear old ones for clean test
        await WalletTransaction.deleteMany({ user: user._id });
        await WalletTransaction.insertMany(txns);

        // Update balance
        user.wallet.balance = 400; // 500 - 150 + 50
        await user.save();
        console.log('Wallet transactions seeded.');

        console.log('✅ Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedProfile();
