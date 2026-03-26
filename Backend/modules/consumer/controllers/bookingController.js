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
const cleanupExpiredBookings = async () => {
    try {
        const standardTimeout = 5 * 60 * 1000; // 5 Minutes for finding
        const eliteStagnantTimeout = 30 * 60 * 1000; // 30 Minutes for assigned but idle
        const now = Date.now();

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
        parkingDetails 
    } = req.body;

    // Extract effective vehicleId
    const effectiveVehicleId = vehicleId || (vehicleObj && (vehicleObj._id || vehicleObj.id));

    // Validate required fields
    if (!effectiveVehicleId || !service) {
        return next(new AppError('Please provide vehicle and service details', 400));
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

    const activeBooking = await Booking.findOne({
        vehicle: effectiveVehicleId,
        status: { $in: ['pending', 'confirmed', 'assigned', 'en_route', 'in_progress', 'arrived', 'washing'] },
        isActive: true,
        $or: [
            { 'schedule.type': 'instant' },
            { 
                'schedule.type': 'scheduled',
                'schedule.date': { $gte: todayStart, $lte: todayEnd }
            },
            { 'status': { $in: ['assigned', 'en_route', 'arrived', 'washing', 'in_progress'] } } // Any ongoing work blocks
        ]
    });

    if (activeBooking) {
        const isScheduled = activeBooking.schedule?.type === 'scheduled';
        const msg = isScheduled 
            ? `This vehicle already has a booking scheduled for today (${new Date(activeBooking.schedule.date).toLocaleDateString()}). Please complete or cancel it first.`
            : 'An ongoing booking already exists for this vehicle. Please complete it first.';
        return next(new AppError(msg, 400));
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

    // Link Hub and Parking Details if provided
    if (bookingLocation) {
        if (hubId) bookingLocation.hubId = hubId;
        if (parkingDetails) bookingLocation.parkingDetails = parkingDetails;
    }

    // Sanitization & Mapping
    const validCategories = ['Doorstep', 'Studio', 'Studio Detailing', 'Add-ons', 'Prestige', 'Chauffeur'];
    const validServiceTypes = ['captain', 'vendor', 'sparedriver'];
    const validPaymentMethods = ['cash', 'online', 'wallet', 'subscription'];
    const validLocationTypes = ['home', 'office', 'other', 'studio'];

    const sanitizedCategory = validCategories.includes(service.category) ? service.category :
        (service.category === 'Express' ? 'Doorstep' : 'Doorstep');

    const sanitizedServiceType = validServiceTypes.includes(service.type?.toLowerCase()) ? service.type.toLowerCase() : 'captain';
    const sanitizedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'online';

    if (bookingLocation && !validLocationTypes.includes(bookingLocation.type)) {
        bookingLocation.type = bookingLocation.type === 'work' ? 'office' : 'home';
    }

    // Coordinates requirement check
    if (sanitizedCategory === 'Doorstep' && (!bookingLocation.address?.coordinates || !bookingLocation.address?.coordinates?.lat)) {
        throw new AppError('Precise GPS coordinates are required for doorstep service. Please select a pinned location.', 400);
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
            if (!activeSub.isServiceEligible({ service: { category: sanitizedCategory, schedule: bookingSchedule }, hub: req.body.hubId || req.body.hub || null, location: bookingLocation })) {
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
                breakdown: breakdown || []
            },
            addons: Array.isArray(addons) ? addons.map(a => typeof a === 'string' ? { id: a } : a) : [],
            schedule: bookingSchedule,
            location: bookingLocation,
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

            if (sanitizedServiceType === 'captain') {
                const io = socketService.getIO();
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
            } else if (sanitizedServiceType === 'vendor') {
                const vendors = await User.find({ role: 'vendor', isActive: true });
                const io = socketService.getIO();
                
                for (const v of vendors) {
                    await sendVendorNotification(v._id, { 
                        title: 'New Studio Lead! 💎', 
                        message: 'New studio booking available in your hub.', 
                        type: 'order-assigned', 
                        metaData: { bookingId: newBooking._id } 
                    });
                }
                
                // Real-time Dashboard Refresh for ALL Vendors (or Hub Specific)
                io.emit('new_studio_booking', { bookingId: newBooking._id });
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
    const { schedule, location, addons } = req.body;

    const booking = await Booking.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        isActive: true
    });

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    // Check if booking can be modified
    if (!['pending', 'confirmed'].includes(booking.status)) {
        return next(new AppError('Cannot modify booking after it has been assigned', 400));
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
        req.params.id,
        {
            schedule: schedule || booking.schedule,
            location: location || booking.location,
            addons: addons || booking.addons
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
    const { reason } = req.body;

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

    // Process refund if payment was made
    if (booking.payment.status === 'paid') {
        booking.payment.status = 'refunded';
        booking.payment.refundAmount = booking.pricing.totalAmount;
        booking.payment.refundedAt = new Date();
        await booking.save();
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
