const mongoose = require('mongoose');
const MasterData = require('../models/MasterData');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clean2wash';

async function checkMasterData() {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB');

        const services = await MasterData.find({ type: 'SERVICE' });
        console.log('\n--- Services (type: SERVICE) ---');
        services.forEach(s => {
            console.log(`Key: ${s.key}, Title: ${s.title}, IsActive: ${s.isActive}, SortOrder: ${s.sortOrder}`);
        });

        const categories = await MasterData.find({ type: 'CATEGORY' });
        console.log('\n--- Categories (type: CATEGORY) ---');
        categories.forEach(c => {
            console.log(`Key: ${c.key}, Title: ${c.title}, IsActive: ${c.isActive}, Metadata: ${JSON.stringify(c.metadata)}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkMasterData();
