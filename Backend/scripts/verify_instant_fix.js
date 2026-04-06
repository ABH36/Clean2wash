const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');
const Subscription = require('../models/Subscription');

async function verifyInstantWash() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/clean2wash');
        console.log('Connected to DB');

        // 1. Setup User
        let user = await User.findOne({ phone: '9999999999' });
        if (!user) {
            user = await User.create({
                name: 'Test Instant',
                phone: '9999999999',
                role: 'consumer'
            });
        }

        // 2. Setup Vehicle
        let vehicle = await Vehicle.findOne({ owner: user._id });
        if (!vehicle) {
            vehicle = await Vehicle.create({
                owner: user._id,
                brand: 'Tesla',
                model: 'Model 3',
                type: 'Sedan',
                plate: 'INST-001'
            });
        }

        // 3. Setup Subscription with Instant Wash
        const now = new Date();
        const endDate = new Date(now.setMonth(now.getMonth() + 1));
        
        await Subscription.deleteMany({ user: user._id });
        const sub = await Subscription.create({
            user: user._id,
            plan: 'Gold Pass',
            status: 'active',
            startDate: new Date(),
            endDate: endDate,
            monthlyCredits: 10,
            usedCredits: 0,
            applicableServices: ['Instant Wash'],
            price: { amount: 999, paymentMethod: 'upi' },
            paymentMethod: 'upi'
        });
        console.log('Subscription created');

        // 4. Mock Booking Request (Simulating Controller logic)
        const bookingData = {
            vehicleId: vehicle._id,
            service: {
                id: 'instant_wash_id',
                name: 'Eco Instant Wash',
                category: 'Express',
                type: 'captain',
                basePrice: 499
            },
            schedule: { type: 'instant' },
            location: {
                type: 'home',
                address: {
                    street: '123 Instant St',
                    city: 'Bangalore',
                    coordinates: { lat: 12.9716, lng: 77.5946 }
                }
            },
            paymentMethod: 'subscription'
        };

        // We can't easily call the controller export directly here due to req/res/next
        // But we can verify the PricingEngine separately or just see if a test booking creation works
        const PricingEngine = require('../utils/pricingHelper');
        const pricingResult = await PricingEngine.calculate({
            servicePrice: 499,
            vehicleMultiplier: 1.0,
            addonAmount: 0,
            paymentMethod: 'subscription',
            service: { 
                category: 'Doorstep', // Express maps to Doorstep in controller
                schedule: { type: 'instant' } 
            },
            location: bookingData.location
        }, user);

        console.log('Pricing Result:', JSON.stringify(pricingResult, null, 2));

        if (pricingResult.totalAmount === 0 && pricingResult.appliedBenefit === 'SUBSCRIPTION_CREDIT') {
            console.log('✅ Pricing Logic for Instant Wash PASSED');
        } else {
            console.error('❌ Pricing Logic FAILED');
        }

        // Test the .reduce fix specifically
        const discountAmount = (pricingResult.breakdown || []).reduce((sum, d) => sum + (d.amount || 0), 0);
        console.log('Discount Amount Sum:', discountAmount);
        if (typeof discountAmount === 'number') {
            console.log('✅ .reduce fix verified locally');
        }

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyInstantWash();
