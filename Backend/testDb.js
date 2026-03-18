const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/carwash';

console.log(`Connecting to: ${uri}`);

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Success: Connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error: Failed to connect to MongoDB');
        console.error(err.message);
        process.exit(1);
    });
