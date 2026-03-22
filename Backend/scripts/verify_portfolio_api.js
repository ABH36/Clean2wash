const mongoose = require('mongoose');
const User = require('./models/User');
const serviceController = require('./modules/consumer/controllers/serviceController');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI;

async function test() {
    await mongoose.connect(DB);
    const user = await User.findOne({ phone: '9999999999' });

    // Mock req/res
    const req = { user: user };
    const res = {
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; }
    };

    await serviceController.getPortfolio(req, res);

    console.log('STATUS:', res.statusCode);
    console.log('COUNT:', res.data.data.portfolio.length);

    const userItems = res.data.data.portfolio.filter(item => item.isUserBooking);
    console.log('USER_BOOKING_ITEMS:', userItems.length);

    if (userItems.length > 0) {
        userItems.forEach((item, i) => {
            console.log(`Item[${i}]: ${item.title} | Before: ${!!item.beforeImg} | After: ${!!item.afterImg}`);
        });
    }

    process.exit();
}

test();
