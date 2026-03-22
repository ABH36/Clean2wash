const mongoose = require('mongoose');
const MasterData = require('./models/MasterData');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

mongoose.connect(DB).then(() => console.log('DB connection successful for seeding.'));

const banners = [
    {
        type: 'BANNER',
        key: 'banner-cashback',
        title: '100% CASHBACK',
        description: 'ON YOUR FIRST SERVICE',
        iconUrl: '/assets/carwash/banner_main.png',
        metadata: {
            cta: 'Book Now',
            path: '/instant-wash',
            theme: 'dark'
        },
        isActive: true,
        sortOrder: 1
    },
    {
        type: 'BANNER',
        key: 'banner-monthly',
        title: 'MONTHLY SHINE',
        description: 'EXCLUSIVE DOORSTEP CARE',
        iconUrl: '/assets/carwash/banner_2.png',
        metadata: {
            cta: 'Explore Plans',
            path: '/subscriptions',
            theme: 'light'
        },
        isActive: true,
        sortOrder: 2
    }
];

const services = [
    {
        type: 'SERVICE',
        key: 'doorstep-eco-wash',
        title: 'Doorstep Eco Wash',
        description: 'Captain washes at your location',
        price: 299,
        comparePrice: 599,
        estimatedTime: 45,
        iconUrl: '/assets/instantwash/carwash.png',
        metadata: {
            id: 'eco',
            tag: 'Instant Choice',
            features: ['Captain arrives in 20m', 'At-home service', 'Eco-friendly', 'No pickup needed'],
            badge: '100% Cashback',
            provider: 'captain',
            rating: 4.6,
            reviews: 6780,
            category: 'Doorstep',
            basePrice: 299,
            addons: [
                { id: 'a1', name: 'Exterior Wash & Tyre Polish', price: 249, included: true },
                { id: 'a2', name: 'Interior Cleaning', price: 119 },
                { id: 'a3', name: 'Dashboard Polish', price: 39 },
                { id: 'a4', name: 'Air Freshener (30 days)', price: 89 },
                { id: 'a5', name: 'Odour Eliminator', price: 199 },
            ],
            subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 1, label: 'Buy 10 Washes, Get 1 Free' },
        },
        isActive: true,
        sortOrder: 1
    },
    {
        type: 'SERVICE',
        key: 'full-studio-clean',
        title: 'Full Studio Clean',
        description: 'Vendor pick-up & drop service',
        price: 1299,
        comparePrice: 2499,
        estimatedTime: 240, // 4 hours in minutes
        iconUrl: '/assets/studiowash/studio.png',
        metadata: {
            id: 'full-wash',
            tag: 'Clinical Treatment',
            features: ['Pickup from home', 'Professional studio', 'Sanitized delivery', 'Damage insured'],
            badge: 'Premium',
            provider: 'vendor',
            rating: 4.4,
            reviews: 3218,
            category: 'Studio',
            basePrice: 1299,
            addons: [
                { id: 'b1', name: 'Full Exterior Deep Wash', price: 799, included: true },
                { id: 'b2', name: '360° Interior Cleaning', price: 499, included: true },
                { id: 'b3', name: 'Engine Bay Cleaning', price: 299 },
                { id: 'b4', name: 'Paint Protection Film', price: 999 },
                { id: 'b5', name: 'Ceramic Coating (1 Year)', price: 1499 },
            ],
            subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 2, label: 'Buy 10 Full Washes, Get 2 Free' },
        },
        isActive: true,
        sortOrder: 2
    }
];

const categories = [
    { type: 'CATEGORY', key: 'cat-instant', title: 'Instant Wash', description: 'Uber-style on-demand wash', iconUrl: 'car', metadata: { provider: 'captain', path: '/instant-wash', color: '#F29F05' }, sortOrder: 1 },
    { type: 'CATEGORY', key: 'cat-studio', title: 'Studio Wash', description: 'Professional detailing center', iconUrl: 'home', metadata: { provider: 'vendor', path: '/full-wash-booking', color: '#6366F1' }, sortOrder: 2 },
    { type: 'CATEGORY', key: 'cat-apartments', title: 'Apartments', description: 'Cluster subscription plans', iconUrl: 'building', metadata: { provider: 'captain', path: '/apartments', color: '#6366F1' }, sortOrder: 3 },
    { type: 'CATEGORY', key: 'cat-spare-driver', title: 'Spare Drivers', description: 'Hire professional captains', iconUrl: 'user', metadata: { provider: 'captain', path: '/spare-driver', color: '#FF8533' }, sortOrder: 4 },
    { type: 'CATEGORY', key: 'cat-eshop', title: 'E-Shop', description: 'Premium car care products', iconUrl: 'shopping-bag', metadata: { provider: 'admin', path: '/e-shop', color: '#10B981' }, sortOrder: 5 },
    { type: 'CATEGORY', key: 'cat-sos', title: 'SOS', description: 'Emergency response protocol', iconUrl: 'alert-triangle', metadata: { provider: 'admin', action: 'triggerSOS', color: '#EF4444' }, sortOrder: 6 }
];

const config = [
    { type: 'CONFIG', key: 'stat-users', title: 'Users', metadata: { value: '1 Lac+' }, description: 'Active monthly users', sortOrder: 1 },
    { type: 'CONFIG', key: 'stat-legacy', title: 'Legacy', metadata: { value: '5 Yrs+' }, description: 'Years of excellence', sortOrder: 2 },
    { type: 'CONFIG', key: 'stat-cities', title: 'Cities', metadata: { value: '60+' }, description: 'Operating across India', sortOrder: 3 }
];

const seedDB = async () => {
    try {
        const Promotion = require('./models/Promotion');

        // Clean up
        await MasterData.deleteMany({});
        await Promotion.deleteMany({ type: { $in: ['Referrals', 'Offers', 'Banners'] } });
        console.log('Cleanup complete');

        // Seed MasterData
        await MasterData.create([...services, ...banners, ...categories, ...config]);
        console.log('MasterData seeded');

        // Seed Promotions (for Home Page cards)
        const promotions = [
            {
                type: 'Referrals',
                name: 'Refer & Earn',
                title: 'Refer & Get 100% Cashback',
                subtitle: 'Invite your friends and earn rewards',
                userGets: '₹100',
                friendGets: '₹100',
                image: '/assets/carwash/6.png',
                cta: 'Invite Now',
                path: '/refer',
                theme: 'dark',
                status: 'Active'
            },
            {
                type: 'Offers',
                name: 'Monthly Shine',
                title: 'MONTHLY SHINE',
                subtitle: 'Elite Doorstep Care from ₹299',
                val: 'Best Seller',
                image: '/assets/carwashsubscription/7.png',
                cta: 'View Plans',
                path: '/subscriptions',
                theme: 'light',
                status: 'Active'
            }
        ];
        await Promotion.create(promotions);
        console.log('Promotions seeded');

        process.exit();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

seedDB();
