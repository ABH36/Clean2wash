const mongoose = require('mongoose');
const MasterData = require('./models/MasterData');
const Promotion = require('./models/Promotion');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

const checkData = async () => {
    try {
        await mongoose.connect(DB);

        const exploreItems = await MasterData.find({ 'metadata.isExplore': true });
        console.log('--- Explore Items (MasterData) ---');
        console.log(JSON.stringify(exploreItems, null, 2));

        const expansionItems = await Promotion.find({ type: 'Expansion' });
        console.log('\n--- Expansion Items (Promotion) ---');
        console.log(JSON.stringify(expansionItems, null, 2));

        const allPromos = await Promotion.find({ status: 'Active', isActive: true });
        console.log('\n--- Active Promotions ---');
        allPromos.forEach(p => console.log(`- ${p.title} (${p.type})`));

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

checkData();
