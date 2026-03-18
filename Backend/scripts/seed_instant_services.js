const mongoose = require('mongoose');
const Service = require('../models/Service');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

const instantServices = [
    {
        name: 'Instant Premium Wash',
        category: 'Express',
        type: 'Premium',
        price: 599,
        time: '30m',
        description: 'High-speed professional detailing protocol for premium assets.',
        detailedCoverage: [
            'Exterior Foam Wash',
            'Interior Vacuuming',
            'Tyre Dressing',
            'Dashboard Dressing',
            'Glass Cleaning'
        ],
        isActive: true,
        multiplierEnabled: true
    },
    {
        name: 'Instant Bucket Wash',
        category: 'Express',
        type: 'Standard',
        price: 199,
        time: '20m',
        description: 'Quick bucket wash protocol for daily maintenance.',
        detailedCoverage: [
            'Exterior Wash',
            'Tyre Cleaning',
            'Wipe Down'
        ],
        isActive: true,
        multiplierEnabled: true
    },
    {
        name: 'Instant 360 Wash',
        category: 'Express',
        type: 'Elite',
        price: 899,
        time: '45m',
        description: 'Complete 360-degree deep cleaning and protection protocol.',
        detailedCoverage: [
            'Exterior Foam Wash',
            'Detailed Interior Cleaning',
            'Engine Bay Cleaning',
            'Undercarriage Wash',
            'Ceramic Wax Protection'
        ],
        isActive: true,
        multiplierEnabled: true
    }
];

const seedServices = async () => {
    try {
        await mongoose.connect(DB);
        console.log('DB connection successful.');

        // Deleting existing 'Express' services to avoid duplicates for this demo
        await Service.deleteMany({ category: 'Express' });
        console.log('Old Express services purged.');

        await Service.create(instantServices);
        console.log('Requested Instant services seeded successfully.');

        process.exit();
    } catch (err) {
        if (err.name === 'ValidationError') {
            for (field in err.errors) {
                console.error(`Validation Error on ${field}:`, err.errors[field].message);
            }
        } else {
            console.error('Seeding failed:', err);
        }
        process.exit(1);
    }
};

seedServices();
