const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Service = require('../models/Service');
const Hub = require('../models/Hub');
const PricingEngine = require('../utils/pricingHelper');
const dotenv = require('dotenv');

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Database');

        // 1. Setup Test User
        let user = await User.findOne({ email: 'test_apartment@clean2wash.com' });
        if (!user) {
            user = await User.create({
                name: 'Test Apartment User',
                email: 'test_apartment@clean2wash.com',
                phone: '9999999991',
                role: 'consumer',
                password: 'Password123!',
                isActive: true
            });
        }

        // 2. Setup Society Hub
        let hub = await Hub.findOne({ name: 'Emerald Heights' });
        if (!hub) {
            hub = await Hub.create({
                name: 'Emerald Heights',
                type: 'Hub',
                city: 'Bengaluru',
                manager: 'Society Lead',
                location: {
                    address: '123 Luxury Lane',
                    coordinates: { type: 'Point', coordinates: [77.6543, 12.9234] }
                },
                metadata: { isSociety: true }
            });
        }

        // 3. Setup Apartment Wash Service
        let service = await Service.findOne({ category: 'Doorstep', name: /Apartment/i });
        if (!service) {
            service = await Service.create({
                name: 'Premium Apartment Wash',
                category: 'Doorstep',
                type: 'Premium',
                price: 499,
                time: '45 min',
                isActive: true
            });
        }

        // 4. Setup Subscription Plan & Active Subscription
        const planId = new mongoose.Types.ObjectId();
        let sub = await Subscription.findOne({ user: user._id, status: 'active' });
        if (!sub) {
            sub = await Subscription.create({
                user: user._id,
                planId: planId,
                plan: 'Apartment Monthly Pass',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                monthlyCredits: 4,
                usedCredits: 0,
                applicableServices: ['Apartment Wash'], // Critical for eligibility check
                hub: hub._id,
                price: { amount: 1500 },
                paymentMethod: 'wallet'
            });
        }

        console.log('--- Test Data Setup Complete ---');

        // 5. Test Pricing Engine Compatibility
        const bookingData = {
            servicePrice: 499,
            paymentMethod: 'subscription',
            service: { category: 'Doorstep' },
            hub: hub._id,
            location: { hubId: hub._id }
        };

        const priceResult = await PricingEngine.calculate(bookingData, user);
        console.log('Pricing Result (Should be 0):', priceResult.totalAmount);

        if (priceResult.totalAmount !== 0) {
            throw new Error('Pricing Engine failed to apply subscription credit');
        }

        // 6. Test Credit Deduction
        console.log('Credits before:', sub.getAvailableCredits());
        await sub.useCredits(1);
        const updatedSub = await Subscription.findById(sub._id);
        console.log('Credits after deduction:', updatedSub.getAvailableCredits());

        if (updatedSub.usedCredits !== 1) {
            throw new Error('Credit deduction failed');
        }

        // 7. Verify Data Integrity in Booking
        const parkingDetails = {
            basement: 'B2',
            block: 'Phoenix',
            pillar: 'P-45',
            slotNumber: '102'
        };

        const newBooking = await Booking.create({
            consumer: user._id,
            vehicle: new mongoose.Types.ObjectId(), // Mock vehicle
            service: {
                id: service._id,
                name: service.name,
                category: 'Doorstep',
                type: 'captain',
                basePrice: 499
            },
            pricing: {
                baseAmount: 499,
                totalAmount: 0
            },
            location: {
                type: 'home',
                address: { street: 'Pillar P-45, Emerald Heights' },
                hubId: hub._id,
                parkingDetails: parkingDetails
            },
            payment: {
                method: 'subscription',
                status: 'paid',
                transactionId: `SUB-${sub._id}-${Date.now()}`
            },
            provider: { type: 'captain' }
        });

        console.log('Booking Created with Parking Details:', JSON.stringify(newBooking.location.parkingDetails, null, 2));

        if (newBooking.location.parkingDetails.pillar !== 'P-45' || String(newBooking.location.hubId) !== String(hub._id)) {
            throw new Error('Booking metadata storage failed');
        }

        console.log('--- ALL TESTS PASSED ---');
        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
};

runTest();
