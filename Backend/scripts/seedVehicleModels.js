const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const VehicleModel = require('../models/VehicleModel');

dotenv.config({ path: path.join(__dirname, '../.env') });

const vehicleModels = [
    // LUXURY & SUPERCAR
    {
        brand: 'BMW',
        model: 'M4 Competition',
        type: 'Coupe',
        image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
        basePrice: 1200,
        sessionTime: 60,
        difficulty: 'Hard',
        detailedCoverage: { exteriorCeramic: true, interiorDeepClean: true, libraryPolish: true, leatherConditioning: true, glassWipe: true, engineBayWash: true }
    },
    {
        brand: 'BMW',
        model: 'X5 M-Sport',
        type: 'Luxury SUV',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
        basePrice: 1500,
        sessionTime: 75,
        difficulty: 'Hard'
    },
    {
        brand: 'Mercedes-Benz',
        model: 'G-Wagon',
        type: 'Luxury SUV',
        image: 'https://images.unsplash.com/photo-1520105789356-3970fd2d5995?w=800&q=80',
        basePrice: 2000,
        sessionTime: 90,
        difficulty: 'Hard'
    },
    {
        brand: 'Mercedes-Benz',
        model: 'S-Class',
        type: 'Luxury Sedan',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
        basePrice: 1800,
        sessionTime: 80,
        difficulty: 'Hard'
    },
    {
        brand: 'Audi',
        model: 'RS6 Avant',
        type: 'Luxury Sedan',
        image: 'https://images.unsplash.com/photo-1606135891398-3563b78297b4?w=800&q=80',
        basePrice: 1600,
        sessionTime: 70,
        difficulty: 'Hard'
    },
    {
        brand: 'Land Rover',
        model: 'Range Rover Autobiography',
        type: 'Luxury SUV',
        image: 'https://images.unsplash.com/photo-1606135891398-3563b78297b4?w=800&q=80', // Replace with better URL
        basePrice: 2500,
        sessionTime: 100,
        difficulty: 'Hard'
    },
    {
        brand: 'Lamborghini',
        model: 'Urus',
        type: 'Supercar',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
        basePrice: 3500,
        sessionTime: 120,
        difficulty: 'Hard'
    },
    {
        brand: 'Porsche',
        model: '911 Carrera',
        type: 'Sports Car',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
        basePrice: 2800,
        sessionTime: 90,
        difficulty: 'Hard'
    },

    // PREMIUM & MID-SIZE
    {
        brand: 'Toyota',
        model: 'Fortuner Legender',
        type: 'SUV',
        image: 'https://images.unsplash.com/photo-1616185873966-23fc26c51801?w=800&q=80',
        basePrice: 800,
        sessionTime: 55,
        difficulty: 'Medium'
    },
    {
        brand: 'Maruti Suzuki',
        model: 'Grand Vitara',
        type: 'Compact SUV',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
        basePrice: 500,
        sessionTime: 45,
        difficulty: 'Medium'
    },
    {
        brand: 'Tata',
        model: 'Safari',
        type: 'SUV',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
        basePrice: 700,
        sessionTime: 60,
        difficulty: 'Medium'
    },
    {
        brand: 'Mahindra',
        model: 'Thar',
        type: 'SUV',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
        basePrice: 600,
        sessionTime: 50,
        difficulty: 'Medium'
    },
    {
        brand: 'Hyundai',
        model: 'Creta',
        type: 'Compact SUV',
        image: 'https://images.unsplash.com/photo-1616185873966-23fc26c51801?w=800&q=80',
        basePrice: 550,
        sessionTime: 45,
        difficulty: 'Medium'
    },
    {
        brand: 'Honda',
        model: 'City',
        type: 'Sedan',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        basePrice: 450,
        sessionTime: 40,
        difficulty: 'Easy'
    },

    // ELECTRIC
    {
        brand: 'Hyundai',
        model: 'Ioniq 5',
        type: 'EV',
        image: 'https://images.unsplash.com/photo-1632733711679-539ea30e729a?w=800&q=80',
        basePrice: 750,
        sessionTime: 50,
        difficulty: 'Medium'
    },
    {
        brand: 'Kia',
        model: 'EV6',
        type: 'EV',
        image: 'https://images.unsplash.com/photo-1632733711679-539ea30e729a?w=800&q=80',
        basePrice: 850,
        sessionTime: 55,
        difficulty: 'Medium'
    },

    // BIKES & SUPERBIKES
    {
        brand: 'Suzuki',
        model: 'Hayabusa',
        type: 'Superbike',
        image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80',
        basePrice: 600,
        sessionTime: 35,
        difficulty: 'Medium'
    },
    {
        brand: 'Harley Davidson',
        model: 'Fat Boy',
        type: 'Cruiser', // Fallback to Superbike if cruiser not in enum
        type: 'Superbike',
        image: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800&q=80',
        basePrice: 700,
        sessionTime: 40,
        difficulty: 'Medium'
    },
    {
        brand: 'Royal Enfield',
        model: 'Classic 350',
        type: 'Bike',
        image: 'https://images.unsplash.com/photo-14449495940867-33d54ed0ec84?w=800&q=80',
        basePrice: 300,
        sessionTime: 30,
        difficulty: 'Easy'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await VehicleModel.deleteMany({});
        console.log('Cleared existing vehicle models');

        await VehicleModel.insertMany(vehicleModels);
        console.log(`Successfully seeded ${vehicleModels.length} vehicle models`);

        process.exit();
    } catch (err) {
        console.error('Error seeding DB:', err);
        process.exit(1);
    }
};

seedDB();
