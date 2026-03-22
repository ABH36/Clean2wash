const mongoose = require('mongoose');
const Service = require('./models/Service');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

const seedStudioServices = async () => {
    try {
        await mongoose.connect(DB);
        console.log('Connected to DB for seeding Studio Detailing services.');

        // Delete existing Studio Detailing services to avoid duplicates
        await Service.deleteMany({ category: 'Studio Detailing' });

        const studioServices = [
            {
                name: "Studio Deep Clean",
                category: "Studio Detailing",
                type: "Premium",
                price: 1199,
                time: "2h 30m",
                status: "Live",
                description: "Comprehensive multi-stage foam wash, interior deep vacuum, dash conditioning, and exterior polish.",
                color: "bg-indigo-600",
                features: [
                    { icon: 'Sparkles', text: 'Multi-stage foam wash' },
                    { icon: 'Wind', text: 'Interior vacuum & dash conditioning' },
                    { icon: 'Shield', text: 'Basic wax protection' }
                ],
                addons: [
                    { name: 'Engine Bay Detailing', price: 299 },
                    { name: 'AC Vents Sanitization', price: 199 }
                ],
                tag: "Bestseller",
                isActive: true
            },
            {
                name: "Studio Ceramic Pro",
                category: "Studio Detailing",
                type: "Elite",
                price: 4999,
                time: "8h",
                status: "Featured",
                description: "Ultimate ceramic coating protection for lasting shine, scratch resistance, and hydrophobic effect.",
                color: "bg-black",
                features: [
                    { icon: 'Crown', text: '9H Ceramic Coating (1 Layer)' },
                    { icon: 'Droplets', text: 'Extreme hydrophobic effect' },
                    { icon: 'ShieldAlert', text: 'UV & Scratch Protection' }
                ],
                addons: [
                    { name: 'Extra Ceramic Layer', price: 1499 },
                    { name: 'Glass Coating', price: 899 }
                ],
                tag: "Premium",
                isActive: true
            },
            {
                name: "Interior Spa",
                category: "Studio Detailing",
                type: "Standard",
                price: 899,
                time: "1h 45m",
                status: "Live",
                description: "Deep interior cleaning, seats shampooing, odor elimination, and leather conditioning.",
                color: "bg-blue-500",
                features: [
                    { icon: 'Sofa', text: 'Fabric/Leather deep cleaning' },
                    { icon: 'SprayCan', text: 'Odor elimination & perfuming' },
                    { icon: 'Wind', text: 'AC vent cleaning' }
                ],
                addons: [
                    { name: 'Ozone Treatment', price: 399 }
                ],
                tag: "Interior Focus",
                isActive: true
            }
        ];

        await Service.create(studioServices);
        console.log('Studio Detailing services seeded successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedStudioServices();
