const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
require('dotenv').config();

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the seeded vendor
        const vendor = await User.findOne({ email: 'vendor@CarWash.in' });
        if (!vendor) {
            console.error('Vendor not found! Please run seedVendor.js first.');
            process.exit(1);
        }

        const products = [
            {
                name: 'Premium Microfiber Cloth',
                description: 'Ultra-soft microfiber cloth for scratch-free cleaning.',
                price: 299,
                salePrice: 199,
                category: 'Cleaning',
                stock: 100,
                image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
                badge: 'Bestseller',
                status: 'Approved',
                vendor: vendor._id
            },
            {
                name: 'Ceramic Coating Spray',
                description: 'Instant water-repellent and high gloss protection.',
                price: 1299,
                salePrice: 999,
                category: 'Enhancement',
                stock: 50,
                image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80',
                badge: 'Top Rated',
                status: 'Approved',
                vendor: vendor._id
            },
            {
                name: 'Tire Shine Gel',
                description: 'Long-lasting deep black shine for all tire types.',
                price: 499,
                salePrice: 399,
                category: 'Cleaning',
                stock: 80,
                image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&q=80',
                badge: 'Popular',
                status: 'Approved',
                vendor: vendor._id
            },
            {
                name: 'Car Perfume - Musk',
                description: 'Premium fragrance that lasts for 60 days.',
                price: 599,
                salePrice: 449,
                category: 'Accessories',
                stock: 120,
                image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80',
                badge: 'New',
                status: 'Approved',
                vendor: vendor._id
            }
        ];

        // Clear existing products to avoid duplicates during dev
        await Product.deleteMany({ vendor: vendor._id });

        for (const product of products) {
            await Product.create(product);
        }

        console.log('Products seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding products:', err);
        process.exit(1);
    }
};

seedProducts();
