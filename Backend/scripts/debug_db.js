const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.local_utf8' });

async function debug() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const phone = '6232024681';

        // Check all collections for this phone
        for (const coll of collections) {
            const results = await mongoose.connection.db.collection(coll.name).find({
                $or: [
                    { phone: phone },
                    { phone: '0' + phone },
                    { phone: '+91' + phone }
                ]
            }).toArray();
            if (results.length > 0) {
                console.log(`Found ${results.length} records in collection [${coll.name}]`);
                console.log(JSON.stringify(results[0], null, 2));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
debug();
