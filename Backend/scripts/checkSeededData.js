const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const MasterData = require('../models/MasterData');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const services = await MasterData.find({ type: 'SERVICE', isActive: true });
        console.log('Seeded Services:', services.length);
        services.forEach(s => console.log(`- ${s.title} (${s.category || 'No Category'}) [${s.key}]`));

        const configs = await MasterData.find({ type: 'CONFIG', isActive: true });
        console.log('Seeded Configs:', configs.length);
        configs.forEach(c => console.log(`- ${c.key}: ${c.title}`));

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

checkData();
