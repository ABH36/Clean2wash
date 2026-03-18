const mongoose = require('mongoose');

async function test() {
    try {
        await mongoose.connect('mongodb://localhost:27017/carwash');
        console.log('Successfully connected to MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
}

test();
