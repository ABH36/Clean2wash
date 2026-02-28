const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// Get available services
exports.getServices = async (req, res) => {
    try {
        const { type, category, vehicleType } = req.query;

        // Hardcoded services (matching frontend)
        const hardcodedServices = [
            {
                id: 'eco',
                tag: 'Instant Choice',
                title: 'Doorstep Eco Wash',
                subtitle: 'Captain washes at your location',
                image: '/assets/instantwash/carwash.png',
                price: '₹299',
                original: '₹599',
                duration: '~45 min',
                features: ['Captain arrives in 20m', 'At-home service', 'Eco-friendly', 'No pickup needed'],
                badge: '100% Cashback',
                provider: 'captain',
                isHardcoded: true,
                rating: 4.6,
                reviews: 6780,
                category: 'Doorstep',
                basePrice: 299,
                addons: [
                    { id: 'a1', name: 'Exterior Wash & Tyre Polish', price: 249, included: true },
                    { id: 'a2', name: 'Interior Cleaning', price: 119 },
                    { id: 'a3', name: 'Dashboard Polish', price: 39 },
                    { id: 'a4', name: 'Air Freshener (30 days)', price: 89 },
                    { id: 'a5', name: 'Odour Eliminator', price: 199 },
                ],
                subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 1, label: 'Buy 10 Washes, Get 1 Free' },
            },
            {
                id: 'full-wash',
                tag: 'Clinical Treatment',
                title: 'Full Studio Clean',
                subtitle: 'Vendor pick-up & drop service',
                image: '/assets/studiowash/studio.png',
                price: '₹1,299',
                original: '₹2,499',
                duration: '~3-4 hrs',
                features: ['Pickup from home', 'Professional studio', 'Sanitized delivery', 'Damage insured'],
                badge: 'Premium',
                provider: 'vendor',
                isHardcoded: true,
                rating: 4.4,
                reviews: 3218,
                category: 'Studio',
                basePrice: 1299,
                addons: [
                    { id: 'b1', name: 'Full Exterior Deep Wash', price: 799, included: true },
                    { id: 'b2', name: '360° Interior Cleaning', price: 499, included: true },
                    { id: 'b3', name: 'Engine Bay Cleaning', price: 299 },
                    { id: 'b4', name: 'Paint Protection Film', price: 999 },
                    { id: 'b5', name: 'Ceramic Coating (1 Year)', price: 1499 },
                ],
                subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 2, label: 'Buy 10 Full Washes, Get 2 Free' },
            }
        ];

        // Load admin services from localStorage (mock implementation)
        // In production, this would come from a database
        let adminServices = [];
        try {
            // This would be replaced with actual database query
            adminServices = [];
        } catch (error) {
            adminServices = [];
        }

        let allServices = [...hardcodedServices, ...adminServices];

        // Apply filters
        if (type) {
            allServices = allServices.filter(service => service.provider === type);
        }

        if (category) {
            allServices = allServices.filter(service => service.category === category);
        }

        // Apply vehicle type pricing
        if (vehicleType) {
            const multiplier = Vehicle.getTypeMultiplier(vehicleType);
            allServices = allServices.map(service => ({
                ...service,
                adjustedPrice: Math.round(service.basePrice * multiplier),
                multiplier
            }));
        }

        res.status(200).json({
            status: 'success',
            results: allServices.length,
            data: {
                services: allServices
            }
        });

    } catch (error) {
        console.error('Error in getServices:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get services. Please try again.'
        });
    }
};

// Get service details
exports.getServiceDetails = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { vehicleType } = req.query;

        // Get all services
        const servicesResponse = await exports.getServices({ 
            query: { vehicleType }, 
            consumer: req.consumer 
        });
        const services = servicesResponse.data.services;

        const service = services.find(s => s.id === serviceId);

        if (!service) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                service
            }
        });

    } catch (error) {
        console.error('Error in getServiceDetails:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service details. Please try again.'
        });
    }
};

// Calculate service pricing
exports.calculatePricing = async (req, res) => {
    try {
        const { serviceId, vehicleType, addons } = req.body;

        if (!serviceId || !vehicleType) {
            return res.status(400).json({
                status: 'fail',
                message: 'Service ID and vehicle type are required'
            });
        }

        // Get service details
        const servicesResponse = await exports.getServices({ 
            query: {}, 
            consumer: req.consumer 
        });
        const services = servicesResponse.data.services;

        const service = services.find(s => s.id === serviceId);

        if (!service) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service not found'
            });
        }

        // Calculate pricing
        const multiplier = Vehicle.getTypeMultiplier(vehicleType);
        const baseAmount = service.basePrice;
        const vehicleMultiplier = multiplier;
        
        let addonAmount = 0;
        const selectedAddons = [];

        if (addons && Array.isArray(addons)) {
            addons.forEach(addonId => {
                const addon = service.addons.find(a => a.id === addonId);
                if (addon && !addon.included) {
                    addonAmount += addon.price;
                    selectedAddons.push(addon);
                }
            });
        }

        const totalAmount = Math.round((baseAmount * vehicleMultiplier) + addonAmount);

        res.status(200).json({
            status: 'success',
            data: {
                pricing: {
                    baseAmount,
                    vehicleMultiplier,
                    addonAmount,
                    totalAmount,
                    currency: 'INR',
                    breakdown: {
                        service: baseAmount,
                        vehicleAdjustment: Math.round(baseAmount * (vehicleMultiplier - 1)),
                        addons: addonAmount
                    }
                },
                selectedAddons
            }
        });

    } catch (error) {
        console.error('Error in calculatePricing:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to calculate pricing. Please try again.'
        });
    }
};

// Get available time slots
exports.getTimeSlots = async (req, res) => {
    try {
        const { date, serviceType, serviceId } = req.query;

        if (!date) {
            return res.status(400).json({
                status: 'fail',
                message: 'Date is required'
            });
        }

        // Generate time slots (mock implementation)
        const timeSlots = [
            { id: 1, time: '09:00 AM', available: true },
            { id: 2, time: '11:00 AM', available: true },
            { id: 3, time: '01:00 PM', available: false }, // Example of unavailable slot
            { id: 4, time: '03:00 PM', available: true },
            { id: 5, time: '05:00 PM', available: true },
        ];

        // In production, check actual availability based on existing bookings
        const requestedDate = new Date(date);
        const existingBookings = await Booking.find({
            'schedule.date': requestedDate,
            status: { $in: ['pending', 'confirmed', 'assigned'] }
        });

        // Mark slots as unavailable based on existing bookings
        existingBookings.forEach(booking => {
            if (booking.schedule.timeSlot) {
                const slotIndex = timeSlots.findIndex(slot => 
                    slot.time === booking.schedule.timeSlot.start
                );
                if (slotIndex !== -1) {
                    timeSlots[slotIndex].available = false;
                }
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                date,
                timeSlots: timeSlots.filter(slot => slot.available)
            }
        });

    } catch (error) {
        console.error('Error in getTimeSlots:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get time slots. Please try again.'
        });
    }
};

// Get service categories
exports.getServiceCategories = async (req, res) => {
    try {
        const categories = [
            { id: 'doorstep', name: 'Doorstep', description: 'At your location service', icon: 'zap', provider: 'captain' },
            { id: 'studio', name: 'Studio', description: 'Professional studio service', icon: 'shield', provider: 'vendor' },
            { id: 'addons', name: 'Add-ons', description: 'Additional services', icon: 'plus', provider: 'captain' },
            { id: 'prestige', name: 'Prestige', description: 'Premium services', icon: 'star', provider: 'vendor' }
        ];

        res.status(200).json({
            status: 'success',
            data: {
                categories
            }
        });

    } catch (error) {
        console.error('Error in getServiceCategories:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service categories. Please try again.'
        });
    }
};

// Get subscription plans for services
exports.getServicePlans = async (req, res) => {
    try {
        const { serviceId } = req.params;

        // Mock subscription plans
        const plans = [
            {
                id: 'basic',
                name: 'Basic Wash',
                label: '4 Washes',
                description: 'Perfect for monthly users',
                perWash: 249,
                total: 996,
                savings: 200,
                validity: '90 days',
                features: ['4 Basic Washes', 'Free Rescheduling', '24/7 Support']
            },
            {
                id: 'premium',
                name: 'Premium Care',
                label: '8 Washes',
                description: 'Best value for regular users',
                perWash: 224,
                total: 1792,
                savings: 400,
                validity: '180 days',
                features: ['8 Premium Washes', 'Free Add-ons', 'Priority Service', '24/7 Support']
            },
            {
                id: 'elite',
                name: 'Elite Shine',
                label: '12 Washes',
                description: 'Ultimate car care package',
                perWash: 199,
                total: 2388,
                savings: 600,
                validity: '365 days',
                features: ['12 Elite Washes', 'All Add-ons Free', 'VIP Service', 'Free Pickup & Drop', '24/7 Support']
            }
        ];

        res.status(200).json({
            status: 'success',
            data: {
                plans
            }
        });

    } catch (error) {
        console.error('Error in getServicePlans:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service plans. Please try again.'
        });
    }
};

// Validate service availability
exports.validateServiceAvailability = async (req, res) => {
    try {
        const { serviceId, vehicleType, date, timeSlot, location } = req.body;

        if (!serviceId || !vehicleType || !date) {
            return res.status(400).json({
                status: 'fail',
                message: 'Service ID, vehicle type, and date are required'
            });
        }

        // Check if service exists
        const servicesResponse = await exports.getServices({ 
            query: {}, 
            consumer: req.consumer 
        });
        const services = servicesResponse.data.services;

        const service = services.find(s => s.id === serviceId);

        if (!service) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service not found'
            });
        }

        // Check time slot availability
        let isSlotAvailable = true;
        if (timeSlot) {
            const existingBooking = await Booking.findOne({
                'schedule.date': new Date(date),
                'schedule.timeSlot.start': timeSlot,
                status: { $in: ['pending', 'confirmed', 'assigned'] }
            });

            isSlotAvailable = !existingBooking;
        }

        // Check location serviceability (mock implementation)
        let isLocationServiceable = true;
        if (location && location.coordinates) {
            // In production, check if location is within service area
            isLocationServiceable = true;
        }

        const validation = {
            available: isSlotAvailable && isLocationServiceable,
            serviceAvailable: true,
            slotAvailable: isSlotAvailable,
            locationServiceable: isLocationServiceable,
            message: isSlotAvailable && isLocationServiceable 
                ? 'Service is available' 
                : 'Service not available for selected slot or location'
        };

        res.status(200).json({
            status: 'success',
            data: {
                validation
            }
        });

    } catch (error) {
        console.error('Error in validateServiceAvailability:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to validate service availability. Please try again.'
        });
    }
};
