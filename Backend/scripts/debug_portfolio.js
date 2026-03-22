const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

mongoose.connect(DB).then(async () => {
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ phone: '9999999999' });
    console.log(`👤 User Found: ${user.name} (${user._id})`);
    console.log(`   Type of user._id: ${typeof user._id}`);
    console.log(`   Is user._id an ObjectId? ${user._id instanceof mongoose.Types.ObjectId}`);

    const findResults = await Booking.find({ consumer: user._id });
    console.log(`📊 find({ consumer: user._id }) results: ${findResults.length}`);

    const aggResults = await Booking.aggregate([
        { $match: { consumer: user._id } }
    ]);
    console.log(`🧪 aggregate([{ $match: { consumer: user._id } }]) results: ${aggResults.length}`);

    const aggResultsCast = await Booking.aggregate([
        { $match: { consumer: new mongoose.Types.ObjectId(String(user._id)) } }
    ]);
    console.log(`🧪 aggregate matching with manual cast results: ${aggResultsCast.length}`);

    process.exit();
}).catch(err => {
    console.error('❌ DB Error:', err);
    process.exit(1);
});
