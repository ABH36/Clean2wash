const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');
require('dotenv').config();

const banners = [
    {
        type: 'Banners',
        title: '100% DOORSTEP PREP',
        subtitle: 'Professional car care at your location',
        image: '/assets/carwash/6.png',
        cta: 'Book Now',
        path: '/services',
        theme: 'dark',
        status: 'Active',
        isActive: true
    },
    {
        type: 'Banners',
        title: 'STUDIO SHINE LEVEL',
        subtitle: 'Ultra-premium detailing & coating',
        image: '/assets/carwash/3.png',
        cta: 'Explore Studio',
        path: '/studios',
        theme: 'light',
        status: 'Active',
        isActive: true
    },
    {
        type: 'Banners',
        title: 'CERAMIC PROTECTION',
        subtitle: 'Shield your paint with nano-tech',
        image: '/assets/carwash/7.png',
        cta: 'View Packages',
        path: '/services/ceramic',
        theme: 'dark',
        status: 'Active',
        isActive: true
    },
    {
        type: 'Banners',
        title: 'HYPER GLOSS FINISH',
        subtitle: 'Mirror-like shine in 45 minutes',
        image: '/assets/carwash/4.png',
        cta: 'Instant Wash',
        path: '/instant-wash',
        theme: 'dark',
        status: 'Active',
        isActive: true
    }
];

const seedBanners = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing banners
        await Promotion.deleteMany({ type: 'Banners' });
        console.log('Cleared existing banners');

        // Insert new banners
        await Promotion.insertMany(banners);
        console.log('Successfully seeded banners');

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedBanners();
