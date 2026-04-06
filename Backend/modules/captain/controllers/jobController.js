const Booking = require('../../../models/Booking');
const Captain = require('../../../models/Captain');
const Portfolio = require('../../../models/Portfolio');
const User = require('../../../models/User');
const Promotion = require('../../../models/Promotion');
const Setting = require('../../../models/Setting');
const WalletTransaction = require('../../../models/WalletTransaction');
const socketService = require('../../../socketService');
const { sendNotification } = require('../../../utils/notificationService');
const { executeWalletTransaction } = require('../../../utils/walletHelper');
const auditHelper = require('../../../utils/auditHelper');
const referralService = require('../../../utils/referralService');

const NON_TERMINAL_ACTIVE_STATUSES = ['accepted', 'en_route', 'arrived', 'before_photo', 'washing', 'after_photo', 'in_progress', 'active'];
const NON_TERMINAL_ASSIGNED_STATUSES = ['confirmed', 'assigned'];
const NON_TERMINAL_STATUSES = [...NON_TERMINAL_ASSIGNED_STATUSES, ...NON_TERMINAL_ACTIVE_STATUSES];

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

const getBookingCapability = (booking = {}) => normalizeCapabilityLabel(
    booking?.vehicle?.typeRef?.type ||
    booking?.vehicle?.typeRef?.name ||
    booking?.vehicle?.type ||
    booking?.vehicleType
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

const filterJobsByCaptainCapability = (jobs = [], captain = null) => {
    if (!captain) return jobs;

    const captainCapability = normalizeCapabilityLabel(captain.profile?.vehicleType);
    if (!captainCapability) return jobs;

    return jobs.filter(job => captainMatchesCapability(captain.profile?.vehicleType, getBookingCapability(job)));
};

const hasValidProofPhoto = (photo) => (
    typeof photo === 'string' &&
    photo.trim().length > 0 &&
    photo.trim() !== 'init'
);

const normalizePhotoMeta = (meta = {}) => {
    if (!meta || typeof meta !== 'object') return null;

    const lat = Number(meta.lat);
    const lng = Number(meta.lng);
    const parsedAt = meta.capturedAt ? new Date(meta.capturedAt) : new Date();

    return {
        capturedAt: Number.isNaN(parsedAt.getTime()) ? new Date() : parsedAt,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        source: meta.source || 'captain-app'
    };
};

const inferPortfolioCategory = (booking) => {
    const serviceDescriptor = `${booking?.service?.name || ''} ${booking?.service?.category || ''}`.toLowerCase();
    if (serviceDescriptor.includes('ceramic')) return 'Ceramic';
    if (serviceDescriptor.includes('interior')) return 'Interior';
    if (serviceDescriptor.includes('ppf')) return 'PPF';
    if (serviceDescriptor.includes('detail')) return 'Detailing';
    return 'Exterior';
};

const isApartmentBooking = (booking) => !!booking?.location?.hubId || booking?.service?.category === 'Apartment';

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

const getConflictSummary = (booking) => {
    const mode = isApartmentBooking(booking) ? 'Apartment Wash' : (booking?.service?.name || 'mission');
    const start = booking?.schedule?.timeSlot?.start || '';
    return start ? `${mode} at ${start}` : mode;
};

const isBlockingMission = (booking, now = new Date()) => {
    if (!booking) return false;

    if (NON_TERMINAL_ACTIVE_STATUSES.includes(booking.status)) return true;
    if (!NON_TERMINAL_ASSIGNED_STATUSES.includes(booking.status)) return false;
    if (booking?.schedule?.type === 'instant') return true;

    const missionStart = parseSlotDateTime(booking?.schedule?.date, booking?.schedule?.timeSlot?.start);
    const missionEnd = parseSlotDateTime(booking?.schedule?.date, booking?.schedule?.timeSlot?.end, 90);
    if (!missionStart) return isApartmentBooking(booking);

    const leadWindowMs = (isApartmentBooking(booking) ? 120 : 45) * 60 * 1000;
    const withinLeadWindow = (missionStart.getTime() - now.getTime()) <= leadWindowMs;
    const insideMissionWindow = missionEnd ? now <= missionEnd : now >= missionStart;

    return withinLeadWindow || insideMissionWindow;
};

const findCaptainBlockingMission = async (captainId) => {
    const candidateMissions = await Booking.find({
        'provider.id': captainId,
        isActive: true,
        status: { $in: NON_TERMINAL_STATUSES }
    })
        .select('status schedule service location')
        .sort({ 'schedule.date': 1, createdAt: 1 })
        .limit(12);

    return candidateMissions.find((mission) => isBlockingMission(mission)) || null;
};

const getBookingCompletionTime = (booking) => (
    booking?.tracking?.completedAt ||
    booking?.payment?.paidAt ||
    booking?.updatedAt ||
    booking?.createdAt
);

const getCaptainPayoutAmount = (booking) => {
    const storedPayout = Number(booking?.payment?.providerPayoutAmount || 0);
    if (storedPayout > 0) return storedPayout;

    const totalAmount = Number(booking?.pricing?.totalAmount || 0);
    const baseAmount = Number(booking?.pricing?.baseAmount || 0);
    const adminCut = Number(
        booking?.payment?.platformCommissionAmount ??
        booking?.payment?.commission ??
        0
    );
    const isApartmentProtocol = !!booking?.location?.hubId || booking?.service?.category === 'Apartment';
    const payoutBaseAmount = booking?.payment?.method === 'subscription' && !isApartmentProtocol
        ? (baseAmount || totalAmount)
        : totalAmount;

    if (booking?.payment?.method === 'subscription' && isApartmentProtocol) {
        return 10;
    }

    if (payoutBaseAmount > 0) {
        return Math.max(Math.round((payoutBaseAmount - adminCut) * 100) / 100, 0);
    }

    return 0;
};

const formatBookingForCaptain = (b) => {
    const consumer = b.consumer && b.consumer.name ? b.consumer : {};
    const vehicle = b.vehicle && b.vehicle.brand ? b.vehicle : {};
    const addr = b.location?.address;
    const addressStr = addr ? [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') : 'Address not set';
    const parkingDetails = b.location?.parkingDetails || {};
    const hubName = b.location?.hubId?.name || '';
    const providerPayoutAmount = getCaptainPayoutAmount(b);
    const apartmentRoute = [parkingDetails.basement, parkingDetails.block, parkingDetails.pillar].filter(Boolean).join(' • ');
    return {
        id: b._id.toString(),
        bookingId: b.bookingId || b._id.toString(),
        serviceName: b.service?.name || 'Car Wash',
        vehicle: vehicle.brand && vehicle.model ? `${vehicle.brand} ${vehicle.model}` : (vehicle.type || 'Vehicle'),
        userName: consumer.name || 'Customer',
        userPhone: consumer.phone || '',
        address: addressStr,
        price: `₹${b.pricing?.totalAmount || 0}`,
        payoutAmount: providerPayoutAmount,
        payoutPrice: `â‚¹${providerPayoutAmount || 0}`,
        status: b.status,
        type: b.service?.type || 'captain',
        service: b.service,
        consumer: b.consumer,
        vehicleInfo: b.vehicle,
        pricing: b.pricing,
        schedule: b.schedule,
        timestamp: getBookingCompletionTime(b),
        landmark: b.location?.landmark,
        isApartment: isApartmentBooking(b),
        hubName,
        apartmentRoute,
        parkingDetails,
        isDoorstepCommitted: !!b.isDoorstepCommitted,
        location: {
            type: b.location?.type,
            coordinates: b.location?.coordinates,
            mapCoordinates: b.location?.address?.coordinates ? {
                lat: b.location.address.coordinates.lat,
                lng: b.location.address.coordinates.lng
            } : null,
            address: b.location?.address,
            landmark: b.location?.landmark,
            instructions: b.location?.instructions,
            hubId: b.location?.hubId,
            parkingDetails
        }
    };
};

exports.getPendingJobs = async (req, res) => {
    try {
        const captainId = req.captain.id;
        const captain = await Captain.findById(captainId);
        if (!captain) return res.status(404).json({ status: 'fail', message: 'Captain not found.' });

        if (!captain.isVerified) {
            return res.status(403).json({
                status: 'fail',
                message: 'Your account is pending verification. You cannot view requests until approved.'
            });
        }

        if (!captain.isOnline) {
            return res.status(200).json({
                status: 'success',
                results: 0,
                data: { jobs: [] }
            });
        }

        const blockingMission = await findCaptainBlockingMission(captainId);
        if (blockingMission) {
            return res.status(200).json({
                status: 'success',
                results: 0,
                data: {
                    jobs: [],
                    blockedBy: {
                        bookingId: blockingMission._id,
                        summary: getConflictSummary(blockingMission),
                        serviceCategory: blockingMission?.service?.category || ''
                    }
                }
            });
        }

        const declinedJobs = captain.declinedJobs || [];

        const query = {
            status: 'pending',
            isActive: true,
            _id: { $nin: declinedJobs },
            $or: [
                { 'service.type': 'captain' },
                { 'provider.type': 'captain' }
            ]
        };

        // Geospatial filtering: Only show jobs within 5km of captain's selected working area
        if (captain.location && captain.location.coordinates &&
            (captain.location.coordinates[0] !== 0 || captain.location.coordinates[1] !== 0)) {
            query['location.address.geoPoint'] = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: captain.location.coordinates
                    },
                    $maxDistance: 5000 // 5km radius
                }
            };
        }

        let findQuery = Booking.find(query)
            .populate('consumer', 'name phone')
            .populate('vehicle', 'brand model type');

        // MongoDB restriction: sort() cannot be used with $near as it already sorts by proximity
        if (!query['location.address.geoPoint']) {
            findQuery = findQuery.sort({ createdAt: -1 });
        }

        const pendingJobs = await findQuery
            .populate('location.hubId', 'name city vendor')
            .populate('vehicle', 'brand model type typeRef');

        const formatted = filterJobsByCaptainCapability(pendingJobs, captain).map(formatBookingForCaptain);

        res.status(200).json({
            status: 'success',
            results: formatted.length,
            data: { jobs: formatted }
        });
    } catch (error) {
        console.error('getPendingJobs error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch pending jobs.' });
    }
};

exports.acceptJob = async (req, res) => {
    try {
        const { id } = req.params;
        const captainId = req.captain?._id || req.auth?.id || req.captain?.id;
        const blockingMission = await findCaptainBlockingMission(captainId);

        if (blockingMission && String(blockingMission._id) !== String(id)) {
            return res.status(403).json({
                status: 'fail',
                message: `Mission Conflict: Finish or clear your current ${getConflictSummary(blockingMission)} before accepting another request.`,
                code: 'MISSION_CONFLICT'
            });
        }

        // Phase 7: Slot Conflict Engine
        // Prevent specialist from accepting an instant job if a scheduled slot is starting soon
        const captain = await Captain.findById(captainId);
        const targetJob = await Booking.findById(id).populate('vehicle', 'brand model type typeRef');
        if (targetJob?.schedule?.type === 'instant') {
            const bufferMinutes = 20; // Re-deployment/Travel buffer
            const estimatedDuration = parseInt(targetJob.service?.duration) || 30; // Default 30 min wash
            const jobEndTime = new Date(Date.now() + (estimatedDuration + bufferMinutes) * 60 * 1000);

            // Find upcoming confirmed scheduled missions for this captain
            const upcomingTask = await Booking.findOne({
                'provider.id': captainId,
                status: 'confirmed',
                'schedule.type': 'scheduled',
                isActive: true,
                'schedule.date': { $gte: new Date() }
            }).sort({ 'schedule.date': 1 });

            if (upcomingTask) {
                // If a scheduled task starts before this instant job can likely finish + buffer
                // Note: Simplified date check for now
                const scheduledTime = new Date(upcomingTask.schedule.date);
                if (scheduledTime < jobEndTime) {
                    return res.status(403).json({
                        status: 'fail',
                        message: `Mission Conflict: This job would overlap with your next scheduled mission at ${upcomingTask.schedule.timeSlot?.start || 'soon'}.`,
                        code: 'SLOT_CONFLICT'
                    });
                }
            }
        }

        const requestedCapability = getBookingCapability(targetJob);
        const captainCapability = normalizeCapabilityLabel(captain?.profile?.vehicleType);
        if (requestedCapability && captainCapability && !captainMatchesCapability(captain.profile?.vehicleType, requestedCapability)) {
            return res.status(403).json({
                status: 'fail',
                message: `Capability mismatch: This ${requestedCapability.toUpperCase()} request is not enabled for your captain profile.`,
                code: 'CAPABILITY_MISMATCH'
            });
        }

        // Atomically update the booking status from 'pending' to 'confirmed'
        // This ensures only one captain can successfully accept the job in a race condition.
        const booking = await Booking.findOneAndUpdate(
            {
                _id: id,
                status: 'pending',
                isActive: true,
                'provider.id': null // Double check it has no provider assigned
            },
            {
                $set: {
                    status: 'confirmed',
                    'provider.id': captainId,
                    'provider.type': 'captain',
                    'tracking.assignedAt': new Date()
                }
            },
            { new: true } // Return the updated document
        ).populate('consumer', 'name phone');

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job no longer available or already accepted by another captain.'
            });
        }

        // Audit Log: Job Accepted
        await auditHelper.logAction({
            userId: captainId,
            action: 'BOOKING_ACCEPTED',
            resource: 'Booking',
            resourceId: booking._id,
            oldValue: { status: 'pending' },
            newValue: { status: 'confirmed', providerId: captainId },
            req
        });

        // Notify via Socket.io (Instantly updates UI from "Finding" to "Tracking")
        try {
            const io = socketService.getIO();
            
            // 1. Specific Booking Room Sync (UI transitions to tracking)
            io.to(booking._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: 'confirmed',
                captain: {
                    name: req.captain.name,
                    phone: req.captain.phone,
                    rating: req.captain.rating,
                    photo: req.captain.photo
                }
            });

            // 2. Consumer Personal Sync (List view updates)
            io.to(booking.consumer._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: 'confirmed',
                message: `Captain ${req.captain.name} has accepted your booking.`,
                updatedFields: { 'provider.id': captainId, 'provider.type': 'captain' }
            });

            // 3. Hub Vendor Sync
            const vendorId = booking.location?.hubId?.vendor;
            if (vendorId) {
                io.to(vendorId.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: 'confirmed',
                    message: `Captain ${req.captain.name} assigned to booking reaching your Hub.`
                });
            }

            // 4. Global Admin Sync
            io.to('admin_room').emit('global_status_update', {
                type: 'captain_assigned',
                bookingId: booking._id,
                captainName: req.captain.name,
                status: 'confirmed'
            });

            // Clear other captains' screens
            io.emit('broadcast_taken', { bookingId: id });
        } catch (socketErr) {
            console.error('Socket notification failed in acceptJob:', socketErr.message);
        }

        // Send notification to consumer
        await sendNotification(booking.consumer._id, {
            title: 'Captain Assigned! 👷',
            message: `Captain ${req.captain.name} has accepted your booking for ${booking.service?.name || 'your wash'}.`,
            type: 'booking',
            priority: 'high',
            metaData: { bookingId: booking._id, captainId: captainId }
        });

        const formatted = formatBookingForCaptain(booking);
        res.status(200).json({
            status: 'success',
            message: 'Job accepted successfully',
            data: { job: formatted }
        });
    } catch (error) {
        console.error('Captain acceptJob error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to accept job.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['confirmed', 'en_route', 'arrived', 'before_photo', 'washing', 'after_photo', 'completed', 'cancelled', 'vehicle_not_available', 'skipped'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'fail',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const booking = await Booking.findOne({
            _id: id,
            'provider.id': req.captain._id,
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found or you are not assigned to it.'
            });
        }

        // Elite Hardening: Prevent skipping statuses
        const statusPriority = { 'confirmed': 1, 'en_route': 2, 'arrived': 3, 'before_photo': 4, 'washing': 5, 'after_photo': 6, 'completed': 7 };
        if (statusPriority[status] > statusPriority[booking.status] + 1 && status !== 'cancelled') {
            // Allow skipping en_route if already arrived, but generally enforce sequence
            // For simplicity in this audit, we'll allow it but warn in logs
            console.log(`Status skip detected: ${booking.status} -> ${status}`);
        }

        // Elite Hardening: Security PIN Verification 
        // Note: Skip PIN for Apartment Wash as it's an unattended service protocol (Consistent with staffController)
        const isApartmentProtocol = !!booking.location?.hubId || booking.service?.category === 'Apartment';
        if (status === 'washing' && (booking.status === 'before_photo' || booking.status === 'arrived') && !isApartmentProtocol) {
            const providedPin = req.body.securityPin || req.body.pin;
            if (!providedPin || providedPin !== booking.securityPin) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'Invalid Security PIN. Please verify the 4-digit PIN with the customer to start the wash.'
                });
            }
        }

        // Elite Hardening: Mandatory Service Proofs (Photos)
        const incomingPhoto = hasValidProofPhoto(req.body.photo) ? req.body.photo.trim() : '';
        const incomingPhotoMeta = normalizePhotoMeta(req.body.photoMeta);

        if (status === 'before_photo' && !incomingPhoto && (!booking.serviceImages?.before?.length)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Before-service photo is mandatory to document vehicle condition.'
            });
        }

        if (status === 'after_photo' && !incomingPhoto && (!booking.serviceImages?.after?.length)) {
            return res.status(400).json({
                status: 'fail',
                message: 'After-service photo is mandatory to verify completion quality.'
            });
        }

        // Store photos if provided
        if (incomingPhoto) {
            if (!booking.serviceImages) booking.serviceImages = { before: [], after: [], beforeMeta: [], afterMeta: [] };
            if (!Array.isArray(booking.serviceImages.beforeMeta)) booking.serviceImages.beforeMeta = [];
            if (!Array.isArray(booking.serviceImages.afterMeta)) booking.serviceImages.afterMeta = [];
            if (status === 'before_photo') {
                booking.serviceImages.before.push(incomingPhoto);
                if (incomingPhotoMeta) booking.serviceImages.beforeMeta.push(incomingPhotoMeta);
            } else if (status === 'after_photo') {
                booking.serviceImages.after.push(incomingPhoto);
                if (incomingPhotoMeta) booking.serviceImages.afterMeta.push(incomingPhotoMeta);
            } else if (status === 'washing' && booking.serviceImages.before.length === 0) {
                // Also allow storing before photo during PIN verification if not already set
                booking.serviceImages.before.push(incomingPhoto);
                if (incomingPhotoMeta) booking.serviceImages.beforeMeta.push(incomingPhotoMeta);
            }
            booking.serviceImages.capturedAt = incomingPhotoMeta?.capturedAt || new Date();
        }

        const oldStatus = booking.status;
        booking.status = status;

        // Audit Log: Status Transition
        await auditHelper.logAction({
            userId: req.captain._id,
            action: `BOOKING_STATUS_${status.toUpperCase()}`,
            resource: 'Booking',
            resourceId: booking._id,
            oldValue: { status: oldStatus },
            newValue: { status },
            req
        });
        if (!booking.tracking) booking.tracking = {};
        if (status === 'en_route') {
            booking.tracking.startedAt = new Date();
        } else if (status === 'arrived') {
            booking.tracking.arrivedAt = new Date();
        } else if (status === 'washing' || status === 'in_progress') {
            booking.tracking.washingStartedAt = new Date();
        } else if (status === 'completed') {
            booking.tracking.completedAt = new Date();
            if (booking.payment) {
                booking.payment.status = 'paid';
                booking.payment.paidAt = new Date();
            }
            
            const amount = booking.pricing?.totalAmount || 0;
            let providerPayout = 0;
            let adminCut = 0;

            if (booking.payment?.method === 'subscription') {
                const isApartmentProtocol = !!booking.location?.hubId || booking.service?.category === 'Apartment';
                if (isApartmentProtocol) {
                    // Apartment HUB protocol: Fixed payout for subscription service
                    providerPayout = 10;
                    adminCut = 0;
                    booking.payment.commission = adminCut;
                } else {
                    // Standard Doorstep Instant Wash Subscription: Standard payout from base price
                    const baseAmount = booking.pricing?.baseAmount || 0;
                    const commissionHelper = require('../../../utils/commissionHelper');
                    const calc = await commissionHelper.calculatePayout(baseAmount, 'captain');
                    providerPayout = calc.providerPayout;
                    adminCut = calc.adminCut;
                    booking.payment.commission = adminCut;
                }
            } else if (amount > 0) {
                // Fetch Dynamic Payout details via helper (Standard Doorstep/Studio flow)
                const commissionHelper = require('../../../utils/commissionHelper');
                const calc = await commissionHelper.calculatePayout(amount, 'captain');
                providerPayout = calc.providerPayout;
                adminCut = calc.adminCut;
                booking.payment.commission = adminCut;
            }

            if (booking.payment) {
                booking.payment.providerPayoutAmount = providerPayout;
                booking.payment.platformCommissionAmount = adminCut;
            }

            if (providerPayout > 0) {
                // 1. Credit Captain Wallet
                await executeWalletTransaction(
                    req.captain._id,
                    providerPayout,
                    'credit',
                    {
                        category: 'SERVICE_BOOKING',
                        description: `Payout for booking ${booking.bookingId || booking._id}${adminCut > 0 ? ` (Commission: ₹${adminCut.toFixed(2)})` : ''}`,
                        referenceId: booking._id.toString(),
                        referenceType: 'booking_payout'
                    },
                    null,
                    Captain
                );

                // --- Referral Reward Logic (Phase 4) ---
                await referralService.processReferralReward(booking.consumer, booking._id);
            }

            const shouldPublishToPortfolio = (
                booking.service?.type === 'captain' &&
                !isApartmentProtocol &&
                Array.isArray(booking.serviceImages?.before) &&
                booking.serviceImages.before.length > 0 &&
                Array.isArray(booking.serviceImages?.after) &&
                booking.serviceImages.after.length > 0
            );

            if (shouldPublishToPortfolio) {
                const vehicleLabel = [booking.vehicle?.brand, booking.vehicle?.model].filter(Boolean).join(' ').trim() || 'Vehicle';
                await Portfolio.findOneAndUpdate(
                    { bookingId: booking._id },
                    {
                        bookingId: booking._id,
                        category: inferPortfolioCategory(booking),
                        title: booking.service?.name || 'Instant Wash Transformation',
                        vehicle: vehicleLabel,
                        description: `Clean2Wash transformation completed on ${new Date().toLocaleDateString('en-IN')}`,
                        beforeImg: booking.serviceImages.before[0],
                        afterImg: booking.serviceImages.after[0],
                        singleImage: false,
                        isActive: true,
                        sortOrder: 0
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
        } else if (status === 'vehicle_not_available') {
            booking.notes.internal = 'Specialist reported vehicle not available at the location.';
            booking.notes.provider = req.body.reason || 'Vehicle not found at designated parking.';
        } else if (status === 'skipped') {
            booking.notes.internal = 'Specialist reported user skipped the service locally.';
            booking.notes.provider = req.body.reason || 'Apartment wash skipped by local request.';
        }
        await booking.save();

        // ➕ Phase 3: Global Notification Sync (Ecosystem Synchronization)
        
        // 1. Sync for specific booking room (for everyone currently viewing this job)
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status,
            tracking: booking.tracking
        });

        // 2. Sync for Consumer (User) personal room
        if (booking.consumer) {
            io.to(booking.consumer.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: booking.status,
                tracking: booking.tracking,
                message: `Booking status changed to ${booking.status}`
            });
        }

        // 3. Sync for Vendor personal room (via Hub for Apartment/Staff job categories)
        // Note: Populate the vendor field if not already present
        const populatedBooking = await Booking.findById(booking._id).populate({
            path: 'location.hubId',
            select: 'vendor name'
        });

        const vendorId = populatedBooking?.location?.hubId?.vendor;
        if (vendorId) {
            io.to(vendorId.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: booking.status,
                tracking: booking.tracking,
                message: `Captain ${req.captain.name} updated task at ${populatedBooking.location.hubId.name} to: ${booking.status}`
            });
        }

        // 4. Sync for Global Admin protocol
        io.to('admin_room').emit('global_status_update', {
            type: 'task_update',
            bookingId: booking._id,
            status: booking.status,
            staffName: req.captain.name
        });

        // Send notification to consumer on status change
        let notifTitle = '';
        let notifMsg = '';
        let priority = 'medium';

        if (status === 'en_route') {
            notifTitle = 'Captain En Route! 🚚';
            notifMsg = 'Captain is on the way to your location.';
        } else if (status === 'washing' || status === 'in_progress') {
            notifTitle = 'Wash Started ✨';
            notifMsg = 'Your car wash has officially started.';
        } else if (status === 'completed') {
            notifTitle = 'Your Car is Clean! ✨';
            notifMsg = 'Captain has finished the wash. Order is complete.';
            priority = 'high';
        } else if (status === 'cancelled') {
            notifTitle = 'Booking Cancelled';
            notifMsg = 'Your booking was cancelled. If payment was made, it will be refunded.';
        } else if (status === 'vehicle_not_available') {
            notifTitle = 'Vehicle Not Found 🔍';
            notifMsg = 'Specialist could not find your vehicle at the location.';
            priority = 'high';
        } else if (status === 'skipped') {
            notifTitle = 'Wash Skipped ⏭️';
            notifMsg = 'Today\'s wash session was skipped as requested.';
        }

        if (notifTitle) {
            await sendNotification(booking.consumer, {
                title: notifTitle,
                message: notifMsg,
                type: 'booking',
                priority,
                metaData: { bookingId: booking._id, status }
            });
        }

        const populated = await Booking.findById(booking._id)
            .populate('consumer', 'name phone')
            .populate('vehicle', 'brand model type');
        const formatted = formatBookingForCaptain(populated);

        res.status(200).json({
            status: 'success',
            message: `Job status updated to ${status}`,
            data: { job: formatted }
        });
    } catch (error) {
        console.error('Captain updateJobStatus error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update job status.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getMyJob = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findOne({
            _id: id,
            'provider.id': req.captain.id,
            isActive: true
        })
            .populate('consumer', 'name phone')
            .populate('vehicle', 'brand model type plate')
            .populate('location.hubId', 'name city vendor');

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found.'
            });
        }

        const formatted = formatBookingForCaptain(booking);
        res.status(200).json({
            status: 'success',
            data: { job: formatted }
        });
    } catch (error) {
        console.error('Captain getMyJob error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch job.'
        });
    }
};

exports.getMyJobs = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const filter = { 'provider.id': req.captain.id, isActive: true };
        if (status) filter.status = status;

        const jobs = await Booking.find(filter)
            .populate('consumer', 'name phone')
            .populate('vehicle', 'brand model type plate')
            .populate('location.hubId', 'name city vendor')
            .sort({
                'schedule.date': 1,
                'location.parkingDetails.basement': 1,
                'location.parkingDetails.block': 1,
                'location.parkingDetails.pillar': 1,
                createdAt: -1
            })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(filter);
        const formatted = jobs.map(formatBookingForCaptain);

        res.status(200).json({
            status: 'success',
            results: formatted.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: { jobs: formatted }
        });
    } catch (error) {
        console.error('Captain getMyJobs error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch jobs.'
        });
    }
};

exports.getEarnings = async (req, res) => {
    try {
        const captainId = req.captain.id;

        const completed = await Booking.find({
            'provider.id': captainId,
            status: 'completed',
            isActive: true
        }).populate('consumer', 'name').populate('vehicle', 'brand model type');

        const totalEarned = completed.reduce((sum, b) => sum + getCaptainPayoutAmount(b), 0);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayEarned = completed
            .filter(b => getBookingCompletionTime(b) >= startOfToday)
            .reduce((s, b) => s + getCaptainPayoutAmount(b), 0);
        const weekEarned = completed
            .filter(b => getBookingCompletionTime(b) >= startOfWeek)
            .reduce((s, b) => s + getCaptainPayoutAmount(b), 0);
        const monthEarned = completed
            .filter(b => getBookingCompletionTime(b) >= startOfMonth)
            .reduce((s, b) => s + getCaptainPayoutAmount(b), 0);

        const captain = await Captain.findById(captainId);
        const walletBalance = (captain?.wallet?.balance || 0);

        res.status(200).json({
            status: 'success',
            data: {
                today: { earned: todayEarned, jobs: completed.filter(b => getBookingCompletionTime(b) >= startOfToday).length },
                week: { earned: weekEarned, jobs: completed.filter(b => getBookingCompletionTime(b) >= startOfWeek).length },
                month: { earned: monthEarned, jobs: completed.filter(b => getBookingCompletionTime(b) >= startOfMonth).length },
                total: totalEarned,
                walletBalance,
                recentJobs: completed.slice(0, 5).map(b => ({
                    id: b._id,
                    serviceName: b.service?.name || 'Car Wash',
                    userName: b.consumer?.name || 'Customer',
                    amount: getCaptainPayoutAmount(b),
                    price: `₹${getCaptainPayoutAmount(b) || 0}`,
                    grossAmount: b.pricing?.totalAmount || 0,
                    createdAt: getBookingCompletionTime(b)
                }))
            }
        });
    } catch (error) {
        console.error('Captain getEarnings error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch earnings.'
        });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { tab = 'All', page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const filter = { 'provider.id': req.captain.id, isActive: true };
        if (tab === 'Completed') filter.status = 'completed';
        else if (tab === 'Cancelled') filter.status = 'cancelled';
        else filter.status = { $in: ['completed', 'cancelled'] };

        const jobs = await Booking.find(filter)
            .populate('consumer', 'name phone')
            .populate('vehicle', 'brand model type')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(filter);
        const formatted = jobs.map(formatBookingForCaptain);

        res.status(200).json({
            status: 'success',
            results: formatted.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: { jobs: formatted }
        });
    } catch (error) {
        console.error('Captain getHistory error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch history.'
        });
    }
};

exports.withdrawPayout = async (req, res) => {
    try {
        const { amount, bankDetails } = req.body;
        const captainId = req.captain._id || req.captain.id;
        const captain = await Captain.findById(captainId);

        if (!captain) return res.status(404).json({ status: 'fail', message: 'Captain not found.' });

        const balance = captain.wallet.balance || 0;
        const withdrawAmount = parseFloat(amount);

        if (!withdrawAmount || withdrawAmount < 500) {
            return res.status(400).json({ status: 'fail', message: 'Minimum withdrawal is ₹500.' });
        }

        if (withdrawAmount > balance) {
            console.warn(`Insufficient balance for withdrawal. Captain: ${captainId}, Request: ${withdrawAmount}, Balance: ${balance}`);
            return res.status(400).json({
                status: 'fail',
                message: `Insufficient balance. Current: ₹${balance.toFixed(2)}, Requested: ₹${withdrawAmount.toFixed(2)}`
            });
        }

        const payoutDetails = {
            upiId: bankDetails?.upiId || captain.bankDetails?.upiId,
            accountNumber: bankDetails?.accountNumber || captain.bankDetails?.accountNumber,
            bankName: bankDetails?.bankName || captain.bankDetails?.bankName
        };

        const targetRef = payoutDetails.upiId ? `UPI: ${payoutDetails.upiId}` : `Bank: ${payoutDetails.accountNumber || 'Stored'}`;

        // 1. Atomic Debit & Create Record (Status PENDING Override)
        const result = await executeWalletTransaction(
            captainId,
            withdrawAmount,
            'debit',
            {
                category: 'WITHDRAWAL',
                description: `Settlement Request via ${targetRef}`,
                referenceId: `WD-CAP-${Date.now()}`,
                referenceType: 'withdrawal',
                paymentMethod: 'bank',
                metaData: { bankDetails, requestedAt: new Date() }
            },
            null,
            Captain
        );

        // Update transaction to pending (helper defaults to completed)
        result.transaction.status = 'pending';
        await result.transaction.save();

        res.status(200).json({
            status: 'success',
            message: 'Withdrawal request submitted for admin approval.',
            data: { transaction: result.transaction }
        });
    } catch (error) {
        console.error('Captain withdrawPayout error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process withdrawal.' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const captainId = req.captain._id;
        const captain = await Captain.findById(captainId);

        const completed = await Booking.find({
            'provider.id': captainId,
            status: 'completed',
            isActive: true
        })
            .select('pricing.totalAmount pricing.baseAmount payment.providerPayoutAmount payment.platformCommissionAmount payment.commission payment.method tracking.completedAt createdAt updatedAt service consumer vehicle location')
            .populate('consumer', 'name')
            .populate('vehicle', 'brand model type')
            .populate('location.hubId', 'name city vendor');

        const pending = captain.isOnline ? await Booking.find({
            status: 'pending',
            isActive: true,
            $or: [{ 'service.type': 'captain' }, { 'provider.type': 'captain' }]
        }).limit(10).populate('consumer', 'name').populate('vehicle', 'brand model type typeRef') : [];

        const myActive = await Booking.find({
            'provider.id': captainId,
            status: { $in: NON_TERMINAL_STATUSES },
            isActive: true
        })
            .populate('consumer', 'name phone')
            .populate('vehicle', 'brand model type')
            .populate('location.hubId', 'name city vendor')
            .sort({
                'schedule.date': 1,
                'location.parkingDetails.basement': 1,
                'location.parkingDetails.block': 1,
                'location.parkingDetails.pillar': 1,
                createdAt: -1
            });

        const blockingMission = await findCaptainBlockingMission(captainId);
        const visiblePending = blockingMission ? [] : filterJobsByCaptainCapability(pending, captain).slice(0, 5);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayJobs = completed.filter(b => getBookingCompletionTime(b) >= startOfToday);
        const weekJobs = completed.filter(b => getBookingCompletionTime(b) >= startOfWeek);
        const monthJobs = completed.filter(b => getBookingCompletionTime(b) >= startOfMonth);

        const todayEarned = todayJobs.reduce((s, b) => s + getCaptainPayoutAmount(b), 0);
        const weekEarned = weekJobs.reduce((s, b) => s + getCaptainPayoutAmount(b), 0);
        const monthEarned = monthJobs.reduce((s, b) => s + getCaptainPayoutAmount(b), 0);

        const totalEarned = completed.reduce((s, b) => s + getCaptainPayoutAmount(b), 0);
        const walletBalance = captain?.wallet?.balance || 0;

        res.status(200).json({
            status: 'success',
            data: {
                captain: {
                    id: captain._id,
                    name: captain.name,
                    rating: captain.rating,
                    isOnline: captain.isOnline,
                    isVerified: captain.isVerified,
                    location: captain.location
                },
                stats: {
                    completedJobs: completed.length,
                    totalEarned,
                    walletBalance,
                    rating: captain?.rating || 5.0,
                    today: { earned: todayEarned, jobs: todayJobs.length },
                    week: { earned: weekEarned, jobs: weekJobs.length },
                    month: { earned: monthEarned, jobs: monthJobs.length }
                },
                pendingJobs: visiblePending.map(b => formatBookingForCaptain(b)),
                activeJobs: myActive.map(b => formatBookingForCaptain(b)),
                activeJob: myActive[0] ? formatBookingForCaptain(myActive[0]) : null,
                recentCompleted: completed.slice(0, 5).map(b => formatBookingForCaptain(b)),
                availabilityBlock: blockingMission ? {
                    bookingId: blockingMission._id,
                    summary: getConflictSummary(blockingMission),
                    serviceCategory: blockingMission?.service?.category || ''
                } : null
            }
        });
    } catch (error) {
        console.error('Captain getDashboard error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard.' });
    }
};

exports.toggleOnline = async (req, res) => {
    try {
        const { isOnline } = req.body;
        const captainId = req.captain?._id || req.auth?.id;

        const captain = await Captain.findById(captainId);
        if (!captain) return res.status(404).json({ status: 'fail', message: 'Captain not found.' });
        captain.isOnline = typeof isOnline === 'boolean' ? isOnline : !captain.isOnline;
        await captain.save();
        res.status(200).json({
            status: 'success',
            data: { isOnline: captain.isOnline }
        });
    } catch (error) {
        console.error('Captain toggleOnline error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update status.' });
    }
};

exports.declineJob = async (req, res) => {
    try {
        const { id } = req.params;
        const captainId = req.captain.id;

        const booking = await Booking.findOne({ _id: id, status: 'pending' });
        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Job not found or already assigned.' });
        }

        await Captain.findByIdAndUpdate(captainId, {
            $addToSet: { declinedJobs: id }
        });

        res.status(200).json({
            status: 'success',
            message: 'Job declined successfully'
        });
    } catch (error) {
        console.error('Captain declineJob error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to decline job.' });
    }
};

exports.commitToScheduledJob = async (req, res) => {
    try {
        const { id } = req.params;
        const captainId = req.captain?._id || req.auth?.id;

        const booking = await Booking.findOne({
            _id: id,
            'provider.id': captainId,
            status: 'confirmed',
            'schedule.type': 'scheduled'
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Scheduled job not found or not assigned to you.'
            });
        }

        booking.isDoorstepCommitted = true;
        booking.activityLog.push({
            status: 'committed',
            description: 'Captain confirmed availability for doorstep mission.'
        });

        await booking.save();

        res.status(200).json({
            status: 'success',
            message: 'Commitment confirmed. Please arrive on time!',
            data: { isDoorstepCommitted: true }
        });
    } catch (error) {
        console.error('Captain commitToScheduledJob error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to confirm commitment.' });
    }
};
