const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MasterData = require('../models/MasterData');

dotenv.config({ path: './.env.local' });

const chauffeurServices = [
    {
        type: 'SERVICE',
        key: 'CHAUFFEUR_POINT',
        title: 'Point-to-Point',
        description: 'Single trip from A to B',
        price: 299,
        estimatedTime: 60,
        metadata: {
            id: 'point',
            tag: 'CHAUFFEUR',
            category: 'Chauffeur',
            provider: 'sparedriver',
            features: ['Verified Driver', 'One-way Trip', 'Insurance Covered'],
            badge: 'Reliable'
        }
    },
    {
        type: 'SERVICE',
        key: 'CHAUFFEUR_HOURLY',
        title: 'Hourly Booking',
        description: 'Flexible local errands',
        price: 199,
        estimatedTime: 240,
        metadata: {
            id: 'hourly',
            tag: 'CHAUFFEUR',
            category: 'Chauffeur',
            provider: 'sparedriver',
            features: ['Expert Driver', '4h/8h/12h Slots', 'Background Verified'],
            badge: 'Flexible'
        }
    },
    {
        type: 'SERVICE',
        key: 'CHAUFFEUR_FULLDAY',
        title: 'Full Day',
        description: 'Dedicated city driver',
        price: 999,
        estimatedTime: 720,
        metadata: {
            id: 'full',
            tag: 'CHAUFFEUR',
            category: 'Chauffeur',
            provider: 'sparedriver',
            features: ['Private Driver', 'Local Travel', '12 Hours Service'],
            badge: 'Saves Time'
        }
    },
    {
        type: 'SERVICE',
        key: 'CHAUFFEUR_OUTSTATION',
        title: 'Outstation',
        description: 'Inter-city travel care',
        price: 1499,
        estimatedTime: 1440,
        metadata: {
            id: 'outstation',
            tag: 'CHAUFFEUR',
            category: 'Chauffeur',
            provider: 'sparedriver',
            features: ['Highway Expert', 'Inter-city Trip', 'Stay Included'],
            badge: 'Luxury'
        }
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const service of chauffeurServices) {
            await MasterData.findOneAndUpdate(
                { key: service.key },
                service,
                { upsert: true, new: true }
            );
            console.log(`Seeded: ${service.title}`);
        }

        console.log('Chauffeur seeding complete');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
