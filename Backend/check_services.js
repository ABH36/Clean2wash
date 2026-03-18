const mongoose = require('mongoose');
const MasterData = require('./models/MasterData');

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/carwash');
        const services = await MasterData.find({ type: 'SERVICE' });
        console.log('SERVICES_JSON_START');
        console.log(JSON.stringify(services, null, 2));
        console.log('SERVICES_JSON_END');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
