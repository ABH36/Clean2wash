const Booking = require('../../../models/Booking');
const Vehicle = require('../../../models/Vehicle');
const User = require('../../../models/User');
const Captain = require('../../../models/Captain');
const { sendNotification } = require('../../../utils/notificationService');
const socketService = require('../../../socketService');

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
exports.getMyBookings = async (req, res) => {
    try {
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

    } catch (error) {
        console.error('Error in getMyBookings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get bookings. Please try again.'
        });
    }
};

// Get single booking
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.user.id,
            isActive: true
        })
            .populate('vehicle', 'brand model type plate image compliance')
            .populate('provider.id', 'name phone rating photo')
            .populate('consumer', 'name phone');

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                booking
            }
        });

    } catch (error) {
        console.error('Error in getBooking:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get booking. Please try again.'
        });
    }
};

// Create new booking
exports.createBooking = async (req, res) => {
    try {
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
            couponCode // New field for coupon support
        } = req.body;

        // Extract effective vehicleId
        const effectiveVehicleId = vehicleId || (vehicleObj && (vehicleObj._id || vehicleObj.id));

        // Validate required fields
        if (!effectiveVehicleId || !service) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide vehicle and service details'
            });
        }

        // Check if vehicle belongs to consumer
        const vehicle = await Vehicle.findOne({
            _id: effectiveVehicleId,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vehicle not found or does not belong to you'
            });
        }

        // 1. Prevent overlapping active bookings for the same vehicle
        const activeBooking = await Booking.findOne({
            vehicle: effectiveVehicleId,
            status: { $in: ['pending', 'confirmed', 'assigned', 'en_route', 'in_progress'] },
            isActive: true
        });

        if (activeBooking) {
            return res.status(400).json({
                status: 'fail',
                message: 'An active booking already exists for this vehicle. Please complete it first.'
            });
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

        // Calculate pricing
        const baseAmount = parseInt(service.basePrice || String(service.price).replace(/[^\d]/g, '') || 299);
        const addonAmount = Array.isArray(addons) ? addons.reduce((sum, addon) => {
            // Handle if addons are just IDs or objects
            if (typeof addon === 'string') return sum; // If string, we'd need to look up price, but assuming objects for now
            return sum + (addon.included ? 0 : (addon.price || 0));
        }, 0) : 0;

        const totalAmountBeforeDiscount = Math.round((baseAmount * vehicleMultiplier) + addonAmount);

        // Coupon Logic
        let discountAmount = 0;
        let appliedCouponRecord = null;
        if (couponCode) {
            const Promotion = require('../../../models/Promotion');
            const coupon = await Promotion.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            });

            if (coupon) {
                if (coupon.reductionType === 'PERCENT') {
                    discountAmount = Math.round((totalAmountBeforeDiscount * coupon.val) / 100);
                } else {
                    discountAmount = coupon.val;
                }
                // Cap discount at total amount
                discountAmount = Math.min(discountAmount, totalAmountBeforeDiscount);
                appliedCouponRecord = {
                    code: coupon.code,
                    id: coupon._id,
                    amount: discountAmount
                };
            }
        }

        const totalAmount = totalAmountBeforeDiscount - discountAmount;

        // Wallet Payment Flow
        let walletTransactionId = null;
        if (paymentMethod === 'wallet') {
            const walletController = require('./walletController');
            try {
                const transaction = await walletController.deductMoney(
                    req.user.id,
                    totalAmount,
                    'PAYMENT',
                    `Payment for ${service.name || service.title} booking`,
                    `TXN-WALL-${Date.now()}`
                );
                walletTransactionId = transaction.referenceId;
            } catch (err) {
                return res.status(400).json({
                    status: 'fail',
                    message: err.message || 'Insufficient wallet balance'
                });
            }
        }

        // Prepare location/address
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

        // Backend Sanitization & Enum Mapping
        const validCategories = ['Doorstep', 'Studio', 'Add-ons', 'Prestige', 'Chauffeur'];
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
        
        // 3. Validation: Coordinates are required for doorstep services
        if (sanitizedCategory === 'Doorstep' && (!bookingLocation.address?.coordinates || !bookingLocation.address?.coordinates?.lat)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Precise GPS coordinates are required for doorstep service. Please select a pinned location.'
            });
        }

        // Prepare schedule
        const bookingSchedule = {
            type: schedule?.type || (req.body.scheduledTime ? 'scheduled' : 'instant'),
            date: schedule?.date ? new Date(schedule.date) : (req.body.scheduledTime ? new Date(req.body.scheduledTime) : new Date()),
            timeSlot: schedule?.timeSlot || req.body.timeSlot || null,
            estimatedDuration: service.duration || '40 min'
        };

        // Payment status enforcement
        let paymentStatus = 'pending';
        const transactionId = paymentId || orderId || walletTransactionId;

        if (sanitizedPaymentMethod === 'online') {
            if (!transactionId) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Payment verification failed. No transaction reference found.'
                });
            }
            paymentStatus = 'paid';
        } else if (paymentMethod === 'wallet' && walletTransactionId) {
            paymentStatus = 'paid';
        } else if (paymentMethod === 'subscription') {
            paymentStatus = 'paid';
        }

        // Create booking
        const newBooking = await Booking.create({
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
                discountAmount,
                totalAmount
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
        });

        // Populate booking details
        const populatedBooking = await Booking.findById(newBooking._id)
            .populate('vehicle', 'brand model type plate image')
            .populate('consumer', 'name phone');

        // Send notification
        await sendNotification(req.user.id, {
            title: 'Order Received! 🚀',
            message: `Your booking for ${service.name || service.title} has been placed successfully.`,
            type: 'booking',
            priority: 'medium',
        });
        
        // Broadcast to nearby online captains via Socket.io
        try {
            const io = socketService.getIO();
            const broadcastPayload = {
                bookingId: newBooking._id,
                serviceName: service.name || service.title,
                location: {
                    address: bookingLocation.address,
                    type: bookingLocation.type,
                    landmark: bookingLocation.landmark
                },
                vehicle: {
                    brand: vehicle.brand,
                    model: vehicle.model,
                    plate: vehicle.plate
                },
                pricing: {
                    total: totalAmount
                },
                timestamp: new Date()
            };

            // Calculate matching captains if precise coordinates exist
            if (bookingLocation.address && bookingLocation.address.coordinates && bookingLocation.address.coordinates.lat) {
                const lng = parseFloat(bookingLocation.address.coordinates.lng);
                const lat = parseFloat(bookingLocation.address.coordinates.lat);

                // Find captains within 10km radius
                const nearbyCaptains = await Captain.find({
                    isOnline: true,
                    isActive: true,
                    // isVerified: true, // Relaxed for testing/development
                    location: {
                        $nearSphere: {
                            $geometry: {
                                type: 'Point',
                                coordinates: [lng, lat]
                            },
                            $maxDistance: 10000 // 10km in meters
                        }
                    }
                });

                if (nearbyCaptains.length > 0) {
                    console.log(`Found ${nearbyCaptains.length} nearby captains. Emitting selectively.`);
                    nearbyCaptains.forEach(captain => {
                        io.to(captain._id.toString()).emit('new_booking_broadcast', broadcastPayload);
                    });
                } else {
                    console.log(`No nearby captains found. Emitting globally as fallback.`);
                    io.emit('new_booking_broadcast', broadcastPayload);
                }
            } else {
                // Fallback to global broadcast if no coordinates
                console.log(`No GPS coordinates provided. Emitting globally as fallback.`);
                io.emit('new_booking_broadcast', broadcastPayload);
            }

            console.log(`Real-time broadcast dispatched for booking: ${newBooking._id}`);
        } catch (socketErr) {
            console.error('Socket broadcast failed:', socketErr.message);
            // Non-blocking error, booking is already created
        }

        res.status(201).json({
            status: 'success',
            message: 'Booking created successfully',
            data: {
                booking: populatedBooking
            }
        });

    } catch (error) {
        console.error('Error in createBooking:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'fail',
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to create booking. Please try again.'
        });
    }
};

// Update booking
exports.updateBooking = async (req, res) => {
    try {
        const { schedule, location, addons } = req.body;

        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
        }

        // Check if booking can be modified
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cannot modify booking after it has been assigned'
            });
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

    } catch (error) {
        console.error('Error in updateBooking:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update booking. Please try again.'
        });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const { reason } = req.body;

        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
        }

        // Check if booking can be cancelled
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cannot cancel booking after it has been assigned'
            });
        }

        // Update booking status
        booking.status = 'cancelled';
        booking.notes.consumer = reason || 'Cancelled by consumer';
        await booking.save();

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

    } catch (error) {
        console.error('Error in cancelBooking:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to cancel booking. Please try again.'
        });
    }
};

// Submit feedback for completed booking
exports.submitFeedback = async (req, res) => {
    try {
        const { rating, review, photos } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid rating between 1 and 5'
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            status: 'completed',
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found or not completed'
            });
        }

        // Check if feedback already submitted
        if (booking.feedback.rating) {
            return res.status(400).json({
                status: 'fail',
                message: 'Feedback already submitted for this booking'
            });
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

    } catch (error) {
        console.error('Error in submitFeedback:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to submit feedback. Please try again.'
        });
    }
};

// Report issue with booking
exports.reportIssue = async (req, res) => {
    try {
        const { type, description, photo } = req.body;

        if (!type || !description) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide issue type and description'
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
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

        // Notify Admin of new issue or SOS
        try {
            const { sendAdminNotification } = require('../../../utils/notificationService');
            await sendAdminNotification({
                title: type === 'SOS' ? '🚨 EMERGENCY SOS ALERT' : 'New Issue Reported',
                message: `Booking #${booking.bookingId || booking._id.toString().slice(-6)} reported: ${description.slice(0, 50)}...`,
                type: type === 'SOS' ? 'SOS' : 'ISSUE',
                priority: type === 'SOS' ? 'high' : 'medium',
                metaData: {
                    bookingId: booking._id,
                    issueType: type,
                    consumerId: req.consumer.id
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

    } catch (error) {
        console.error('Error in reportIssue:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to report issue. Please try again.'
        });
    }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
    try {
        const stats = await Booking.getConsumerStats(req.consumer.id);

        // Get upcoming bookings count
        const upcomingCount = await Booking.countDocuments({
            consumer: req.consumer.id,
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

    } catch (error) {
        console.error('Error in getBookingStats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get booking statistics. Please try again.'
        });
    }
};

// Get upcoming bookings
exports.getUpcomingBookings = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const bookings = await Booking.getUpcomingBookings(
            req.consumer.id,
            parseInt(limit)
        );

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: {
                bookings
            }
        });

    } catch (error) {
        console.error('Error in getUpcomingBookings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get upcoming bookings. Please try again.'
        });
    }
};

// Get booking history
exports.getBookingHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const bookings = await Booking.getBookingHistory(
            req.consumer.id,
            parseInt(page),
            parseInt(limit)
        );

        const total = await Booking.countDocuments({
            consumer: req.consumer.id,
            status: { $in: ['completed', 'cancelled', 'refunded'] },
            isActive: true
        });

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

    } catch (error) {
        console.error('Error in getBookingHistory:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get booking history. Please try again.'
        });
    }
};
