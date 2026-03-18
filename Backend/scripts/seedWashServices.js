const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const MasterData = require('../models/MasterData');

dotenv.config({ path: path.join(__dirname, '../.env') });

const services = [
    {
        type: 'SERVICE',
        key: 'INSTANT_WASH',
        title: 'Instant Car/Bike Wash',
        description: 'Doorstep pressure foam wash & detailing',
        price: 299,
        comparePrice: 499,
        estimatedTime: 120, // mins
        iconUrl: '/assets/carwash/6.png',
        metadata: {
            id: 'instant-wash',
            category: 'Instant Wash',
            tag: 'LIVE NOW',
            rating: 4.8,
            reviews: 2530,
            provider: 'captain',
            inclusions: ['Pressure Foam Wash', 'Deep Interior Cleaning', 'Ceramic Shine', 'Tire Dressing'],
            exclusions: ['Engine Degreasing', 'Heavy Stain Removal'],
            addons: [
                { id: 'a1', name: 'Interior Sanitization', price: 99 },
                { id: 'a2', name: 'Leather Conditioning', price: 149 }
            ]
        },
        sortOrder: 1
    },
    {
        type: 'SERVICE',
        key: 'APARTMENT_WASH',
        title: 'Apartment Car Wash',
        description: 'Monthly dedicated waterless washing',
        price: 499,
        comparePrice: 899,
        estimatedTime: 45,
        iconUrl: '/assets/carwash/2.png',
        metadata: {
            id: 'apartment-wash',
            category: 'Apartment Wash',
            tag: 'SUBSCRIPTION',
            rating: 4.9,
            reviews: 1240,
            provider: 'captain',
            inclusions: ['Waterless Dry Wash', 'Interior Vacuuming', 'Dashboard Polish', 'Window Cleaning'],
            exclusions: ['Full Exterior Foam', 'Underbody Wash'],
            addons: [
                { id: 'a3', name: 'Rain Repellent', price: 199 }
            ]
        },
        sortOrder: 2
    },
    {
        type: 'SERVICE',
        key: 'SPARE_DRIVER',
        title: 'Spare Driver',
        description: 'Trusted drivers for your vehicle',
        price: 199,
        comparePrice: 399,
        estimatedTime: 30,
        iconUrl: '/assets/carwash/1.png',
        metadata: {
            id: 'spare-driver',
            category: 'Spare Driver',
            tag: 'ON-DEMAND',
            rating: 4.7,
            reviews: 890,
            provider: 'captain',
            inclusions: ['Punctual Arrival', 'Safe Driving Guaranteed', 'City/Highway Experts'],
            exclusions: ['Fuel Charges', 'Toll Taxes'],
            addons: []
        },
        sortOrder: 3
    },
    {
        type: 'CATEGORY',
        key: 'CAT_WASH_CARE',
        title: 'Wash & Care',
        description: 'Premium doorstep cleaning services',
        iconUrl: 'droplets',
        metadata: { portal: 'consumer', path: '/full-wash-booking' },
        sortOrder: 1
    }
];

const seedServices = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Upsert services
        for (const service of services) {
            await MasterData.findOneAndUpdate(
                { key: service.key },
                service,
                { upsert: true, new: true }
            );
            console.log(`Seeded: ${service.title}`);
        }

        console.log('All wash services seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedServices();
