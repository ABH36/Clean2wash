require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Subscription = mongoose.model('Subscription', new mongoose.Schema({ 
            status: String, 
            endDate: Date, 
            vehicle: mongoose.Schema.Types.ObjectId, 
            hub: mongoose.Schema.Types.ObjectId,
            slot: String 
        }));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const query = { 
            status: 'active', 
            endDate: { $gte: today }, 
            vehicle: { $exists: true, $ne: null }, 
            hub: { $exists: true, $ne: null } 
        };
        
        console.log('QUERY:', JSON.stringify(query));
        const subs = await Subscription.find(query);
        console.log('ACTIVE_SUBS_COUNT:', subs.length);
        
        if (subs.length > 0) {
            console.log('FIRST_SUB:', JSON.stringify(subs[0]));
        } else {
            const allSubs = await Subscription.find({});
            console.log('TOTAL_SUBS_IN_DB:', allSubs.length);
            if(allSubs.length > 0) console.log('SAMPLE_SUB_STATUS:', allSubs[0].status, allSubs[0].endDate);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
