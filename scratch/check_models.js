const mongoose = require('mongoose');
const VehicleModel = require('./Backend/models/VehicleModel');
const dotenv = require('dotenv');

dotenv.config({ path: './Backend/.env.local' });

async function checkModels() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash');
    const models = await VehicleModel.find({}, 'brand model type');
    console.log('Total models:', models.length);
    console.log('Sample models:', models.slice(0, 10));
    
    const distinctTypes = await VehicleModel.distinct('type');
    console.log('Distinct types:', distinctTypes);
    
    const fourWheelerQuery = { type: { $nin: ['Bike', 'Scooter', 'Superbike'] } };
    const fourWheelers = await VehicleModel.distinct('brand', fourWheelerQuery);
    console.log('Four wheelers brands:', fourWheelers);
    
    const twoWheelerQuery = { type: { $in: ['Bike', 'Scooter', 'Superbike'] } };
    const twoWheelers = await VehicleModel.distinct('brand', twoWheelerQuery);
    console.log('Two wheelers brands:', twoWheelers);

    await mongoose.disconnect();
}

checkModels().catch(console.error);
