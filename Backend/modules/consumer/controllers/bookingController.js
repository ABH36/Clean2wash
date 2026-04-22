const mongoose = require('mongoose');
const crypto = require('crypto');
const Booking = require('../../../models/Booking');
const MasterData = require('../../../models/MasterData');
const Vehicle = require('../../../models/Vehicle');
const User = require('../../../models/User');
const Captain = require('../../../models/Captain');
const SpareDriver = require('../../../models/SpareDriver');
const ServiceZone = require('../../../models/ServiceZone');
const { sendNotification, sendVendorNotification, sendSpareDriverNotification } = require('../../../utils/notificationService');
const socketService = require('../../../services/enhancedSocketService');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const PricingEngine = require('../../../utils/pricingHelper');
const commissionHelper = require('../../../utils/commissionHelper');
const { executeWalletTransaction, adjustWalletHold } = require('../../../utils/walletHelper');
const { broadcastBookingToDrivers } = require('../../../utils/spareDriverDispatch');

const CHAUFFEUR_DISPATCH_LEAD_MINUTES = 15;
const NON_TERMINAL_ACTIVE_STATUSES = ['accepted', 'en_route', 'arrived', 'before_photo', 'washing', 'after_photo', 'in_progress', 'active'];
const NON_TERMINAL_ASSIGNED_STATUSES = ['confirmed', 'assigned'];

const normalizeCapabilityLabel = (value = '') => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';

    if (/(bus)/i.test(normalized)) return 'bus';
    if (/(traveler|traveller|van|mpv|muv)/i.test(normalized)) return 'traveler';
    if (/(truck|pickup|tractor|mini truck)/i.test(normalized)) return 'heavy';
    if (/(suv|compact suv|luxury suv)/i.test(normalized)) return 'suv';
    if (/(bike|scooter|superbike|two wheeler)/i.test(normalized)) return 'bike';
    return 'car';
};

const getVehicleCapability = (vehicle = {}) => (
    normalizeCapabilityLabel(
        vehicle?.typeRef?.type ||
        vehicle?.typeRef?.name ||
        vehicle?.type ||
        vehicle?.model
    )
);

const captainMatchesCapability = (captainVehicleType = '', requestedCapability = '') => {
    const captainCapability = normalizeCapabilityLabel(captainVehicleType);
    if (!requestedCapability) return true;
    if (!captainCapability) return false;

    const compatibilityMap = {
        car: new Set(['car', 'suv']),
        suv: new Set(['suv']),
        traveler: new Set(['traveler']),
        bus: new Set(['bus']),
        heavy: new Set(['heavy']),
        bike: new Set(['bike'])
    };

    return (compatibilityMap[requestedCapability] || new Set([requestedCapability])).has(captainCapability);
};

const isApartmentBooking = (booking = {}) => !!booking?.location?.hubId || booking?.service?.category === 'Apartment';

const parseSlotDateTime = (dateValue, timeValue, fallbackOffsetMinutes = 0) => {
    if (!dateValue) return null;

    const base = new Date(dateValue);
    if (Number.isNaN(base.getTime())) return null;

    if (!timeValue) {
        base.setMinutes(base.getMinutes() + fallbackOffsetMinutes);
        return base;
    }

    const parsed = new Date(`${base.toDateString()} ${timeValue}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    base.setMinutes(base.getMinutes() + fallbackOffsetMinutes);
    return base;
};

const isCaptainMissionBlockingInstant = (booking, now = new Date()) => {
    if (!booking) return false;

    if (NON_TERMINAL_ACTIVE_STATUSES.includes(booking.status)) return true;
    if (!NON_TERMINAL_ASSIGNED_STATUSES.includes(booking.status)) return false;
    if (booking?.schedule?.type === 'instant') return true;

    const apartmentMission = isApartmentBooking(booking);
    const missionStart = parseSlotDateTime(booking?.schedule?.date, booking?.schedule?.timeSlot?.start);
    const missionEnd = parseSlotDateTime(booking?.schedule?.date, booking?.schedule?.timeSlot?.end, 90);

    if (!missionStart) return apartmentMission;

    const leadWindowMs = (apartmentMission ? 120 : 45) * 60 * 1000;
    const withinLeadWindow = (missionStart.getTime() - now.getTime()) <= leadWindowMs;
    const insideMissionWindow = missionEnd ? now <= missionEnd : now >= missionStart;

    return withinLeadWindow || insideMissionWindow;
};

const getScheduledDispatchTime = (schedule = {}) => {
    if (!schedule?.date) return new Date();

    const scheduledAt = new Date(schedule.date);

    if (schedule?.timeSlot?.start) {
        const [hours, minutes] = String(schedule.timeSlot.start).split(':').map(Number);
        scheduledAt.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    }

    return scheduledAt;
};

const isDispatchReadySchedule = (schedule = {}, leadMinutes = CHAUFFEUR_DISPATCH_LEAD_MINUTES) => {
    if (!schedule || schedule.type !== 'scheduled') return true;
    return getScheduledDispatchTime(schedule).getTime() <= (Date.now() + (leadMinutes * 60 * 1000));
};

const parseServiceDurationHours = (durationValue = '', fallbackHours = 1) => {
    const matchedHours = String(durationValue || '').match(/(\d+)/);
    const hours = matchedHours ? parseInt(matchedHours[1], 10) : fallbackHours;
    return Number.isFinite(hours) && hours > 0 ? hours : fallbackHours;
};

const getChauffeurReserveAmount = (service = {}, totalAmount = 0, reserveHours = 2) => {
    const bookedHours = parseServiceDurationHours(service.duration || service.schedule?.estimatedDuration, 1);
    const effectiveHourlyRate = bookedHours > 0
        ? Math.max(1, Math.round(Number(totalAmount || 0) / bookedHours))
        : Math.max(1, Number(totalAmount || 0));

    return {
        bookedHours,
        reserveHours,
        reserveAmount: Math.max(0, Math.round(effectiveHourlyRate * reserveHours))
    };
};

const getHeldReserveAmount = (booking = {}) => Math.max(0, Number(booking.payment?.walletReserveHeldAmount || 0));

const getChauffeurCommissionOverride = (booking = {}) => {
    const rate = Number(booking?.service?.metadata?.commercialRules?.commissionPercent);
    return Number.isFinite(rate) && rate >= 0 ? rate : null;
};

const holdChauffeurReserve = async (consumerId, bookingId, amount, session) => {
    if (!amount || amount <= 0) return null;

    return adjustWalletHold(
        consumerId,
        amount,
        'hold',
        {
            category: 'SERVICE_BOOKING',
            description: `Wallet reserve locked for chauffeur booking #${bookingId}`,
            referenceId: `${bookingId}-reserve-hold`,
            referenceType: 'booking_wallet_reserve'
        },
        session
    );
};

const releaseChauffeurReserve = async (booking, reason = 'reserve released', session = null) => {
    const heldAmount = getHeldReserveAmount(booking);
    if (!heldAmount || booking.service?.type !== 'sparedriver') {
        return 0;
    }

    await adjustWalletHold(
        booking.consumer,
        heldAmount,
        'release',
        {
            category: 'REFUND',
            description: `Wallet reserve released for chauffeur booking #${booking.bookingId || booking._id}`,
            referenceId: `${booking._id.toString()}-reserve-release-${booking.payment?.walletReserveReleasedAmount || 0}`,
            referenceType: 'booking_wallet_reserve_release',
            metaData: { reason }
        },
        session
    );

    booking.payment.walletReserveHeldAmount = 0;
    booking.payment.walletReserveReleasedAmount = Number(booking.payment.walletReserveReleasedAmount || 0) + heldAmount;
    booking.payment.walletReserveStatus = 'released';
    booking.payment.walletReserveReleasedAt = new Date();

    return heldAmount;
};

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
        const expiredPendingCandidates = await Booking.find({
            status: 'pending',
            isActive: true,
            createdAt: { $lt: new Date(now - standardTimeout) }
        });
        const expiredPending = expiredPendingCandidates.filter((booking) => isDispatchReadySchedule(booking.schedule));

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

            if (booking.service?.type === 'sparedriver') {
                try {
                    await releaseChauffeurReserve(booking, 'auto_cancel_timeout');
                } catch (reserveError) {
                    console.error('Failed to release chauffeur reserve on timeout:', reserveError);
                }
            }

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
        .populate('provider.id', 'name phone rating photo verification')
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
        .populate('provider.id', 'name phone status isOnline currentLocation verification')
        .populate('consumer', 'name phone');

    res.status(200).json({
        status: 'success',
        data: {
            booking
        }
    });
});

// Create new booking
// Create new booking

// Trip Sharing (Public Access Protocol)
exports.getPublicTripShare = catchAsync(async (req, res, next) => {
    const booking = await Booking.findOne({
        _id: req.params.id,
        isActive: true
    })
        .select('bookingId status service provider location schedule vehicle createdAt')
        .populate('vehicle', 'brand model type plate')
        .populate('provider.id', 'name rating photo currentLocation status');

    if (!booking) {
        return next(new AppError('The requested tracking session is no longer active or valid.', 404));
    }

    const publicStatuses = ['accepted', 'assigned', 'en_route', 'arrived', 'washing', 'in_progress', 'after_photo', 'completed'];
    if (!publicStatuses.includes(booking.status)) {
        return next(new AppError('Tracking is not yet active for this service protocol.', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            booking: {
                id: booking.bookingId || booking._id,
                status: booking.status,
                serviceName: booking.service?.name,
                serviceType: booking.service?.type,
                location: booking.location,
                schedule: booking.schedule,
                vehicle: booking.vehicle,
                provider: booking.provider?.id ? {
                    name: booking.provider.id.name,
                    rating: booking.provider.id.rating || 4.9,
                    photo: booking.provider.id.photo,
                    location: booking.provider.id.currentLocation,
                    status: booking.provider.id.status
                } : null
            }
        }
    });
});

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
    // We already check if already in DEEP debt (above ₹100).
    // The walletHelper will later check if this transaction pushes them below the credit limit (-₹500).
    if (req.user.wallet?.balance < -100) {
        return next(new AppError(`Access Denied! You have an outstanding arrears of ₹${Math.abs(req.user.wallet.balance)}. Please recharge your wallet to clear the debt before booking again. You can have a maximum debt of ₹500 across all services.`, 403));
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
            const instantServiceLabel = isIncomingChauffeur ? 'instant driver booking' : 'instant booking';
            return next(new AppError(`Conflict detected! You have a scheduled booking for this car at ${upTime}. Starting an ${instantServiceLabel} now would cause a delay. Please cancel the upcoming booking first or wait.`, 400));
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

    // 🛡️ Zero-Trust Pricing: Multiplier is now resolved server-side in the PricingEngine
    // using the vehicleId. Local calculation removed to prevent drift/manipulation.

    // Sanitization & Mapping
    const validCategories = ['Doorstep', 'Studio', 'Studio Detailing', 'Add-ons', 'Prestige', 'Chauffeur', 'Apartment'];
    const validServiceTypes = ['captain', 'vendor', 'sparedriver'];
    const validPaymentMethods = ['cash', 'online', 'wallet', 'subscription'];
    const validLocationTypes = ['home', 'office', 'other', 'studio', 'Apartment'];

    const sanitizedCategory = validCategories.includes(service.category) ? service.category :
        (service.category === 'Express' ? 'Doorstep' : 'Doorstep');

    let sanitizedServiceType = validServiceTypes.includes(service.type?.toLowerCase()) ? service.type.toLowerCase() : 'captain';
    const sanitizedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'online';

    let trustedServiceMetadata = service.metadata || {};
    if (sanitizedServiceType === 'sparedriver' || sanitizedCategory === 'Chauffeur') {
        const serviceLookup = [];
        if (service?.id && /^[a-f\d]{24}$/i.test(String(service.id))) {
            serviceLookup.push({ _id: service.id });
        }
        if (service?.id) {
            serviceLookup.push({ 'metadata.id': service.id });
            serviceLookup.push({ key: String(service.id).toUpperCase() });
        }
        if (service?.key) {
            serviceLookup.push({ key: String(service.key).toUpperCase() });
            serviceLookup.push({ 'metadata.id': service.key });
        }
        if (service?.name || service?.title) {
            serviceLookup.push({ title: service.name || service.title });
        }

        if (serviceLookup.length > 0) {
            const masterService = await MasterData.findOne({
                type: 'SERVICE',
                isActive: true,
                $or: serviceLookup
            }).lean();

            if (masterService?.metadata) {
                trustedServiceMetadata = masterService.metadata;
            }
        }
    }

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
        throw new AppError('Destination GPS coordinates are required for chauffeur travel.', 400);
    }

    // Prepare schedule
    const bookingSchedule = {
        type: schedule?.type || (req.body.scheduledTime ? 'scheduled' : 'instant'),
        date: schedule?.date ? new Date(schedule.date) : (req.body.scheduledTime ? new Date(req.body.scheduledTime) : new Date()),
        timeSlot: schedule?.timeSlot || req.body.timeSlot || null,
        estimatedDuration: service.duration || '40 min'
    };
    const chauffeurDispatchReady = sanitizedServiceType !== 'sparedriver' || isDispatchReadySchedule(bookingSchedule);

    // 3. Centralized Pricing Engine (Industrial Eligibility Aware)
    const pricingResult = await PricingEngine.calculate({
        servicePrice: baseAmount,
        vehicleId: effectiveVehicleId, // 🛡️ Pass ID directly for server-side lookup
        addonAmount,
        couponCode,
        paymentMethod: sanitizedPaymentMethod,
        isCombo: Array.isArray(addons) && addons.filter(a => !a.included).length > 0,
        service: {
            id: service.id || service.key || '',
            key: service.key || service.id || '',
            name: service.name || service.title || '',
            title: service.title || service.name || '',
            category: sanitizedCategory,
            type: sanitizedServiceType,
            metadata: trustedServiceMetadata,
            schedule: bookingSchedule
        },
        hub: hubId || req.body.hub || null,
        location: bookingLocation
    }, req.user);

    const { totalAmount, discounts, appliedBenefit, breakdown, vehicleMultiplier } = pricingResult;
    const chauffeurReserve = sanitizedServiceType === 'sparedriver'
        ? getChauffeurReserveAmount({
            ...service,
            duration: service.duration || bookingSchedule.estimatedDuration,
            schedule: bookingSchedule
        }, totalAmount)
        : { bookedHours: 0, reserveHours: 0, reserveAmount: 0 };

    if (sanitizedServiceType === 'sparedriver') {
        const walletBalance = Number(req.user.wallet?.balance || 0);
        if (walletBalance < chauffeurReserve.reserveAmount) {
            return next(new AppError(
                `Please maintain at least ₹${chauffeurReserve.reserveAmount} in your wallet as a 2-hour reserve before booking this driver service.`,
                400
            ));
        }
    }

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

    let newBooking;

    try {
        const bookingId = new mongoose.Types.ObjectId();
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
            const subscriptionBookingContext = {
                service: {
                    id: service.id || service.key || '',
                    category: sanitizedCategory,
                    type: sanitizedServiceType,
                    key: service.key || service.id || '',
                    name: service.name || service.title || '',
                    title: service.title || service.name || '',
                    path: trustedServiceMetadata.path || '',
                    metadata: trustedServiceMetadata,
                    schedule: bookingSchedule
                },
                hub: req.body.hubId || req.body.hub || null,
                location: bookingLocation,
                destination: bookingDestination,
                moduleScope: sanitizedServiceType === 'sparedriver' ? 'spare-driver' : undefined
            };
            const activeSub = await Subscription.getActiveSubscription(
                req.user.id,
                subscriptionBookingContext,
                { moduleScope: sanitizedServiceType === 'sparedriver' ? 'spare-driver' : undefined }
            );
            if (!activeSub) throw new AppError('No active subscription found.', 404);

            // eligibility audit
            if (!activeSub.isServiceEligible(subscriptionBookingContext)) {
                throw new AppError('Service not covered by your subscription plan.', 400);
            }

            if (activeSub.getAvailableCredits() <= 0) throw new AppError('Insufficient subscription credits.', 400);

            await activeSub.useCredits(1, session);
            paymentStatus = 'paid';
            transactionId = `SUB-${activeSub._id}-${Date.now()}`;
        } else if (sanitizedPaymentMethod === 'online' && transactionId) {
            paymentStatus = 'paid';
        }

        if (sanitizedServiceType === 'sparedriver' && chauffeurReserve.reserveAmount > 0) {
            await holdChauffeurReserve(req.user.id, bookingId.toString(), chauffeurReserve.reserveAmount, session);
        }

        // ✅ ZONE VALIDATION - Check if service is available in the pickup location
        const pickupLat = bookingLocation?.address?.coordinates?.lat;
        const pickupLng = bookingLocation?.address?.coordinates?.lng;
        
        console.log('🔍 Zone Validation Debug:');
        console.log('   📍 Pickup Coordinates:', { lat: pickupLat, lng: pickupLng });
        console.log('   📦 Booking Location:', JSON.stringify(bookingLocation, null, 2));
        
        if (!pickupLat || !pickupLng) {
            console.log('   ❌ Missing coordinates');
            throw new AppError('Pickup location coordinates are required for service validation', 400);
        }

        // Check zone availability for the service type
        const serviceTypeForZone = sanitizedServiceType === 'sparedriver' ? 'spareDriver' : 
                                 sanitizedServiceType === 'captain' ? 'carWash' : 'carWash';
        
        console.log('   🔧 Service Type Mapping:', { 
            sanitizedServiceType, 
            serviceTypeForZone 
        });
        
        const zoneCheck = await ServiceZone.checkServiceAvailability(
            pickupLng,
            pickupLat,
            serviceTypeForZone
        );

        console.log('   🎯 Zone Check Result:', JSON.stringify(zoneCheck, null, 2));

        if (!zoneCheck.available) {
            console.log('   ❌ Zone validation failed:', zoneCheck.reason);
            throw new AppError(zoneCheck.reason || 'Service not available in this area. Please try a different location.', 400);
        }

        console.log('   ✅ Zone validation passed:', zoneCheck.zone?.displayName);

        // Create booking
        [newBooking] = await Booking.create([{
            _id: bookingId,
            consumer: req.user.id,
            vehicle: effectiveVehicleId,
            
            // ✅ Store zone information in booking
            zone: {
                id: zoneCheck.zone._id,
                name: zoneCheck.zone.name,
                code: zoneCheck.zone.code,
                displayName: zoneCheck.zone.displayName
            },
            
            service: {
                id: service.id || 'service_' + Date.now(),
                name: service.name || service.title,
                category: sanitizedCategory,
                type: sanitizedServiceType,
                duration: service.duration || '40 min',
                basePrice: baseAmount,
                features: service.features || trustedServiceMetadata.features || [],
                metadata: trustedServiceMetadata
            },
            pricing: {
                baseAmount,
                vehicleMultiplier,
                addonAmount,
                discountAmount: (breakdown || []).reduce((sum, item) => (
                    ['subscription', 'loyalty', 'combo', 'goldpass', 'coupon'].includes(item?.type)
                        ? sum + (item.amount || 0)
                        : sum
                ), 0),
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
                walletReserveAmount: chauffeurReserve.reserveAmount,
                walletReserveHours: chauffeurReserve.reserveHours,
                walletReserveHeldAmount: sanitizedServiceType === 'sparedriver' ? chauffeurReserve.reserveAmount : 0,
                walletReserveConsumedAmount: 0,
                walletReserveReleasedAmount: 0,
                walletReserveStatus: sanitizedServiceType === 'sparedriver' && chauffeurReserve.reserveAmount > 0 ? 'held' : 'not_required',
                walletReserveHeldAt: sanitizedServiceType === 'sparedriver' && chauffeurReserve.reserveAmount > 0 ? new Date() : null,
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

        // Commit transaction and end session
        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        // Only abort if transaction is still active
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        console.error('Booking Transaction Aborted:', error);
        return next(error);
    }

    // Broadcasts and notifications (Outside transaction - no session dependency)
    try {
        const populatedBooking = await Booking.findById(newBooking._id)
            .populate('vehicle', 'brand model type plate image')
            .populate('consumer', 'name phone');

        // 1. Notify Consumer
        await sendNotification(req.user.id, {
            title: 'Order Received! 🚀',
            message: `Your booking for ${service.name || service.title} has been placed successfully.`,
            type: 'booking',
            priority: 'medium',
        });

        // 2. Notify Admin HUD (Real-time & Persistent Log)
        try {
            const io = socketService.getIO();
            io.to('admin_room').emit('global_status_update', {
                type: 'new_booking',
                bookingId: newBooking._id,
                userName: req.user.name,
                serviceName: service.name || service.title,
                totalAmount
            });
        } catch (socketError) {
            console.error('Socket broadcast failed for new booking:', socketError.message);
        }

        await sendAdminNotification({
            title: 'New Booking Received 📦',
            message: `Order #${populatedBooking?.bookingId || populatedBooking?._id} received from ${req.user.name} for ${service.name || service.title}.`,
            type: 'booking',
            priority: 'medium',
            actionUrl: `/admin/bookings-operations`,
            metaData: { bookingId: newBooking._id, consumerId: req.user.id }
        });

        if (sanitizedServiceType === 'captain') {
            const requestedCapability = getVehicleCapability(vehicle);
            const broadcastPayload = {
                bookingId: newBooking._id,
                serviceName: service.name || service.title,
                location: bookingLocation,
                vehicle: { brand: vehicle.brand, model: vehicle.model, plate: vehicle.plate },
                capabilityRequired: requestedCapability || 'car',
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

                const captainsWithTaggedCapability = nearbyCaptains.filter(c => normalizeCapabilityLabel(c.profile?.vehicleType));
                const eligibleCaptains = requestedCapability && captainsWithTaggedCapability.length > 0
                    ? nearbyCaptains.filter(c => captainMatchesCapability(c.profile?.vehicleType, requestedCapability))
                    : nearbyCaptains;
                const eligibleCaptainIds = eligibleCaptains.map((captain) => captain._id);
                const blockingMissions = eligibleCaptainIds.length > 0
                    ? await Booking.find({
                        'provider.id': { $in: eligibleCaptainIds },
                        isActive: true,
                        status: { $in: [...NON_TERMINAL_ASSIGNED_STATUSES, ...NON_TERMINAL_ACTIVE_STATUSES] }
                    }).select('provider.id status schedule service location').lean()
                    : [];

                const blockedCaptainIds = new Set(
                    blockingMissions
                        .filter((mission) => isCaptainMissionBlockingInstant(mission))
                        .map((mission) => String(mission?.provider?.id || ''))
                        .filter(Boolean)
                );

                const dispatchReadyCaptains = eligibleCaptains.filter(
                    (captain) => !blockedCaptainIds.has(String(captain._id))
                );

                dispatchReadyCaptains.forEach(c => io.to(c._id.toString()).emit('new_booking_broadcast', broadcastPayload));
            } else {
                const onlineCaptains = await Captain.find({
                    isOnline: true,
                    isActive: true,
                    isVerified: true
                }).select('_id profile.vehicleType').lean();

                const captainsWithTaggedCapability = onlineCaptains.filter(c => normalizeCapabilityLabel(c.profile?.vehicleType));
                const eligibleCaptains = requestedCapability && captainsWithTaggedCapability.length > 0
                    ? onlineCaptains.filter(c => captainMatchesCapability(c.profile?.vehicleType, requestedCapability))
                    : onlineCaptains;

                const eligibleCaptainIds = eligibleCaptains.map((captain) => captain._id);
                const blockingMissions = eligibleCaptainIds.length > 0
                    ? await Booking.find({
                        'provider.id': { $in: eligibleCaptainIds },
                        isActive: true,
                        status: { $in: [...NON_TERMINAL_ASSIGNED_STATUSES, ...NON_TERMINAL_ACTIVE_STATUSES] }
                    }).select('provider.id status schedule service location').lean()
                    : [];

                const blockedCaptainIds = new Set(
                    blockingMissions
                        .filter((mission) => isCaptainMissionBlockingInstant(mission))
                        .map((mission) => String(mission?.provider?.id || ''))
                        .filter(Boolean)
                );

                eligibleCaptains
                    .filter((captain) => !blockedCaptainIds.has(String(captain._id)))
                    .forEach((captain) => io.to(String(captain._id)).emit('new_booking_broadcast', broadcastPayload));
            }
        } else if (sanitizedServiceType === 'sparedriver') {
            if (chauffeurDispatchReady) {
                await broadcastBookingToDrivers(newBooking, {
                    serviceName: service.name || service.title || 'Spare Driver service',
                    vehicle: { brand: vehicle.brand, model: vehicle.model, plate: vehicle.plate },
                    reason: 'booking_created'
                });
            } else {
                await sendNotification(req.user.id, {
                    title: 'Trip Scheduled',
                    message: 'Your chauffeur trip is confirmed. Driver matching will begin closer to your booking time.',
                    type: 'booking',
                    priority: 'high',
                    actionUrl: '/spare-driver/history',
                    actionText: 'View Booking',
                    metaData: {
                        bookingId: newBooking._id.toString(),
                        status: 'pending',
                        dispatchState: 'scheduled_hold'
                    }
                });
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
        }

        return res.status(201).json({ 
            status: 'success', 
            message: 'Booking created successfully', 
            data: { 
                booking: populatedBooking,
                securityPin: populatedBooking.securityPin,
                dispatchReady: chauffeurDispatchReady
            } 
        });

    } catch (sideErr) {
        console.error('Post-transaction side-effects error:', sideErr);
        return res.status(201).json({ 
            status: 'success', 
            message: 'Booking created, notifications may delay.', 
            data: { 
                booking: newBooking,
                securityPin: newBooking.securityPin,
                dispatchReady: chauffeurDispatchReady
            } 
        });
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
                    const activeSub = await Subscription.getActiveSubscription(booking.consumer._id, {
                        service: booking.service || {},
                        hub: booking.location?.hubId || null,
                        location: booking.location || {},
                        destination: booking.location?.destination || null
                    });
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

// Update booking pricing (e.g. adding tip/fare while searching)
exports.updateBookingPricing = catchAsync(async (req, res, next) => {
    const { tipAmount, addons } = req.body;

    const booking = await Booking.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        isActive: true,
        status: { $in: ['pending', 'en_route', 'arrived', 'active'] }
    });

    if (!booking) {
        return next(new AppError('Booking not found or cannot be modified at this stage', 404));
    }

    if (tipAmount !== undefined) {
        // Increase tip
        const currentTip = booking.pricing?.tipAmount || 0;
        const tipDelta = tipAmount - currentTip;
        
        if (tipDelta < 0) {
            return next(new AppError('Fare cannot be decreased once offered', 400));
        }

        booking.pricing.tipAmount = tipAmount;
        booking.pricing.totalAmount += tipDelta;
        
        booking.pricing.breakdown = booking.pricing.breakdown || [];
        // Update or add tip breakdown
        const tipIdx = booking.pricing.breakdown.findIndex(b => b.name === 'Extra Fare/Tip');
        if (tipIdx > -1) {
            booking.pricing.breakdown[tipIdx].amount = tipAmount;
        } else {
            booking.pricing.breakdown.push({ name: 'Extra Fare/Tip', amount: tipAmount, type: 'surcharge' });
        }
        
        booking.notes.internal = `${booking.notes.internal || ''}\n[FARE_INCREASE] User added ₹${tipDelta} to attract drivers.`.trim();
    }

    if (addons && Array.isArray(addons)) {
        // Handle addon updates if needed
        booking.addons = addons;
    }

    await booking.save();

    // Broadcast update to ecosystem (especially finding driver screens)
    try {
        const io = socketService.getIO();
        if (io) {
            io.to(booking._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: booking.status,
                pricing: booking.pricing
            });
            
            // Notify admin
            io.to('admin_room').emit('global_status_update', {
                type: 'pricing_update',
                bookingId: booking._id,
                totalAmount: booking.pricing.totalAmount
            });
        }
    } catch (socketError) {
        console.error('Socket broadcast failed for pricing update:', socketError.message);
        // Continue without socket - don't break the API call
    }

    res.status(200).json({
        status: 'success',
        message: 'Pricing updated successfully',
        data: { booking }
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
    if (!['pending', 'confirmed', 'accepted'].includes(booking.status)) {
        return next(new AppError('Cannot cancel booking after it has been assigned', 400));
    }

    // Update booking status
    const oldStatus = booking.status;
    booking.status = 'cancelled';
    booking.notes.consumer = reason || 'Cancelled by consumer';

    if (booking.service?.type === 'sparedriver') {
        await releaseChauffeurReserve(booking, 'consumer_cancelled');
    }

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
                const activeSub = await Subscription.getActiveSubscription(booking.consumer, {
                    service: booking.service || {},
                    hub: booking.location?.hubId || null,
                    location: booking.location || {},
                    destination: booking.location?.destination || null
                });
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

exports.settleAdditionalPayment = catchAsync(async (req, res, next) => {
    const {
        paymentMethod = 'wallet',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body || {};

    const booking = await Booking.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        isActive: true,
        status: 'completed',
        'service.type': 'sparedriver'
    }).populate('provider.id', 'name phone verification');

    if (!booking) {
        return next(new AppError('Chauffeur booking not found', 404));
    }

    const pendingAmount = booking.payment?.pendingAmount || Math.max(
        0,
        (booking.pricing?.totalAmount || 0) - (booking.pricing?.initialPaidAmount || 0) - (booking.payment?.settledAmount || 0)
    );

    if (pendingAmount <= 0 || booking.payment?.status !== 'settlement_pending') {
        return res.status(200).json({
            status: 'success',
            message: 'No additional payment is pending for this trip',
            data: { booking }
        });
    }

    if (!['wallet', 'online'].includes(paymentMethod)) {
        return next(new AppError('Please choose wallet or online payment for settlement', 400));
    }

    const consumer = await User.findById(req.user.id).select('wallet');
    if (!consumer) {
        return next(new AppError('Consumer account not found', 404));
    }

    if (paymentMethod === 'wallet') {
        const walletBalance = consumer.wallet?.balance || 0;
        if (walletBalance < pendingAmount) {
            return next(new AppError(`Insufficient wallet balance. Please add ${pendingAmount - walletBalance} or choose online payment.`, 400));
        }

        await executeWalletTransaction(
            consumer._id,
            pendingAmount,
            'debit',
            {
                category: 'SERVICE_CHARGE',
                description: `Final chauffeur settlement for booking #${booking.bookingId || booking._id}`,
                referenceId: booking._id.toString(),
                referenceType: 'booking_settlement',
                creditLimit: 0
            }
        );
    } else {
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return next(new AppError('All online payment details are required', 400));
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || 'GkxKRQ2B0U63BKBoayuugS3D';
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return next(new AppError('Invalid payment signature', 400));
        }
    }

    const previouslySettledAmount = booking.payment?.settledAmount || 0;
    const newSettledAmount = previouslySettledAmount + pendingAmount;
    const totalCollectedRevenue = (booking.pricing?.initialPaidAmount || 0) + newSettledAmount;
    const previousProviderPayout = booking.payment?.providerPayoutAmount || 0;

    const { adminCut, providerPayout } = await commissionHelper.calculatePayout(
        totalCollectedRevenue,
        'sparedriver',
        { overrideRate: getChauffeurCommissionOverride(booking) }
    );
    const payoutDelta = Math.max(0, providerPayout - previousProviderPayout);

    if (payoutDelta > 0 && booking.provider?.id?._id) {
        await executeWalletTransaction(
            booking.provider.id._id,
            payoutDelta,
            'credit',
            {
                category: 'SERVICE_BOOKING',
                description: `Settlement payout for booking ${booking.bookingId || booking._id}`,
                referenceId: `${booking._id.toString()}-settlement`,
                referenceType: 'booking_settlement_payout'
            },
            null,
            SpareDriver
        );
    }

    booking.payment.pendingAmount = 0;
    booking.payment.settledAmount = newSettledAmount;
    booking.payment.status = 'paid';
    booking.payment.settlementStatus = 'paid';
    booking.payment.settlementMethod = paymentMethod;
    booking.payment.settlementTransactionId = paymentMethod === 'online' ? razorpay_payment_id : booking.payment.settlementTransactionId;
    booking.payment.settlementCollectedAt = new Date();
    booking.payment.providerPayoutAmount = providerPayout;
    booking.payment.platformCommissionAmount = adminCut;
    booking.notes = booking.notes || {};
    booking.notes.internal = `${booking.notes.internal || ''}\n[SETTLEMENT_CLOSED] Additional ₹${pendingAmount} settled via ${paymentMethod}.`.trim();
    await booking.save();

    const io = socketService.getIO();
    io.to(booking._id.toString()).emit('booking_status_updated', {
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: 'paid',
        pendingAmount: 0,
        message: 'Additional payment settled successfully.'
    });
    io.to('admin_room').emit('global_status_update', {
        type: 'payment_received',
        bookingId: booking._id,
        amount: pendingAmount,
        paymentStatus: 'paid',
        serviceType: 'sparedriver'
    });

    await Promise.all([
        sendNotification(req.user.id, {
            title: 'Settlement Completed',
            message: `Your additional chauffeur payment of ₹${pendingAmount} has been received successfully.`,
            type: 'payment',
            priority: 'high',
            actionUrl: '/spare-driver/history',
            actionText: 'View Trip',
            metaData: {
                bookingId: booking._id.toString(),
                paymentStatus: 'paid'
            }
        }),
        booking.provider?.id?._id ? sendSpareDriverNotification(booking.provider.id._id, {
            title: 'Settlement Released',
            message: `Additional payout for booking ${booking.bookingId || booking._id} has been settled.`,
            type: 'payout',
            priority: 'medium',
            actionUrl: '/spare-driver/earnings',
            actionText: 'Open Earnings',
            metaData: {
                bookingId: booking._id.toString(),
                payoutDelta
            }
        }) : Promise.resolve()
    ]);

    res.status(200).json({
        status: 'success',
        message: 'Additional settlement paid successfully',
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
