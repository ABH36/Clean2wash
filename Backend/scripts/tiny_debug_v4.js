const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI;

async function test() {
    try {
        await mongoose.connect(DB);
        const user = await User.findOne({ phone: '9999999999' });

        await Vehicle.deleteMany({ owner: user._id });

        const plate = 'DL' + Math.floor(10 + Math.random() * 80) + 'XX' + Math.floor(1000 + Math.random() * 8000);
        const vehicleData = {
            owner: user._id,
            brand: 'Hyundai',
            model: 'Creta',
            type: 'SUV',
            color: 'White',
            plate: plate,
            image: 'https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&q=80&w=800'
        };

        console.log('CALLING_CREATE');
        try {
            const v = await Vehicle.create(vehicleData);
            console.log('SUCCESS:' + v.plate);
        } catch (ve) {
            console.error('CREATE_FAILED:' + ve.name + ' - ' + ve.message);
            if (ve.errors) {
                Object.keys(ve.errors).forEach(k => console.error('  ' + k + ': ' + ve.errors[k].message));
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
