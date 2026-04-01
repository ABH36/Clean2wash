const mongoose = require('mongoose');
const Booking = require('../../../models/Booking');
const Vehicle = require('../../../models/Vehicle');
const User = require('../../../models/User');
const Captain = require('../../../models/Captain');
const { sendNotification, sendVendorNotification } = require('../../../utils/notificationService');
const socketService = require('../../../socketService');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const PricingEngine = require('../../../utils/pricingHelper');

/**
 * Elite Hardening: Clean up bookings that stayed 'pending' for too long
 * without finding a captain. Prevents zombie search loops.
 */
let lastCleanupRun = 0;
const cleanupExpiredBookings = async () => {
    try {
        const now = Date.now();
        // ⚡ Elite Throttling: Only run cleanup at most once every 5 minutes
        if (now - lastCleanupRun < 5 * 60 * 1000) return;
        lastCleanupRun = now;

        const standardTimeout = 5 * 60 * 1000; // 5 Minutes for finding
        const eliteStagnantTimeout = 30 * 60 * 1000; // 30 Minutes for assigned but idle

        // 1. Clean up 'pending' bookings (Finding phase)
        const expiredPending = await Booking.find({
            status: 'pending',
            isActive: true,
            createdAt: { $lt: new Date(now - standardTimeout) }
        });

        // 2. Clean up Elite 'pickup-assigned' stagnant bookings (Operational Resilience)
        const stagnantElite = await Booking.find({
            status: 'pickup-assigned',
            isActive: true,
            'service.type': 'vendor', // Specific to Studio Wash
            updatedAt: { $lt: new Date(now - eliteStagnantTimeout) }
        });

        const allExpired = [...expiredPending, ...stagnantElite];

        for (const booking of allExpired) {
            const isStagnant = booking.status === 'pickup-assigned';
            booking.status = 'cancelled';
            booking.notes.internal = isStagnant
                ? 'Auto-cancelled: Protocol Stall (Staff idle for >30min).'
                : 'Auto-cancelled: Search protocol timeout (No crew found).';

            // Handle Refunds
            if (booking.payment.status === 'paid') {
                if (booking.payment.method === 'wallet') {
                    const walletController = require('./walletController');
                    try {
                        await walletController.addMoney(
                            booking.consumer,
                            booking.pricing.totalAmount,
                            'REFUND',
                            `Refund for auto-cancelled booking ${booking.bookingId || booking._id}`,
                            `REF-AUTO-${Date.now()}`
                        );
                        booking.payment.status = 'refunded';
                        booking.payment.refundAmount = booking.pricing.totalAmount;
                        booking.payment.refundedAt = new Date();
                    } catch (err) { console.error('Refund failed:', err); }
                } else {
                    booking.status = 'cancelled';
                    booking.payment.status = 'refund_pending';
                }
            }
            await booking.save();

            // Notify user
            await sendNotification(booking.consumer, {
                title: isStagnant ? 'Pickup Cancelled ⚠️' : 'Search Timed Out ⏱️',
                message: isStagnant
                    ? 'Our crew was unable to reach you in time. Your booking has been cancelled and refund initiated.'
                    : 'We couldn\'t find available crew in your area. Your booking has been cancelled and refund initiated.',
                type: 'booking',
                priority: 'high'
            });
        }

        if (allExpired.length > 0) {
            console.log(`[Elite Resilience] Auto-processed ${allExpired.length} stagnant bookings.`);
        }
    } catch (err) {
        console.error('Cleanup error:', err);
    }
};

// Get all bookings for a consumer
exports.getMyBookings = catchAsync(async (req, res, next) => {
    // Trigger elite cleanup task (server-side robustness)
    await cleanupExpiredBookings();

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
        consumer: req.user.id,
        isActive: true
    };

    if (status) {
        filter.status = status;
    }

    const bookings = await Booking.find(filter)
        .populate('vehicle', 'brand model type plate image')
        .populate('provider.id', 'name phone rating photo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            bookings
        }
    });
});

// Get single booking
exports.getBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        isActive: true
    })
        .populate('vehicle', 'brand model type plate image compliance')
        .populate('provider.id', 'name phone rating photo')
        .populate('consumer', 'name phone');

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            booking
        }
    });
});

// Create new booking
// Create new booking
exports.createBooking = catchAsync(async (req, res, next) => {
    const {
        vehicleId,
        vehicle: vehicleObj,
        service,
        addons,
        schedule,
        location,
        address,
        paymentMethod = 'online',
        paymentId,
        orderId,
        couponCode,
        hubId,
        parkingDetails,
        destination 
    } = req.body;

    // 🛡️ Phase 2 Hardening: Debt Guard (Arrears Protocol)
    if (req.user.wallet?.balance < -100) {
        return next(new AppError(`Access Denied! You have an outstanding arrears of ₹${Math.abs(req.user.wallet.balance)}. Please recharge your wallet to clear the debt before booking again.`, 403));
    }

    // Extract effective vehicleId and cast to ObjectId for robust querying
    let effectiveVehicleId = vehicleId || (vehicleObj && (vehicleObj._id || vehicleObj.id));

    // Validate required fields
    if (!effectiveVehicleId || !service) {
        return next(new AppError('Please provide vehicle and service details', 400));
    }

    // Ensure it's a valid ObjectId
    try {
        effectiveVehicleId = new mongoose.Types.ObjectId(effectiveVehicleId);
    } catch (err) {
        return next(new AppError('Invalid vehicle ID format', 400));
    }

    // Check if vehicle belongs to consumer
    const vehicle = await Vehicle.findOne({
        _id: effectiveVehicleId,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found or does not belong to you', 404));
    }

    // 1. Prevent overlapping active bookings for the same vehicle
    // Refined: Only block if the vehicle is CURRENTLY in a session, or has a booking scheduled for TODAY.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const isIncomingChauffeur = service.category === 'Chauffeur' || service.type === 'sparedriver' || (service.name && service.name.toLowerCase().includes('driver'));

    const searchFilter = {
        consumer: req.user.id, // 🛡️ Triple Guard: Scoped to User
        vehicle: effectiveVehicleId, // 🛡️ Triple Guard: Scoped to specific Vehicle
        status: { $in: ['pending', 'confirmed', 'assigned', 'en_route', 'in_progress', 'arrived', 'washing'] },
        isActive: true,
        $or: [
            { 'schedule.type': 'instant' },
            { 
                'schedule.type': 'scheduled',
                'schedule.date': { $gte: todayStart, $lte: todayEnd }
            },
            { 'status': { $in: ['assigned', 'en_route', 'arrived', 'washing', 'in_progress'] } } 
        ]
    };

    // 🕊️ Multi-Protocol Tolerance: Do not block if the existing booking is of a DIFFERENT category 
    // (e.g., a Driver booking should not be blocked by a Wash booking)
    if (isIncomingChauffeur) {
        searchFilter['service.type'] = { $ne: 'captain' }; // Don't block if existing is a standard wash
        searchFilter['service.category'] = { $nin: ['Doorstep', 'Apartment', 'Cleaning'] };
    } else {
        // If incoming is a Wash, don't block based on existing Spare Driver bookings
        searchFilter['service.type'] = { $ne: 'sparedriver' };
        searchFilter['service.category'] = { $ne: 'Chauffeur' };
    }

    const activeBooking = await Booking.findOne(searchFilter);

    // 🕊️ Phase 6 Hardening: Instant vs Upcoming Scheduled Collision Guard 🕊️
    if (schedule?.type === 'instant') {
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const upcomingScheduled = await Booking.findOne({
            consumer: req.user.id,
            vehicle: effectiveVehicleId,
            status: { $in: ['confirmed', 'assigned', 'pending'] },
            'schedule.type': 'scheduled',
            'schedule.date': { $gte: new Date(), $lte: twoHoursFromNow },
            isActive: true
        });

        if (upcomingScheduled) {
            const upTime = upcomingScheduled.schedule?.timeSlot?.start || 'soon';
            return next(new AppError(`Conflict detected! You have a scheduled booking for this car at ${upTime}. An instant wash now would cause a delay. Please cancel the upcoming booking first or wait.`, 400));
        }
    }

    if (activeBooking) {
        // 💎 Phase 5 Hardening: Timeslot Overlap Logic 💎
        // If both are scheduled, check if they are at DIFFERENT TIIMES
        if (activeBooking.schedule?.type === 'scheduled' && schedule?.type === 'scheduled') {
            const existingTime = activeBooking.schedule?.timeSlot?.start;
            const incomingTime = schedule?.timeSlot?.start; // Input from req.body

            if (existingTime && incomingTime && existingTime !== incomingTime) {
                // Determine a safety buffer (e.g., 2 hours)
                const toMinutes = (t) => {
                    const [h, m] = t.split(':').map(Number);
                    return h * 60 + m;
                };
                const diff = Math.abs(toMinutes(existingTime) - toMinutes(incomingTime));
                
                // If the gap is > 120 minutes, we allow it! 🕊️
                if (diff < 120) {
                    return next(new AppError(`Vehicle busy during this slot. Existing booking at ${existingTime}. Please choose a slot at least 2 hours apart.`, 400));
                }
                // Else diff >= 120, we fall through and allow the booking
            } else {
                const msg = `This vehicle already has a booking scheduled for today (${new Date(activeBooking.schedule.date).toLocaleDateString()}) at ${existingTime || 'this time'}. Please complete or cancel it first.`;
                return next(new AppError(msg, 400));
            }
        } else {
            // One of them is instant or already in progress
            const isScheduled = activeBooking.schedule?.type === 'scheduled';
            const msg = isScheduled 
                ? `This vehicle already has a booking scheduled for today (${new Date(activeBooking.schedule.date).toLocaleDateString()}). Please complete or cancel it first.`
                : 'An ongoing booking already exists for this vehicle. Please complete it first.';
            return next(new AppError(msg, 400));
        }
    }

    // 2. Idempotency Check: If paymentId provided, check for existing booking
    if (paymentId) {
        const existingBooking = await Booking.findOne({ 'payment.transactionId': paymentId });
        if (existingBooking) {
            return res.status(200).json({
                status: 'success',
                message: 'Booking already exists',
                data: { booking: existingBooking }
            });
        }
    }

    // Get vehicle type multiplier
    const vehicleMultiplier = Vehicle.getTypeMultiplier(vehicle.type);

    // Calculate base pricing
    const baseAmount = parseInt(service.basePrice || String(service.price).replace(/[^\d]/g, '') || 299);
    const addonAmount = Array.isArray(addons) ? addons.reduce((sum, addon) => {
        if (typeof addon === 'string') return sum; 
        return sum + (addon.included ? 0 : (addon.price || 0));
    }, 0) : 0;

    // Resolve Location
    const bookingLocation = location || (address ? {
        type: address.label?.toLowerCase() || 'home',
        address: {
            street: address.street,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            coordinates: address.coordinates
        },
        landmark: address.landmark
    } : {
        type: 'home',
        address: req.user.profile?.address
    });
    
    // Resolve Destination (New for Point-to-Point)
    const bookingDestination = destination ? {
        street: destination.street,
        city: destination.city,
        state: destination.state,
        pincode: destination.pincode,
        coordinates: destination.coordinates
    } : null;

    // Link Hub and Parking Details if provided
    if (bookingLocation) {
        if (hubId) bookingLocation.hubId = hubId;
        if (parkingDetails) bookingLocation.parkingDetails = parkingDetails;
    }

    // Sanitization & Mapping
    const validCategories = ['Doorstep', 'Studio', 'Studio Detailing', 'Add-ons', 'Prestige', 'Chauffeur', 'Apartment'];
    const validServiceTypes = ['captain', 'vendor', 'sparedriver'];
    const validPaymentMethods = ['cash', 'online', 'wallet', 'subscription'];
    const validLocationTypes = ['home', 'office', 'other', 'studio', 'Apartment'];

    const sanitizedCategory = validCategories.includes(service.category) ? service.category :
        (service.category === 'Express' ? 'Doorstep' : 'Doorstep');

    let sanitizedServiceType = validServiceTypes.includes(service.type?.toLowerCase()) ? service.type.toLowerCase() : 'captain';
    const sanitizedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'online';

    // Elite Hardening: Apartment Hub Protocol routing
    // If a hubId is provided (or implied via location), the service MUST be routed to the Vendor/Staff
    // even if the base service normally defaults to Captain (e.g., Express at an Apartment).
    if (hubId || (bookingLocation && bookingLocation.hubId)) {
        sanitizedServiceType = 'vendor';
    }

    if (bookingLocation && !validLocationTypes.includes(bookingLocation.type)) {
        bookingLocation.type = bookingLocation.type === 'work' ? 'office' : 'home';
    }

    // Coordinates requirement check
    if (sanitizedCategory === 'Doorstep' && (!bookingLocation.address?.coordinates || !bookingLocation.address?.coordinates?.lat)) {
        throw new AppError('Precise GPS coordinates are required for doorstep service. Please select a pinned location.', 400);
    }
    
    if (sanitizedCategory === 'Chauffeur' && bookingDestination && (!bookingDestination.coordinates || !bookingDestination.coordinates.lat)) {
        throw new AppError('Destination GPS coordinates are required for Point-to-Point service.', 400);
    }

    // Prepare schedule
    const bookingSchedule = {
        type: schedule?.type || (req.body.scheduledTime ? 'scheduled' : 'instant'),
        date: schedule?.date ? new Date(schedule.date) : (req.body.scheduledTime ? new Date(req.body.scheduledTime) : new Date()),
        timeSlot: schedule?.timeSlot || req.body.timeSlot || null,
        estimatedDuration: service.duration || '40 min'
    };

    // 3. Centralized Pricing Engine (Industrial Eligibility Aware)
    const pricingResult = await PricingEngine.calculate({
        servicePrice: baseAmount,
        vehicleMultiplier,
        addonAmount,
        couponCode,
        paymentMethod: sanitizedPaymentMethod,
        isCombo: Array.isArray(addons) && addons.filter(a => !a.included).length > 0,
        service: { 
            category: sanitizedCategory, 
            schedule: bookingSchedule 
        },
        hub: hubId || req.body.hub || null,
        location: bookingLocation
    }, req.user);

    const { totalAmount, discounts, appliedBenefit, breakdown } = pricingResult;

    // Resolve coupon record
    let appliedCouponRecord = null;
    if (couponCode) {
        const Promotion = require('../../../models/Promotion');
        const promo = await Promotion.findOne({ code: couponCode, isActive: true });
        if (promo) {
            appliedCouponRecord = {
                id: promo._id,
                code: promo.code,
                val: promo.val,
                valUnit: promo.valUnit || 'FLAT'
            };
        }
    }

    // --- ATOMIC SESSION START ---
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let paymentStatus = 'pending';
        let transactionId = paymentId || orderId;

        // Wallet Flow
        if (sanitizedPaymentMethod === 'wallet') {
            const walletHelper = require('../../../utils/walletHelper');
            const transaction = await walletHelper.executeWalletTransaction(
                req.user.id,
                totalAmount,
                'debit',
                {
                    category: 'BOOKING',
                    description: `Payment for ${service.name || service.title} booking`,
                    referenceId: `TXN-WALL-${Date.now()}`,
                    paymentMethod: 'wallet'
                },
                session
            );
            transactionId = transaction.transaction.referenceId;
            paymentStatus = 'paid';
        } else if (sanitizedPaymentMethod === 'subscription') {
            const Subscription = require('../../../models/Subscription');
            const activeSub = await Subscription.getActiveSubscription(req.user.id);
            if (!activeSub) throw new AppError('No active subscription found.', 404);

            // eligibility audit
            if (!activeSub.isServiceEligible({ 
                service: { category: sanitizedCategory, schedule: bookingSchedule }, 
                hub: req.body.hubId || req.body.hub || null, 
                location: bookingLocation,
                destination: bookingDestination
            })) {
                throw new AppError('Service not covered by your subscription plan.', 400);
            }

            if (activeSub.getAvailableCredits() <= 0) throw new AppError('Insufficient subscription credits.', 400);

            await activeSub.useCredits(1, session);
            paymentStatus = 'paid';
            transactionId = `SUB-${activeSub._id}-${Date.now()}`;
        } else if (sanitizedPaymentMethod === 'online' && transactionId) {
            paymentStatus = 'paid';
        }

        // Create booking
        const [newBooking] = await Booking.create([{
            consumer: req.user.id,
            vehicle: effectiveVehicleId,
            service: {
                id: service.id || 'service_' + Date.now(),
                name: service.name || service.title,
                category: sanitizedCategory,
                type: sanitizedServiceType,
                duration: service.duration || '40 min',
                basePrice: baseAmount,
                features: service.features || []
            },
            pricing: {
                baseAmount,
                vehicleMultiplier,
                addonAmount,
                discountAmount: (breakdown || []).reduce((sum, d) => sum + (d.amount || 0), 0),
                totalAmount,
                initialPaidAmount: totalAmount, // 💎 Arrears Protocol Reference 💎
                breakdown: breakdown || []
            },
            addons: Array.isArray(addons) ? addons.map(a => typeof a === 'string' ? { id: a } : a) : [],
            schedule: bookingSchedule,
            location: {
                ...bookingLocation,
                destination: bookingDestination
            },
            payment: {
                method: sanitizedPaymentMethod,
                status: paymentStatus,
                transactionId: transactionId,
                coupon: appliedCouponRecord
            },
            provider: {
                type: sanitizedServiceType,
                id: null
            },
            status: 'pending'
        }], { session });

        // Audit Log
        const auditHelper = require('../../../utils/auditHelper');
        await auditHelper.logAction({
            userId: req.user.id,
            action: 'BOOKING_CREATED',
            resource: 'Booking',
            resourceId: newBooking._id,
            newValue: { status: 'pending', totalAmount },
            req
        }, session);

        if (appliedCouponRecord?.id) {
            await User.findByIdAndUpdate(req.user.id, {
                $addToSet: { usedPromotions: appliedCouponRecord.id }
            }, { session });
        }

        await session.commitTransaction();

        // Broadcasts (Outside transaction)
        try {
            const populatedBooking = await Booking.findById(newBooking._id)
                .populate('vehicle', 'brand model type plate image')
                .populate('consumer', 'name phone');

            await sendNotification(req.user.id, {
                title: 'Order Received! 🚀',
                message: `Your booking for ${service.name || service.title} has been placed successfully.`,
                type: 'booking',
                priority: 'medium',
            });

            // ➕ Phase 3: Global Admin Parity
            const io = socketService.getIO();
            io.to('admin_room').emit('global_status_update', {
                type: 'new_booking',
                bookingId: newBooking._id,
                userName: req.user.name,
                serviceName: service.name || service.title,
                totalAmount
            });

            if (sanitizedServiceType === 'captain') {
                const broadcastPayload = {
                    bookingId: newBooking._id,
                    serviceName: service.name || service.title,
                    location: bookingLocation,
                    vehicle: { brand: vehicle.brand, model: vehicle.model, plate: vehicle.plate },
                    pricing: { total: totalAmount },
                    timestamp: new Date()
                };

                if (bookingLocation.address?.coordinates?.lat) {
                    const nearbyCaptains = await Captain.find({
                        isOnline: true, isActive: true, isVerified: true,
                        location: {
                            $nearSphere: {
                                $geometry: { type: 'Point', coordinates: [parseFloat(bookingLocation.address.coordinates.lng), parseFloat(bookingLocation.address.coordinates.lat)] },
                                $maxDistance: 5000 
                            }
                        }
                    });
                    nearbyCaptains.forEach(c => io.to(c._id.toString()).emit('new_booking_broadcast', broadcastPayload));
                } else {
                    io.emit('new_booking_broadcast', broadcastPayload);
                }
            } else if (sanitizedServiceType === 'sparedriver') {
                const SpareDriver = require('../../../models/SpareDriver');
                const broadcastPayload = {
                    bookingId: newBooking._id,
                    serviceName: service.name || service.title,
                    location: bookingLocation,
                    vehicle: { brand: vehicle.brand, model: vehicle.model, plate: vehicle.plate },
                    pricing: { total: totalAmount },
                    timestamp: new Date()
                };

                if (bookingLocation.address?.coordinates?.lat) {
                    const nearbyDrivers = await SpareDriver.find({
                        isOnline: true, status: 'active',
                        currentLocation: {
                            $nearSphere: {
                                $geometry: { type: 'Point', coordinates: [parseFloat(bookingLocation.address.coordinates.lng), parseFloat(bookingLocation.address.coordinates.lat)] },
                                $maxDistance: 7000 // Slightly wider range for drivers
                            }
                        }
                    });
                    nearbyDrivers.forEach(d => io.to(d._id.toString()).emit('new_booking_broadcast', broadcastPayload));
                } else {
                    io.emit('new_booking_broadcast', broadcastPayload);
                }
            } else if (sanitizedServiceType === 'vendor') {
                // If a specific hub was assigned, notify that vendor primarily
                const targetVendorId = bookingLocation?.hubId ? (await mongoose.model('Hub').findById(bookingLocation.hubId))?.vendor : null;
                
                if (targetVendorId) {
                    await sendVendorNotification(targetVendorId, { 
                        title: 'New Studio Lead! 💎', 
                        message: `New booking for ${service.name || 'Studio service'} at your Hub.`, 
                        type: 'order-assigned', 
                        metaData: { bookingId: newBooking._id } 
                    });
                    io.to(targetVendorId.toString()).emit('new_studio_booking', { bookingId: newBooking._id });
                } else {
                    const vendors = await User.find({ role: 'vendor', isActive: true });
                    for (const v of vendors) {
                        await sendVendorNotification(v._id, { 
                            title: 'New Studio Lead! 💎', 
                            message: 'New studio booking available in your hub.', 
                            type: 'order-assigned', 
                            metaData: { bookingId: newBooking._id } 
                        });
                    }
                    io.emit('new_studio_booking', { bookingId: newBooking._id });
                }
            } else if (sanitizedServiceType === 'sparedriver') {
                // Elite Protocol: Broadcast to nearby Spare Drivers
                const broadcastPayload = {
                    bookingId: newBooking._id,
                    serviceName: service.name || 'Spare Driver service',
                    location: bookingLocation,
                    vehicle: { brand: vehicle.brand, model: vehicle.model, plate: vehicle.plate },
                    pricing: { total: totalAmount },
                    timestamp: new Date()
                };

                if (bookingLocation.address?.coordinates?.lat) {
                    const nearbyDrivers = await mongoose.model('SpareDriver').find({
                        isOnline: true, status: 'active',
                        currentLocation: {
                            $nearSphere: {
                                $geometry: { type: 'Point', coordinates: [parseFloat(bookingLocation.address.coordinates.lng), parseFloat(bookingLocation.address.coordinates.lat)] },
                                $maxDistance: 10000 // 10km for drivers
                            }
                        }
                    });
                    nearbyDrivers.forEach(d => io.to(d._id.toString()).emit('new_booking_broadcast', broadcastPayload));
                } else {
                    io.emit('new_booking_broadcast', broadcastPayload);
                }
            }

            return res.status(201).json({ status: 'success', message: 'Booking created successfully', data: { booking: populatedBooking } });

        } catch (sideErr) {
            console.error('Post-transaction side-effects error:', sideErr);
            return res.status(201).json({ status: 'success', message: 'Booking created, notifications may delay.', data: { bookingId: newBooking._id } });
        }

    } catch (error) {
        await session.abortTransaction();
        console.error('Booking Transaction Aborted:', error);
        return next(error);
    } finally {
        session.endSession();
    }
});

// Update booking
exports.updateBooking = catchAsync(async (req, res, next) => {
    const { status, schedule, location, addons } = req.body;

    const booking = await Booking.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        isActive: true
    }).populate('consumer', 'name phone');

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    // Special handling for 'skipped' status (Subscription/Apartment Wash feature)
    if (status === 'skipped') {
        const isApartment = booking.service?.category === 'Doorstep' || 
                           booking.service?.name?.toLowerCase().includes('apartment') ||
                           booking.serviceName?.toLowerCase().includes('apartment');
        
        if (!isApartment) {
            return next(new AppError('Only subscription-based apartment washes can be skipped.', 400));
        }

        // Allow skipping if not already in progress
        const diableSkipStatuses = ['washing', 'before_photo', 'after_photo', 'completed', 'cancelled'];
        if (diableSkipStatuses.includes(booking.status)) {
            return next(new AppError('Cannot skip wash while it is already in progress or finalized.', 400));
        }

        const oldStatus = booking.status;
        const providerId = booking.provider?.id;

        booking.status = 'skipped';
        booking.notes = booking.notes || {};
        booking.notes.internal = `User skipped this wash on ${new Date().toLocaleDateString()}`;
        await booking.save();

        // Handle Financial Reversion (Refund for Skip)
        if (booking.payment.status === 'paid') {
            try {
                if (booking.payment.method === 'wallet') {
                    const walletHelper = require('../../../utils/walletHelper');
                    await walletHelper.executeWalletTransaction(
                        booking.consumer._id,
                        booking.pricing.totalAmount,
                        'credit',
                        {
                            category: 'REFUND',
                            description: `Refund: Skipped Apartment Wash (#${booking.bookingId || booking._id})`,
                            referenceId: booking._id,
                            referenceType: 'booking'
                        }
                    );
                    booking.payment.status = 'refunded';
                } else if (booking.payment.method === 'subscription') {
                    const Subscription = require('../../../models/Subscription');
                    const activeSub = await Subscription.getActiveSubscription(booking.consumer._id);
                    if (activeSub) {
                        await activeSub.addCredits(1); // Return the wash credit
                    }
                    booking.payment.status = 'refunded';
                }
                await booking.save();
            } catch (refundErr) {
                console.error('Skip Refund Error:', refundErr);
            }
        }

        // Notify assigned provider and synchronize ecosystem via Socket.io
        try {
            const io = socketService.getIO();
            
            // 1. Specific Booking Room Sync (for everyone tracking this booking)
            io.to(booking._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: 'skipped',
                message: 'The user has skipped today\'s wash request.'
            });

            // 2. Provider/Captain Sync
            if (providerId) {
                io.to(providerId.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: 'skipped',
                    message: 'The user has skipped today\'s wash request.'
                });
                
                // Also notify via FCM
                await sendNotification(providerId, {
                    title: 'Wash Skipped ⏭️',
                    message: `Booking #${booking.bookingId || booking._id} was skipped by the user.`,
                    type: 'booking_update',
                    priority: 'high',
                    metaData: { bookingId: booking._id, status: 'skipped' }
                });
            }

            // 3. Vendor Sync (If Apartment Wash)
            const vendorId = booking.location?.hubId?.vendor;
            if (vendorId) {
                io.to(vendorId.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: 'skipped',
                    message: `User ${booking.consumer?.name} skipped their wash.`
                });
            }

            // 4. Admin Sync
            io.to('admin_room').emit('global_status_update', {
                type: 'task_update',
                bookingId: booking._id,
                status: 'skipped',
                userName: booking.consumer?.name
            });

        } catch (notifyErr) {
            console.error('Failed to notify ecosystem of skipped wash:', notifyErr);
        }

        return res.status(200).json({
            status: 'success',
            message: 'Booking skipped successfully',
            data: { booking }
        });
    }

    // Check if booking can be modified for other updates
    if (!['pending', 'confirmed'].includes(booking.status)) {
        return next(new AppError('Cannot modify booking after it has been assigned', 400));
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
        req.params.id,
        {
            schedule: schedule || booking.schedule,
            location: location || booking.location,
            addons: addons || booking.addons,
            status: status || booking.status
        },
        { new: true, runValidators: true }
    ).populate('vehicle', 'brand model type plate image');

    res.status(200).json({
        status: 'success',
        message: 'Booking updated successfully',
        data: {
            booking: updatedBooking
        }
    });
});

// Cancel booking
exports.cancelBooking = catchAsync(async (req, res, next) => {
    const { reason } = req.body || {};

    const booking = await Booking.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        isActive: true
    });

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    // Check if booking can be cancelled
    if (!['pending', 'confirmed'].includes(booking.status)) {
        return next(new AppError('Cannot cancel booking after it has been assigned', 400));
    }

    // Update booking status
    const oldStatus = booking.status;
    booking.status = 'cancelled';
    booking.notes.consumer = reason || 'Cancelled by consumer';
    await booking.save();

    // Audit Log: Booking Cancelled
    const auditHelper = require('../../../utils/auditHelper');
    await auditHelper.logAction({
        userId: req.user.id,
        action: 'BOOKING_CANCELLED',
        resource: 'Booking',
        resourceId: booking._id,
        oldValue: { status: oldStatus },
        newValue: { status: 'cancelled' },
        req
    });

    // Process refund with Potential Cancellation Fee (Elite Hardening)
    if (booking.payment.status === 'paid') {
        try {
            let refundAmount = booking.pricing.totalAmount;
            let penaltyAmount = 0;

            // SOP Rule: If Spare Driver is En Route or Arrived, deduct ₹50 convenience fee for the driver
            const isLateCancellation = ['en_route', 'arrived'].includes(oldStatus);
            const isSpareDriver = booking.provider?.type === 'sparedriver';

            if (isLateCancellation && isSpareDriver) {
                penaltyAmount = 100; // Increased to ₹100 for Chauffeur (Elite Protocol)
                refundAmount = Math.max(0, refundAmount - penaltyAmount);

                // Credit penalty to Driver's wallet immediately
                if (booking.provider?.id) {
                    const walletHelper = require('../../../utils/walletHelper');
                    await walletHelper.executeWalletTransaction(
                        booking.provider.id,
                        penaltyAmount,
                        'credit',
                        {
                            category: 'PENALTY_INCOME',
                            description: `Compensation for cancelled booking: #${booking.bookingId || booking._id}`,
                            referenceId: booking._id,
                            referenceType: 'booking'
                        },
                        'sparedriver' // Use sparedriver model context
                    );
                }
            }

            if (booking.payment.method === 'wallet') {
                const walletHelper = require('../../../utils/walletHelper');
                await walletHelper.executeWalletTransaction(
                    booking.consumer,
                    refundAmount,
                    'credit',
                    {
                        category: 'REFUND',
                        description: `Refund for Cancelled Booking: #${booking.bookingId || booking._id} ${penaltyAmount > 0 ? `(After ₹${penaltyAmount} cancellation fee)` : ''}`,
                        referenceId: booking._id,
                        referenceType: 'booking'
                    }
                );
                booking.payment.status = 'refunded';
            } else if (booking.payment.method === 'subscription') {
                const Subscription = require('../../../models/Subscription');
                const activeSub = await Subscription.getActiveSubscription(booking.consumer);
                if (activeSub) {
                    await activeSub.addCredits(1);
                }
                booking.payment.status = 'refunded';
            } else {
                booking.payment.status = 'refund_pending';
            }
            booking.payment.refundAmount = refundAmount;
            booking.payment.refundedAt = new Date();
        await booking.save();

        // 🔊 Phase 7: Real-time Ecosystem Sync
        try {
            const io = socketService.getIO();
            if (io) {
                // 1. Notify Booking Room (Consumer & Staff)
                io.to(booking._id.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: 'cancelled',
                    message: reason || 'Booking cancelled by consumer'
                });

                // 2. Notify Admin Control Tower
                io.to('admin_room').emit('global_status_update', {
                    type: 'task_update',
                    bookingId: booking._id,
                    status: 'cancelled',
                    reason: reason || 'N/A'
                });
            }
        } catch (e) {
            console.error('[Socket] Cancellation broadcast failed:', e.message);
        }
        } catch (refundErr) {
            console.error('Cancellation Refund Error:', refundErr);
            booking.payment.status = 'refund_failed';
            await booking.save();
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Booking cancelled successfully',
        data: {
            booking
        }
    });
});

// Submit feedback for completed booking
exports.submitFeedback = catchAsync(async (req, res, next) => {
    const { rating, review, photos } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return next(new AppError('Please provide a valid rating between 1 and 5', 400));
    }

    const booking = await Booking.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        status: 'completed',
        isActive: true
    });

    if (!booking) {
        return next(new AppError('Booking not found or not completed', 404));
    }

    // Check if feedback already submitted
    if (booking.feedback.rating) {
        return next(new AppError('Feedback already submitted for this booking', 400));
    }

    // Update feedback
    booking.feedback = {
        rating,
        review,
        photos: photos || [],
        submittedAt: new Date()
    };

    await booking.save();

    res.status(200).json({
        status: 'success',
        message: 'Feedback submitted successfully',
        data: {
            booking
        }
    });
});

// Report issue with booking
exports.reportIssue = catchAsync(async (req, res, next) => {
    const { type, description, photo } = req.body;

    if (!type || !description) {
        return next(new AppError('Please provide issue type and description', 400));
    }

    const booking = await Booking.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        isActive: true
    });

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    // Add issue to booking
    booking.issues.push({
        type,
        description,
        photo,
        reportedAt: new Date(),
        status: 'open'
    });

    await booking.save();

    // Notify Admin of new issue or SOS via multiple channels
    try {
        const io = socketService.getIO();

        // 1. WebSocket Broadcast to Admin Command Center
        if (type === 'SOS') {
            io.to('admin_room').emit('sos_alert', {
                bookingId: booking._id,
                orderId: booking.bookingId,
                type: 'SOS',
                description: description,
                consumer: booking.consumer?.name,
                timestamp: new Date()
            });
        } else {
            // Regular issue alert
            io.to('admin_room').emit('global_status_update', {
                type: 'new_issue',
                bookingId: booking._id
            });
        }

        // 2. Persistent Notification
        const { sendAdminNotification } = require('../../../utils/notificationService');
        await sendAdminNotification({
            title: type === 'SOS' ? '🚨 EMERGENCY SOS ALERT' : 'New Issue Reported',
            message: `Booking #${booking.bookingId || booking._id.toString().slice(-6)} reported: ${description.slice(0, 50)}...`,
            type: type === 'SOS' ? 'SOS' : 'ISSUE',
            priority: type === 'SOS' ? 'high' : 'medium',
            metaData: {
                bookingId: booking._id,
                issueType: type,
                consumerId: req.user.id
            }
        });
    } catch (notifyErr) {
        console.error('Failed to notify admin of issue:', notifyErr);
    }

    res.status(200).json({
        status: 'success',
        message: 'Issue reported successfully',
        data: {
            issue: booking.issues[booking.issues.length - 1]
        }
    });
});

// Get booking statistics
exports.getBookingStats = catchAsync(async (req, res, next) => {
    const stats = await Booking.getConsumerStats(req.user.id);

    // Get upcoming bookings count
    const upcomingCount = await Booking.countDocuments({
        consumer: req.user.id,
        status: { $in: ['pending', 'confirmed', 'assigned'] },
        isActive: true
    });

    stats.upcoming = upcomingCount;

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

// Get upcoming bookings
exports.getUpcomingBookings = catchAsync(async (req, res, next) => {
    const { limit = 5 } = req.query;

    const bookings = await Booking.getUpcomingBookings(
        req.user.id,
        parseInt(limit)
    );

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: {
            bookings
        }
    });
});

// Get booking history
exports.getBookingHistory = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 10, category } = req.query;

    const filter = {};
    if (category) filter['service.category'] = category;

    const bookings = await Booking.getBookingHistory(
        req.user.id,
        parseInt(page),
        parseInt(limit),
        filter
    );

    const countFilter = {
        consumer: req.user.id,
        status: { $in: ['completed', 'cancelled', 'refunded'] },
        isActive: true,
        ...filter
    };

    const total = await Booking.countDocuments(countFilter);

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            bookings
        }
    });
});
