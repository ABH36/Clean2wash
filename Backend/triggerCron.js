require('dotenv').config();
const mongoose = require('mongoose');
const { generateDailySubscriptionJobs } = require('./utils/cronService');

async function trigger() {
    try {
        console.log('🚀 Connecting to MongoDB to trigger Cron...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log('⚡ Triggering Daily Subscription Job Generation...');
        await generateDailySubscriptionJobs();
        console.log('✅ Cron Job executed successfully.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Trigger failed:', err);
        process.exit(1);
    }
}

trigger();
