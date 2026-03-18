const mongoose = require('mongoose');
const Promotion = require('./models/Promotion');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

const updateExpansion = async () => {
    try {
        await mongoose.connect(DB);
        console.log('Connected to DB...');

        const result = await Promotion.findOneAndUpdate(
            { name: 'EP_APARTMENTS' },
            { cta: 'Explore Now', path: '/apartments' },
            { new: true }
        );

        console.log('Updated Apartment Expansion:', result ? result.cta : 'Not Found');

        const driverResult = await Promotion.findOneAndUpdate(
            { name: 'EP_DRIVERS' },
            { cta: 'Join Now', path: '/spare-driver' },
            { new: true }
        );

        console.log('Verified Drivers Expansion:', driverResult ? driverResult.cta : 'Not Found');

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateExpansion();
