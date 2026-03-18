const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

async function test() {
    await mongoose.connect(DB);
    const user = await User.findOne({ phone: '9999999999' });
    const userId = user._id;

    const findCount = await Booking.countDocuments({ consumer: userId });

    // Aggregation with ObjectId
    const agg1 = await Booking.aggregate([{ $match: { consumer: userId } }]);

    // Aggregation with manual ObjectId cast
    const agg2 = await Booking.aggregate([{ $match: { consumer: new mongoose.Types.ObjectId(userId.toString()) } }]);

    // Aggregation with string (should fail)
    const agg3 = await Booking.aggregate([{ $match: { consumer: userId.toString() } }]);

    console.log('FIND_COUNT:' + findCount);
    console.log('AGG_OBJID:' + agg1.length);
    console.log('AGG_MANUAL:' + agg2.length);
    console.log('AGG_STRING:' + agg3.length);

    process.exit();
}

test();
