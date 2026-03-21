const mongoose = require('mongoose');
require('dotenv').config({ path: './Backend/.env' });
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function seedPlans() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const plans = [
            {
                name: 'Monthly Chauffeur (Daily)',
                price: 2999,
                interval: 'Monthly',
                features: ['Unlimited Bookings', 'Priority Support', 'Verified Drivers', 'Daily Duty'],
                applicableServices: ['sparedriver'],
                credits: 30,
                maxVehicles: 2,
                accent: 'indigo'
            },
            {
                name: 'Weekend Chauffeur',
                price: 999,
                interval: 'Monthly',
                features: ['Sat-Sun Only', 'Premium Drivers', '24/7 Support'],
                applicableServices: ['sparedriver'],
                credits: 8,
                maxVehicles: 1,
                accent: 'amber'
            }
        ];

        for (const plan of plans) {
            await SubscriptionPlan.findOneAndUpdate(
                { name: plan.name },
                plan,
                { upsert: true, new: true }
            );
        }

        console.log('Chauffeur plans seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seed-error:', err);
        process.exit(1);
    }
}

seedPlans();
