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
        console.log('CONNECTED');
        const user = await User.findOne({ phone: '9999999999' });
        console.log('USER_ID:' + user._id);

        await Vehicle.deleteMany({ owner: user._id });
        console.log('DELETED');

        const v = await Vehicle.create({
            owner: user._id,
            brand: 'Hyundai',
            model: 'Creta',
            type: 'SUV',
            color: 'White',
            plate: 'DL' + Math.floor(10 + Math.random() * 80) + 'AB' + Math.floor(1000 + Math.random() * 8000),
            image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80'
        });
        console.log('CREATED:' + v.plate);

        process.exit();
    } catch (err) {
        console.error('ERROR_TYPE:' + err.name);
        console.error('ERROR_MSG:' + err.message);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => console.error('FIELD_ERR:' + key + ' - ' + err.errors[key].message));
        }
        process.exit(1);
    }
}
test();
