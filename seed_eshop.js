const mongoose = require('mongoose');
const Promotion = require('./Backend/models/Promotion');
const MasterData = require('./Backend/models/MasterData');
const Setting = require('./Backend/models/Setting');
require('dotenv').config({ path: './Backend/.env' });

const seedEShopMetadata = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Seed Categories
        const categories = [
            {
                type: 'CATEGORY',
                key: 'Accessories',
                title: 'Vehicle Accessories',
                iconUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
                isActive: true,
                sortOrder: 1,
                metadata: { portal: 'eshop' }
            },
            {
                type: 'CATEGORY',
                key: 'Electronics',
                title: 'Safety & Protection',
                iconUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
                isActive: true,
                sortOrder: 2,
                metadata: { portal: 'eshop' }
            },
            {
                type: 'CATEGORY',
                key: 'Cleaning',
                title: 'Car & Bike Care Kit',
                iconUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80',
                isActive: true,
                sortOrder: 3,
                metadata: { portal: 'eshop' }
            },
            {
                type: 'CATEGORY',
                key: 'Enhancement',
                title: 'Appearance & Style',
                iconUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
                isActive: true,
                sortOrder: 4,
                metadata: { portal: 'eshop' }
            }
        ];

        for (const cat of categories) {
            await MasterData.findOneAndUpdate({ key: cat.key, type: 'CATEGORY' }, cat, { upsert: true });
        }
        console.log('Categories seeded');

        // 2. Seed Banners
        const banners = [
            {
                type: 'Banners',
                title: 'FLASH SALE',
                subtitle: 'Flat 10% Off on Premium Kits',
                image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80',
                cta: 'SHOP NOW',
                path: '/e-shop',
                theme: 'light',
                status: 'Active',
                isActive: true,
                metadata: { portal: 'eshop' }
            }
        ];

        for (const banner of banners) {
            await Promotion.findOneAndUpdate({ title: banner.title, type: 'Banners' }, banner, { upsert: true });
        }
        console.log('Banners seeded');

        // 3. Seed Settings
        await Setting.findOneAndUpdate(
            { key: 'eshop_config' },
            {
                key: 'eshop_config',
                value: {
                    newsletter: {
                        title: 'Subscribe to our Newsletter',
                        desc: 'Get weekly deals, valuable health information and more.',
                        link: 'https://newsletter.example.com'
                    },
                    youtube: {
                        title: 'Join Our YouTube Community',
                        desc: 'Watch premium car care tutorials and live sessions.',
                        link: 'https://youtube.com/@clean2wash'
                    },
                    features: [
                        { title: 'Fast Delivery', desc: 'On all orders', icon: 'truck' },
                        { title: 'Quick Refunds', desc: 'In clean2wash points', icon: 'refresh' }
                    ]
                },
                category: 'General'
            },
            { upsert: true }
        );
        console.log('Settings seeded');

        mongoose.connection.close();
        console.log('Seeding complete');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedEShopMetadata();
