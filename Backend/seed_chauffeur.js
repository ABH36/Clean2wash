const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const Service = require('./models/Service');

const chauffeurServices = [
    {
        name: 'Point-to-Point Chauffeur',
        description: 'Single trip from A to B with an expert driver.',
        category: 'Chauffeur',
        type: 'sparedriver',
        basePrice: 299,
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80',
        rating: 4.9,
        isAvailable: true,
        isActive: true
    },
    {
        name: 'Hourly Chauffeur Rental',
        description: 'Flexible local errands with a dedicated driver by the hour.',
        category: 'Chauffeur',
        type: 'sparedriver',
        basePrice: 199,
        image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80',
        rating: 4.8,
        isAvailable: true,
        isActive: true
    },
    {
        name: 'Full Day Chauffeur',
        description: 'Dedicated city driver for your entire day of meetings or leisure.',
        category: 'Chauffeur',
        type: 'sparedriver',
        basePrice: 999,
        image: 'https://images.unsplash.com/photo-1511406361295-0a5ff814c0ad?auto=format&fit=crop&q=80',
        rating: 5.0,
        isAvailable: true,
        isActive: true
    },
    {
        name: 'Outstation Chauffeur',
        description: 'Expert inter-city travel care for long distance journeys.',
        category: 'Chauffeur',
        type: 'sparedriver',
        basePrice: 1499,
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80',
        rating: 4.9,
        isAvailable: true,
        isActive: true
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if already exist
        const existing = await Service.find({ category: 'Chauffeur' });
        if (existing.length > 0) {
            console.log('Chauffeur services already exist. Skipping seed.');
            process.exit(0);
        }

        await Service.insertMany(chauffeurServices);
        console.log('Successfully seeded Chauffeur services');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
