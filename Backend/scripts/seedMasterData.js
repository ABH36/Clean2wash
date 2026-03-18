const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MasterData = require('../models/MasterData');
require('colors');

dotenv.config({ path: './.env' });

const seedData = [
    // BANNERS
    {
        type: 'BANNER',
        key: 'MAIN_OFFER_100',
        title: '100% CASHBACK',
        description: 'ON YOUR FIRST SERVICE',
        iconUrl: '/assets/carwash/banner_main.png',
        metadata: {
            id: 1,
            cta: 'Book Now',
            path: '/instant-wash',
            theme: 'dark'
        },
        sortOrder: 1
    },
    // SERVICES - INSTANT WASH
    {
        type: 'SERVICE',
        key: 'INSTANT_WASH',
        title: 'Instant Car/Bike Wash',
        description: 'Uber-style on-demand wash',
        price: 299,
        estimatedTime: 30,
        iconUrl: '/assets/instantwash/carwash.png',
        metadata: {
            id: 's1',
            tag: 'Professional',
            category: 'Express',
            badge: 'Starts @ ₹299',
            provider: 'captain',
            path: '/instant-wash',
            color: '#F29F05',
            inclusions: [
                'Exterior Ceramic Wash',
                'Tyre Premium Polish',
                'Glass Streakless Wipe',
                'Microfiber Drying',
                'Normal Interior Cleaning'
            ],
            exclusions: [
                'Interior Deep Clean',
                'Leather Conditioning',
                'Engine Bay Wash',
                'Dashboard Polish',
                'Upholstery Shampoo'
            ]
        },
        sortOrder: 1
    },
    // SERVICES - STUDIO WASH
    {
        type: 'SERVICE',
        key: 'STUDIO_WASH',
        title: 'Studio Wash',
        description: 'Professional detailing center',
        price: 999,
        comparePrice: 1299,
        estimatedTime: 120,
        iconUrl: '/assets/studiowash/studio.png',
        metadata: {
            id: 's2',
            tag: 'Premium',
            category: 'Detailing',
            badge: 'Advanced Care',
            provider: 'vendor',
            path: '/full-wash-booking',
            color: '#3B82F6',
            inclusions: [
                '3-Step Snow Foam Wash',
                'Interior Vacuum & Dressing',
                'Tyre Gloss & Polish',
                'Engine Bay Cleaning',
                'Iron Decontamination'
            ],
            exclusions: [
                'Paint Correction',
                'Ceramic Coating',
                'Rat Repellent Treatment'
            ]
        },
        sortOrder: 2
    },
    // SERVICES - APARTMENT WASH
    {
        type: 'SERVICE',
        key: 'APARTMENT_WASH',
        title: 'Apartment Car Wash',
        description: 'Cluster subscription plans',
        price: 499,
        estimatedTime: 45,
        iconUrl: '/assets/appartment/appartment.png',
        metadata: {
            id: 's7',
            tag: 'Subscription',
            category: 'Express',
            provider: 'captain',
            path: '/apartments',
            color: '#6366F1',
            inclusions: [
                'Daily Exterior Wipe',
                'Weekly Waterless Wash',
                'Monthly Interior Vacuum',
                'Tyre Dressing'
            ],
            exclusions: [
                'Engine Degreasing',
                'Polishing/Buffing'
            ]
        },
        sortOrder: 3
    },
    // SERVICES - SPARE DRIVER
    {
        type: 'SERVICE',
        key: 'SPARE_DRIVER',
        title: 'Spare Driver',
        description: 'Hire professional drivers',
        price: 199,
        estimatedTime: 60,
        iconUrl: '/assets/sparedriver/sparedriver.png',
        metadata: {
            id: 's3',
            tag: 'On-Demand',
            category: 'Career',
            provider: 'captain',
            path: '/spare-driver',
            color: '#FF8533'
        },
        sortOrder: 4
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...'.green);

        // Clear existing MasterData
        await MasterData.deleteMany({ type: { $in: ['SERVICE', 'BANNER'] } });
        console.log('Old MasterData cleared.'.yellow);

        await MasterData.insertMany(seedData);
        console.log('MasterData seeded successfully!'.cyan.bold);

        process.exit();
    } catch (err) {
        console.error(`Error: ${err.message}`.red);
        process.exit(1);
    }
};

seedDB();
