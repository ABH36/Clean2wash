const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Portfolio = require('../models/Portfolio');

const SEED_PORTFOLIO = [
    {
        category: 'Exterior',
        img: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=600&q=80',
        title: 'Deep Chrome Restoration',
        vehicle: 'Mercedes S-Class',
        likes: 124,
        plateClass: 'bottom-[12%] left-1/2 -translate-x-1/2 w-[22%] h-[12%]',
        sortOrder: 1
    },
    {
        category: 'Ceramic',
        img: 'https://images.unsplash.com/photo-1611455600759-99abfc83e9c4?w=600&q=80',
        title: '9H Graphene Coating',
        vehicle: 'BMW M4',
        likes: 341,
        plateClass: 'bottom-[25%] left-1/2 -translate-x-1/2 w-[18%] h-[8%]',
        sortOrder: 2
    },
    {
        category: 'Interior',
        beforeImg: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80',
        afterImg: 'https://images.unsplash.com/photo-1503376711681-4202e86cc68a?w=600&q=80',
        title: 'Leather Condition & Steam',
        vehicle: 'Audi Q7',
        likes: 89,
        sortOrder: 3
    },
    {
        category: 'Exterior',
        img: 'https://images.unsplash.com/photo-1605164599901-aba17e7c003a?w=600&q=80',
        title: 'Foam Cannon Wash',
        vehicle: 'Porsche 911',
        likes: 412,
        singleImage: true,
        plateClass: 'bottom-[15%] left-1/2 -translate-x-1/2 w-[20%] h-[10%]',
        sortOrder: 4
    },
    {
        category: 'PPF',
        img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
        title: 'Matte PPF Installation',
        vehicle: 'Range Rover Velar',
        likes: 275,
        plateClass: 'bottom-[18%] left-1/2 -translate-x-1/2 w-[16%] h-[8%]',
        sortOrder: 5
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for seeding...');

        // Clear existing portfolio items to avoid duplicates during dev
        await Portfolio.deleteMany({});
        console.log('Cleared existing portfolio items.');

        await Portfolio.insertMany(SEED_PORTFOLIO);
        console.log(`${SEED_PORTFOLIO.length} portfolio items seeded successfully!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
