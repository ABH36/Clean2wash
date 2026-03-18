const mongoose = require('mongoose');
const Service = require('../models/Service');
const MasterData = require('../models/MasterData');
require('dotenv').config({ path: 'C:/Users/FTT/Documents/GitHub/Clean-2-Wash/Backend/.env.local' });

async function fullSync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Update Service Collection
        const sRes = await Service.updateMany(
            { category: { $in: ['Studio', 'Detailing'] } }, 
            { $set: { category: 'Studio Detailing' } }
        );
        console.log(`Service collection: ${sRes.modifiedCount} updated.`);

        // 2. Update MasterData metadata categories
        const mRes = await MasterData.updateMany(
            { 'metadata.category': { $in: ['Studio', 'Detailing'] } }, 
            { $set: { 'metadata.category': 'Studio Detailing' } }
        );
        console.log(`MasterData collection: ${mRes.modifiedCount} updated.`);

        process.exit(0);
    } catch (err) {
        console.error('SYNC ERROR:', err.message);
        process.exit(1);
    }
}

fullSync();
