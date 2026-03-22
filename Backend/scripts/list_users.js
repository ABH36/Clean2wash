const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

mongoose.connect(DB).then(async () => {
    console.log('DB connection successful.');
    const users = await User.find({ role: 'consumer' }).limit(5);
    console.log('Consumers:', users.map(u => ({ id: u._id, phone: u.phone, name: u.name, wallet: u.wallet })));
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
