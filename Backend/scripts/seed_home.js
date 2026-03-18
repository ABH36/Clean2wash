const mongoose = require('mongoose');
const MasterData = require('../models/MasterData');
const Promotion = require('../models/Promotion');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

const homeData = {
    explore: [
        { type: 'CATEGORY', key: 'EXPLORE_PRODUCTS', title: 'Products', description: 'Premium car care products', iconUrl: '/assets/product-accessories/product.png', metadata: { path: '/e-shop', isExplore: true }, sortOrder: 1 },
        { type: 'CATEGORY', key: 'EXPLORE_INSURANCE', title: 'Insurance', description: 'Car insurance services', iconUrl: 'shield-check', metadata: { path: '/insurance', color: '#EF4444', isExplore: true }, sortOrder: 2 },
        { type: 'CATEGORY', key: 'EXPLORE_PUC', title: 'PUC', description: 'Pollution control testing', iconUrl: 'activity', metadata: { action: 'triggerPUC', color: '#F59E0B', isExplore: true }, sortOrder: 3 }
    ],
        {
    type: 'Expansion',
        name: 'EP_DRIVERS',
            title: 'Spare Drivers',
                subtitle: 'ELITE DRIVING CAREER',
                    image: '/assets/icons/driver.png',
                        cta: 'Join Now',
                            path: '/spare-driver',
                                theme: 'dark',
                                    val: 'from-orange-500/25 to-brand/40', // Use val for gradient
                                        status: 'Active'
},
{
    type: 'Expansion',
        name: 'EP_APARTMENTS',
            title: 'Apartments',
                subtitle: 'RESIDENTIAL SLOTS',
                    image: '/assets/icons/apartment.png',
                        cta: 'Explore Now',
                            path: '/apartments',
                                theme: 'dark',
                                    val: 'from-blue-500/25 to-indigo-500/40',
                                        status: 'Active'
},
{
    type: 'Expansion',
        name: 'EP_CORPORATE',
            title: 'Corporate',
                subtitle: 'WORKSPACE CARE',
                    image: '/assets/icons/corporate.png',
                        cta: 'Soon',
                            path: '/corporate',
                                theme: 'dark',
                                    val: 'from-emerald-500/25 to-teal-500/40',
                                        status: 'Active'
}
    ],
banners: [
    {
        type: 'Offers',
        name: 'MONTHLY_SHINE_BANNER',
        title: 'MONTHLY SHINE',
        subtitle: 'Hassle-free elite care from ₹299',
        image: '/assets/carwashsubscription/7.png',
        cta: 'View Plans',
        path: '/subscriptions',
        theme: 'light',
        val: 'Best Seller',
        status: 'Active'
    },
    {
        type: 'Referrals',
        name: 'REFER_EARN_BANNER',
        title: 'GIFT YOUR FRIENDS ₹100 REWARD',
        subtitle: 'Share the shine & earn together',
        image: '/assets/carwash/6.png',
        cta: 'Invite Now',
        path: '/refer',
        theme: 'dark',
        val: 'Invite Rewards',
        status: 'Active'
    }
]
};

const seedHome = async () => {
    try {
        await mongoose.connect(DB);
        console.log('DB connection successful for home seeding.');

        // 1. Seed Explore items into MasterData
        for (const item of homeData.explore) {
            await MasterData.findOneAndUpdate({ key: item.key }, item, { upsert: true });
        }
        console.log('Explore categories seeded');

        // 2. Seed Expansion & Special Banners into Promotion
        for (const item of [...homeData.expansion, ...homeData.banners]) {
            await Promotion.findOneAndUpdate({ name: item.name }, item, { upsert: true });
        }
        console.log('Expansion and Home banners seeded');

        mongoose.connection.close();
        console.log('Seeding complete');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedHome();
