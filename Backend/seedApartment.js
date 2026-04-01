require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define inline schemas to avoid dependency issues in standalone script
const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'vendor', 'staff', 'consumer'], default: 'consumer' },
    profile: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true }
}, { timestamps: true }));

const Hub = mongoose.model('Hub', new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    location: {
        address: String,
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: [Number]
        }
    },
    type: { type: String, default: 'Studio' },
    manager: String,
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: {
        isSociety: Boolean,
        blocks: [String],
        parkingLevels: [String],
        pillarRange: { min: Number, max: Number }
    }
}, { timestamps: true }));

const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    brand: String,
    model: String,
    plate: { type: String, unique: true },
    type: String,
    color: String
}, { timestamps: true }));

const Subscription = mongoose.model('Subscription', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    hub: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
    plan: { type: String, default: 'monthly' },
    status: { type: String, default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    slot: { type: String, enum: ['morning', 'evening'], default: 'morning' },
    parkingDetails: {
        basement: String,
        block: String,
        pillar: String
    }
}, { timestamps: true }));

async function seed() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const salt = await bcrypt.genSalt(10);
        const commonPassword = await bcrypt.hash('password123', salt);

        // 1. Find or Create Vendor
        let vendor = await User.findOne({ role: 'vendor' });
        if (!vendor) {
            console.log('Creating fresh testing vendor...');
            vendor = await User.create({
                name: 'Elite Society Vendor',
                phone: '9876543210',
                password: commonPassword,
                role: 'vendor',
                profile: { businessName: 'Elite Car Care' }
            });
        }
        console.log(`Using Vendor: ${vendor.name} (${vendor._id})`);

        // 2. Create Society Hub
        const hubName = 'Prestige Lakeside (Test)';
        await Hub.deleteOne({ name: hubName }); // Reset for seed
        const society = await Hub.create({
            name: hubName,
            city: 'Bengaluru',
            location: {
                address: 'Varthur Rd, Whitefield',
                coordinates: { type: 'Point', coordinates: [77.7499, 12.9698] }
            },
            type: 'Hub',
            manager: 'Sandeep (Apt Admin)',
            vendor: vendor._id,
            metadata: {
                isSociety: true,
                blocks: ['Block A', 'Block B', 'Block C'],
                parkingLevels: ['B1', 'B2', 'Ground'],
                pillarRange: { min: 1, max: 200 }
            }
        });
        console.log(`✅ Society Hub created: ${society.name}`);

        // 3. Create Staff (Captain)
        const staffPhone = '8888888888';
        await User.deleteOne({ phone: staffPhone });
        const captain = await User.create({
            name: 'Captain Rohit',
            phone: staffPhone,
            password: commonPassword,
            role: 'staff',
            profile: { 
                hub: society.name,
                skills: ['Interior', 'Exterior', 'Ceramic'],
                status: 'Available'
            }
        });
        console.log(`✅ Staff created: ${captain.name} (Phone: ${staffPhone})`);

        // 4. Create Consumer
        const consumerPhone = '7777777777';
        await User.deleteOne({ phone: consumerPhone });
        const consumer = await User.create({
            name: 'Rohit Sharma',
            phone: consumerPhone,
            password: commonPassword,
            role: 'consumer'
        });
        console.log(`✅ Consumer created: ${consumer.name}`);

        // 5. Create Vehicle
        const plate = 'KA01MH1234';
        await Vehicle.deleteOne({ plate: plate });
        const vehicle = await Vehicle.create({
            owner: consumer._id,
            brand: 'Maruti',
            model: 'Swift',
            plate: plate,
            type: 'Hatchback',
            color: 'Red'
        });
        console.log(`✅ Vehicle created: ${vehicle.plate}`);

        // 6. Create Active Subscription
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year active

        await Subscription.deleteOne({ user: consumer._id, hub: society._id });
        const sub = await Subscription.create({
            user: consumer._id,
            vehicle: vehicle._id,
            hub: society._id,
            plan: 'Pro Apartment Wash',
            status: 'active',
            startDate: new Date(),
            endDate: endDate,
            slot: 'morning',
            parkingDetails: {
                basement: 'B1',
                block: 'Block A',
                pillar: 'P-45'
            }
        });
        console.log(`✅ Active Subscription created for ${consumer.name}`);

        console.log('\n--- SEED COMPLETE ---');
        console.log('Login credentials for testing:');
        console.log('Staff (Captain): 8888888888 / password123');
        console.log('Consumer: 7777777777 / password123');
        console.log('Society: ', hubName);
        console.log('----------------------');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
