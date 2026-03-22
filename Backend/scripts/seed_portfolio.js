const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI;

async function seed() {
    console.log('SEED_START_TIME:', new Date().toISOString());
    try {
        console.log('Connecting to database...');
        await mongoose.connect(DB);
        console.log('Connected.');

        const user = await User.findOne({ phone: '9999999999' });
        if (!user) {
            console.log('User not found. Please log in once.');
            process.exit(1);
        }

        console.log('User ID:', user._id);

        // 1. Cleanup
        await Vehicle.deleteMany({ owner: user._id });
        await Booking.deleteMany({ consumer: user._id });
        console.log('Cleanup done.');

        // 2. Create Vehicle
        const plate = 'DL' + Math.floor(10 + Math.random() * 80) + 'AA' + Math.floor(1000 + Math.random() * 8000);
        const vehicle = await Vehicle.create({
            owner: user._id,
            brand: 'Hyundai',
            model: 'Creta',
            type: 'SUV',
            color: 'White',
            plate: plate,
            image: 'https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&q=80&w=800'
        });
        console.log('Vehicle created:', vehicle.plate);

        // 3. Create Bookings
        const bookingsData = [
            {
                consumer: user._id,
                vehicle: vehicle._id,
                service: {
                    id: 'doorstep-eco-wash',
                    name: 'Premium Eco Wash',
                    category: 'Doorstep',
                    type: 'captain'
                },
                pricing: { baseAmount: 299, totalAmount: 299 },
                status: 'completed',
                provider: {
                    type: 'captain',
                    name: 'Captain Rahul',
                    rating: 4.8
                },
                payment: { method: 'online', status: 'paid' },
                serviceImages: {
                    before: ['https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800'],
                    after: ['https://images.unsplash.com/photo-1605515298946-d062f2e9da53?auto=format&fit=crop&q=80&w=800'],
                    capturedAt: new Date()
                },
                notes: 'Seeded for Portfolio'
            },
            {
                consumer: user._id,
                vehicle: vehicle._id,
                service: {
                    id: 'full-studio-clean',
                    name: 'Elite Studio Detail',
                    category: 'Studio',
                    type: 'vendor'
                },
                pricing: { baseAmount: 1299, totalAmount: 1299 },
                status: 'completed',
                provider: {
                    type: 'vendor',
                    name: 'Super Shine Studio',
                    rating: 4.9
                },
                payment: { method: 'online', status: 'paid' },
                serviceImages: {
                    before: ['https://images.unsplash.com/photo-1599256621730-535171e28e50?auto=format&fit=crop&q=80&w=800'],
                    after: ['https://images.unsplash.com/photo-1542352227-26a31f137e24?auto=format&fit=crop&q=80&w=800'],
                    capturedAt: new Date(Date.now() - 86400000)
                },
                notes: 'Seeded for Portfolio'
            }
        ];

        await Booking.create(bookingsData);
        console.log('Bookings seeded.');

        console.log('Portfolio seeding complete!');
        process.exit();
    } catch (err) {
        console.error('SEED_ERROR_START');
        console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        console.error('SEED_ERROR_END');
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
