const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const MasterData = require('../models/MasterData');

dotenv.config({ path: path.join(__dirname, '../.env') });

const blackPassPlan = {
    name: 'Clean2Wash BLACK',
    price: 499,
    interval: 'Annual',
    features: [
        '40% off on all doorstep services',
        'Unlimited Priority Access',
        'Dedicated Support Line',
        'Special Offers on Detailing',
        'Valid for 12 Months'
    ],
    status: 'Live',
    accent: 'brand',
    applicableServices: ['Instant Wash', 'Apartment Wash', 'Studio Wash'],
    isActive: true
};

const passConfig = {
    type: 'CONFIG',
    key: 'WASH_PASS_CONFIG',
    title: 'Clean2Wash BLACK Global Settings',
    description: 'Configuration for the premium wash pass membership',
    metadata: {
        discount: 0.4,
        discountLabel: '40% OFF',
        title: 'clean2wash BLACK',
        passId: 'black_pass_annual',
        comparativePrice: 1200,
        marketingLine: 'Save up to 40% on every service',
        termsUrl: '/terms/black-pass'
    },
    isActive: true
};

const seedPass = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Seed SubscriptionPlan
        await SubscriptionPlan.findOneAndUpdate(
            { name: blackPassPlan.name },
            blackPassPlan,
            { upsert: true, new: true }
        );
        console.log('Seeded: SubscriptionPlan -> Clean2Wash BLACK');

        // 2. Seed MasterData Config
        await MasterData.findOneAndUpdate(
            { key: passConfig.key },
            passConfig,
            { upsert: true, new: true }
        );
        console.log('Seeded: MasterData (CONFIG) -> WASH_PASS_CONFIG');

        console.log('Wash Pass seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedPass();
