const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './Backend/.env.local' });

const { generateDailySubscriptionJobs } = require('./Backend/utils/cronService');

async function test() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Running subscription job generation...');
        await generateDailySubscriptionJobs();
        console.log('Done.');

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();
