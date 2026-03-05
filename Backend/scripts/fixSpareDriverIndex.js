/**
 * Run this once to drop the old non-sparse 2dsphere index on SpareDrivers.
 * Usage: node scripts/fixSpareDriverIndex.js
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('sparedrivers');

        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        // Drop the old 2dsphere index (may be named currentLocation_2dsphere)
        try {
            await collection.dropIndex('currentLocation_2dsphere');
            console.log('✅ Dropped old 2dsphere index');
        } catch (e) {
            console.log('ℹ️  Index not found or already dropped:', e.message);
        }

        // Recreate as sparse
        await collection.createIndex(
            { currentLocation: '2dsphere' },
            { sparse: true, name: 'currentLocation_2dsphere_sparse' }
        );
        console.log('✅ Created new sparse 2dsphere index');

        await mongoose.disconnect();
        console.log('✅ Done. You can now start the server normally.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
