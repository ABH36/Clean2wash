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

        const plate = 'DL99AA9999';
        const vehicleData = {
            owner: user._id,
            brand: 'Hyundai',
            model: 'Creta',
            type: 'SUV',
            color: 'White',
            plate: plate,
            image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80'
        };

        console.log('VEHICLE_DATA:', JSON.stringify(vehicleData));

        const v = new Vehicle(vehicleData);
        try {
            await v.validate();
            console.log('VALIDATION_PASSED');
        } catch (ve) {
            console.error('VALIDATION_FAILED:' + ve.message);
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
