const mongoose = require('mongoose');
const VehicleModel = require('../models/VehicleModel');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkModels() {
    console.log('Connecting to:', process.env.MONGODB_URI ? 'URI FOUND' : 'URI NOT FOUND');
    if (!process.env.MONGODB_URI) {
        console.log('Trying fallback .env path...');
        dotenv.config({ path: path.join(__dirname, '../../.env') });
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');
    
    const count = await VehicleModel.countDocuments();
    console.log('Total models:', count);
    
    const types = await VehicleModel.distinct('type', { isActive: true });
    console.log('Active Types in DB:', types);

    const brands4W = await VehicleModel.distinct('brand', { isActive: true, type: { $nin: ['Bike', 'Scooter', 'Superbike'] } });
    console.log('4W Brands (Count):', brands4W.length);
    console.log('4W Brands List:', brands4W);

    const brands2W = await VehicleModel.distinct('brand', { isActive: true, type: { $in: ['Bike', 'Scooter', 'Superbike'] } });
    console.log('2W Brands (Count):', brands2W.length);
    console.log('2W Brands List:', brands2W);

    await mongoose.disconnect();
}

checkModels().catch(console.error);
