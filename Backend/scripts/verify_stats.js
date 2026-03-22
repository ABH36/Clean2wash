const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI;

async function test() {
    await mongoose.connect(DB);
    const user = await User.findOne({ phone: '9999999999' });

    const stats = await Booking.getConsumerStats(user._id);

    console.log('USER_ID:', user._id);
    console.log('STATS:', JSON.stringify(stats, null, 2));

    process.exit();
}

test();
