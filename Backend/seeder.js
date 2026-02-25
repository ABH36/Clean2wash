const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Service = require('./models/Service');
const Captain = require('./models/Captain');
const Vendor = require('./models/Vendor');
const Booking = require('./models/Booking');
const Consumer = require('./models/Consumer');

dotenv.config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected for Seeding...');

        // Clear existing data
        console.log('Clearing old data...');
        console.log('Product...'); await Product.deleteMany();
        console.log('Service...'); await Service.deleteMany();
        console.log('Captain...'); await Captain.deleteMany();
        console.log('Vendor...'); await Vendor.deleteMany();
        console.log('Booking...'); await Booking.deleteMany();
        console.log('Consumer...'); await Consumer.deleteMany();
        console.log('Old data cleared!');

        // 1. Create Demo Vendor
        const vendor = await Vendor.create({
            name: 'Aryan Vendor',
            email: 'vendor@carwash.in',
            phone: '8888888888',
            password: 'password123',
            studioName: 'Glow Auto Studio',
            city: 'Bangalore',
            idProof: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400&q=80',
            verificationStatus: 'verified',
            subscription: { plan: 'gold', isActive: true }
        });
        console.log('Vendor Seeded!');

        // 2. Create Demo Captain
        console.log('Seeding Captain...');
        const captain = await Captain.create({
            name: 'Rahul Captain',
            phone: '9999999999',
            password: 'password123',
            city: 'Bangalore',
            studio: vendor._id,
            experience: '2+ Years',
            vehicle: { type: 'Two Wheeler', plate: 'KA 01 AB 1234' },
            kit: 'Full Tech Setup',
            status: 'active'
        });
        console.log('Captain Seeded!');

        // 3. Create Demo Consumer
        const consumer = await Consumer.create({
            name: 'John Consumer',
            phone: '7777777777'
        });
        console.log('Consumer Seeded!');

        // 4. Create Demo Service
        const service = await Service.create({
            id: 'full-wash',
            title: 'Full Studio Clean',
            price: '₹1,299',
            provider: 'vendor',
            category: 'Studio'
        });
        console.log('Service Seeded!');

        // 5. Create Demo Booking
        await Booking.create({
            consumer: consumer._id,
            service: service._id,
            vendor: vendor._id,
            vehicle: { brand: 'BMW', model: 'X5', plate: 'KA 01 MG 1234' },
            address: { label: 'Home', address: 'HSR Layout, Bangalore' },
            price: { final: 1299 },
            status: 'pending'
        });
        console.log('Booking Seeded!');

        // 6. Create Products for Vendor
        await Product.create([
            {
                name: 'Premium Microfiber Towels',
                category: 'Accessories',
                price: 599,
                salePrice: 399,
                vendor: vendor._id,
                stock: 100
            },
            {
                name: 'Auto-Glow Carnauba Wax',
                category: 'Cleaning',
                price: 1299,
                salePrice: 899,
                vendor: vendor._id,
                stock: 50
            }
        ]);
        console.log('Products Seeded!');

        console.log('Seeding Complete! Cleaning up...');
        process.exit();
    } catch (err) {
        if (err.name === 'ValidationError') {
            console.error('Validation Error Details:');
            Object.keys(err.errors).forEach((field) => {
                console.error(`${field}: ${err.errors[field].message}`);
            });
        } else {
            console.error('FULL ERROR:', err);
        }
        process.exit(1);
    }
};

seedDB();
