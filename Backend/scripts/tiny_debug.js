const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI;

async function test() {
    try {
        await mongoose.connect(DB);
        console.log('CONNECTED');
        const count = await User.countDocuments({ phone: '9999999999' });
        console.log('USER_COUNT:' + count);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
