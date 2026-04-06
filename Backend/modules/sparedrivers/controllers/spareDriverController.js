const SpareDriver = require('../../../models/SpareDriver');
const Booking = require('../../../models/Booking');
const User = require('../../../models/User');
const Setting = require('../../../models/Setting');
const WalletTransaction = require('../../../models/WalletTransaction');
const Notification = require('../../../models/Notification');
const commissionHelper = require('../../../utils/commissionHelper');
const { getIO } = require('../../../socketService');
const cloudinary = require('../../../utils/cloudinary');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendSpareDriverNotification, sendAdminNotification, sendNotification } = require('../../../utils/notificationService');
const {
    appendBookingActivityLog,
    broadcastBookingToDrivers,
    hasDriverRejectedBooking
} = require('../../../utils/spareDriverDispatch');
const { executeWalletTransaction, adjustWalletHold } = require('../../../utils/walletHelper');

const CHAUFFEUR_DISPATCH_LEAD_MINUTES = 15;

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

const getSocketIO = () => {
    try {
        return getIO();
    } catch (error) {
        return null;
    }
};

const getActorRole = (req) => req.auth?.role || req.user?.role || 'sparedriver';
const isDriverOperational = (driver) => driver?.status === 'active';

const getChauffeurCommercialRules = (booking = {}) => {
    const rules = booking?.service?.metadata?.commercialRules || {};
    return {
        waitingGraceMinutes: Number.isFinite(Number(rules.waitingGraceMinutes)) ? Number(rules.waitingGraceMinutes) : 15,
        waitChargePerMinute: Number.isFinite(Number(rules.waitChargePerMinute)) ? Number(rules.waitChargePerMinute) : 2,
        overtimeGraceMinutes: Number.isFinite(Number(rules.overtimeGraceMinutes)) ? Number(rules.overtimeGraceMinutes) : 15,
        extensionRatePerHour: Number.isFinite(Number(rules.extensionRatePerHour)) ? Number(rules.extensionRatePerHour) : null,
        nightAllowance: Number.isFinite(Number(rules.nightAllowance)) ? Number(rules.nightAllowance) : 300,
        outstationAllowancePerDay: Number.isFinite(Number(rules.outstationAllowancePerDay)) ? Number(rules.outstationAllowancePerDay) : 500,
        commissionPercent: Number.isFinite(Number(rules.commissionPercent)) ? Number(rules.commissionPercent) : null
    };
};

const getChauffeurCommissionOverride = (booking = {}) => {
    const rate = Number(booking?.service?.metadata?.commercialRules?.commissionPercent);
    return Number.isFinite(rate) && rate >= 0 ? rate : null;
};

const parseBookedDurationHours = (durationValue = '', fallbackHours = 1) => {
    const matchedHours = String(durationValue || '').match(/(\d+)/);
    const hours = matchedHours ? parseInt(matchedHours[1], 10) : fallbackHours;
    return Number.isFinite(hours) && hours > 0 ? hours : fallbackHours;
};

const getHeldReserveAmount = (booking = {}) => Math.max(0, Number(booking.payment?.walletReserveHeldAmount || 0));

const releaseChauffeurReserve = async (booking, reason = 'reserve released') => {
    const heldAmount = getHeldReserveAmount(booking);
    if (!heldAmount || booking.service?.type !== 'sparedriver') {
        return 0;
    }

    await adjustWalletHold(
        booking.consumer?._id || booking.consumer,
        heldAmount,
        'release',
        {
            category: 'REFUND',
            description: `Wallet reserve released for chauffeur booking #${booking.bookingId || booking._id}`,
            referenceId: `${booking._id.toString()}-reserve-release-${booking.payment?.walletReserveReleasedAmount || 0}`,
            referenceType: 'booking_wallet_reserve_release',
            metaData: { reason }
        }
    );

    booking.payment.walletReserveHeldAmount = 0;
    booking.payment.walletReserveReleasedAmount = Number(booking.payment?.walletReserveReleasedAmount || 0) + heldAmount;
    booking.payment.walletReserveStatus = 'released';
    booking.payment.walletReserveReleasedAt = new Date();

    return heldAmount;
};

const consumeChauffeurReserve = async (booking, amount, reason = 'reserve consumed') => {
    const heldAmount = getHeldReserveAmount(booking);
    const captureAmount = Math.min(heldAmount, Math.max(0, Number(amount || 0)));

    if (!captureAmount || booking.service?.type !== 'sparedriver') {
        return 0;
    }

    await adjustWalletHold(
        booking.consumer?._id || booking.consumer,
        captureAmount,
        'consume',
        {
            category: 'SERVICE_BOOKING',
            description: `Wallet reserve consumed for chauffeur booking #${booking.bookingId || booking._id}`,
            referenceId: `${booking._id.toString()}-reserve-consume-${booking.payment?.walletReserveConsumedAmount || 0}`,
            referenceType: 'booking_wallet_reserve_consume',
            metaData: { reason }
        }
    );

    booking.payment.walletReserveHeldAmount = heldAmount - captureAmount;
    booking.payment.walletReserveConsumedAmount = Number(booking.payment?.walletReserveConsumedAmount || 0) + captureAmount;
    booking.payment.walletReserveStatus = booking.payment.walletReserveHeldAmount > 0 ? 'partially_consumed' : 'consumed';

    return captureAmount;
};
const clearDriverAssignment = (booking) => {
    booking.provider = {
        type: 'sparedriver',
        model: 'SpareDriver',
        id: null,
        name: '',
        phone: '',
        rating: undefined,
        photo: ''
    };
};

const releaseBookingBackToPool = async ({ booking, driverId, reason, releaseStatus }) => {
    const releaseMessage = reason || 'Driver is unavailable for this trip.';
    const dispatchReady = isDispatchReadySchedule(booking.schedule);

    booking.status = 'pending';
    clearDriverAssignment(booking);
    booking.notes = booking.notes || {};
    booking.notes.provider = releaseMessage;
    booking.tracking = booking.tracking || {};
    booking.tracking.assignedAt = null;
    booking.tracking.startedAt = null;
    booking.tracking.arrivedAt = null;

    appendBookingActivityLog(
        booking,
        releaseStatus,
        releaseMessage,
        {
            driverId: driverId.toString(),
            reason: releaseMessage
        }
    );

    const dispatch = dispatchReady
        ? await broadcastBookingToDrivers(booking, {
            excludeDriverIds: [driverId],
            reason: releaseStatus,
            notificationMessage: 'A chauffeur request has been reopened near your location.'
        })
        : {
            driverCount: 0,
            radiusMeters: 0,
            excludedDriverIds: [driverId.toString()],
            driverIds: []
        };

    const io = getSocketIO();
    if (io) {
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: 'pending',
            message: dispatchReady
                ? (dispatch.driverCount > 0
                    ? 'Finding another driver for your trip.'
                    : 'No alternate driver found yet. We are still searching nearby.')
                : 'Your trip is back in the scheduled queue. Driver matching will resume closer to departure.',
            dispatchState: dispatchReady ? 'reassigning' : 'scheduled_hold'
        });
    }

    await sendNotification(booking.consumer?._id || booking.consumer, {
        title: dispatchReady ? 'Searching Another Driver' : 'Trip Returned to Schedule',
        message: dispatchReady
            ? (dispatch.driverCount > 0
                ? 'Your current driver is unavailable. We are assigning another verified driver now.'
                : 'Your current driver is unavailable. We are still searching for another verified driver.')
            : 'Your current driver is unavailable. Your trip is safe in the scheduled queue and matching will resume closer to the start time.',
        type: 'booking',
        priority: 'high',
        actionUrl: '/spare-driver',
        actionText: 'Track Search',
        metaData: {
            bookingId: booking._id.toString(),
            status: 'pending',
            dispatchState: dispatchReady ? 'reassigning' : 'scheduled_hold'
        }
    });

    return dispatch;
};

const populateAdminBooking = (bookingQuery) => (
    bookingQuery
        .populate('consumer', 'name phone email profile')
        .populate('vehicle', 'brand model type plate')
        .populate('provider.id', 'name phone status isOnline currentLocation')
);

const emitAdminBookingRefresh = (booking, payload = {}) => {
    const io = getSocketIO();
    if (!io || !booking?._id) return;

    if (payload.message) {
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status,
            message: payload.message,
            dispatchState: payload.dispatchState
        });
    }

    io.to('admin_room').emit('global_status_update', {
        type: 'spare_driver_booking_update',
        bookingId: booking._id,
        status: booking.status,
        providerId: booking.provider?.id?._id || booking.provider?.id || null,
        dispatchState: payload.dispatchState || null,
        adminAction: payload.adminAction || null
    });
};

const appendInternalAdminNote = (booking, note) => {
    if (!note || !note.trim()) return;
    booking.notes = booking.notes || {};
    booking.notes.internal = `${booking.notes.internal || ''}\n[ADMIN] ${note.trim()}`.trim();
};

const processAdminCancellationRefund = async (booking, reason) => {
    if (booking.service?.type === 'sparedriver') {
        await releaseChauffeurReserve(booking, reason || 'admin_cancelled');
    }

    if (booking.payment?.status !== 'paid') return;

    const refundAmount = booking.pricing?.totalAmount || 0;

    if (booking.payment.method === 'wallet') {
        await executeWalletTransaction(
            booking.consumer,
            refundAmount,
            'credit',
            {
                category: 'REFUND',
                description: `Admin refund for cancelled booking: #${booking.bookingId || booking._id}`,
                referenceId: booking._id,
                referenceType: 'booking'
            }
        );
        booking.payment.status = 'refunded';
    } else if (booking.payment.method === 'subscription') {
        const Subscription = require('../../../models/Subscription');
        const activeSubscription = await Subscription.getActiveSubscription(booking.consumer, {
            service: booking.service || {},
            hub: booking.location?.hubId || null,
            location: booking.location || {},
            destination: booking.location?.destination || null
        });
        if (activeSubscription) {
            await activeSubscription.addCredits(1);
        }
        booking.payment.status = 'refunded';
    } else {
        booking.payment.status = 'refund_pending';
    }

    booking.payment.refundAmount = refundAmount;
    booking.payment.refundedAt = new Date();
    appendInternalAdminNote(
        booking,
        reason
            ? `Refund prepared after admin cancellation. Reason: ${reason}`
            : 'Refund prepared after admin cancellation.'
    );
};
// 🚨 SOS Emergency Protocol (Phase 4 Hardening) 🚨
exports.reportEmergency = async (req, res) => {
    try {
        const { bookingId, reason, latitude, longitude } = req.body;
        const driverId = getDriverIdFromRequest(req);
        const actorRole = getActorRole(req);

        const booking = await Booking.findById(bookingId).populate('consumer', 'name phone');
        if (!booking) return res.status(404).json({ status: 'fail', message: 'Booking context missing' });

        booking.issues = booking.issues || [];
        booking.issues.push({
            type: 'SOS',
            description: reason || `Emergency raised by ${actorRole}`,
            status: 'open'
        });
        appendBookingActivityLog(booking, 'sos_alert', 'Emergency alert raised from spare driver module.', {
            actorRole,
            reason: reason || 'Not specified',
            latitude,
            longitude,
            driverId: driverId ? driverId.toString() : ''
        });
        await booking.save({ validateBeforeSave: false });

        // 1. Log incident in audit & security log
        const securityNote = `SOS ALERT: Triggered by ${actorRole} for Booking #${bookingId}. Reason: ${reason || 'Not specified'}. Location: [${latitude}, ${longitude}]`;
        console.error(securityNote);

        // 2. Immediate Broadcast to Admin Room
        const io = getSocketIO();
        if (io) {
            io.to('admin_room').emit('SOS_EMERGENCY_ALERT', {
                bookingId,
                actor: actorRole,
                location: { lat: latitude, lng: longitude },
                consumer: booking.consumer?.name,
                phone: booking.consumer?.phone,
                timestamp: new Date()
            });
        }

        await sendAdminNotification({
            title: 'Spare Driver SOS Alert',
            message: `Emergency raised for booking ${booking.bookingId || bookingId}. Immediate review required.`,
            type: 'sos',
            priority: 'urgent',
            actionUrl: '/admin/spare-drivers',
            actionText: 'Open Driver Desk',
            metaData: {
                bookingId,
                actor: actorRole,
                consumer: booking.consumer?.name,
                latitude,
                longitude
            }
        });

        // 3. Notify Emergency Contacts (Future integration)
        // ... mailer or SMS integration here

        res.status(200).json({
            status: 'success',
            message: 'SOS Alert received. Emergency protocols activated.'
        });

    } catch (err) {
        console.error('SOS Protocol Failure:', err);
        res.status(500).json({ status: 'error', message: 'Emergency dispatch failed' });
    }
};

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const getDriverIdFromRequest = (req) => req.spareDriver?.id || req.user?.id;

// ── Ensure upload directory exists ──
const UPLOAD_DIR = path.join(__dirname, '../../../uploads/sparedrivers');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config: store locally, allow images only ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${getDriverIdFromRequest(req) || 'unknown'}_${file.fieldname}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic/;
    const isOk = allowed.test(path.extname(file.originalname).toLowerCase()) &&
        allowed.test(file.mimetype);
    if (isOk) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, webp)'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB per file
});

exports.upload = upload; // expose for route use

// ── JWT helper ──
const signToken = (id) => jwt.sign(
    { id, role: 'sparedriver' },
    process.env.JWT_SECRET || 'secret-jwt-key-for-carwash',
    { expiresIn: '90d' }
);

// ── Register ──
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const existingDriver = await SpareDriver.findOne({ phone });
        if (existingDriver) {
            return res.status(409).json({
                status: 'fail',
                message: 'This phone number is already registered. Please sign in instead.'
            });
        }

        const newDriver = await SpareDriver.create({ name, email, phone, password });
        const token = signToken(newDriver._id);
        res.status(201).json({
            status: 'success',
            token,
            data: {
                driver: {
                    id: newDriver._id,
                    name: newDriver.name,
                    email: newDriver.email,
                    phone: newDriver.phone,
                    status: newDriver.status
                }
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Phone number and password are required'
            });
        }

        const driver = await SpareDriver.findOne({ phone }).select('+password');
        if (!driver) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid phone number or password'
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, driver.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid phone number or password'
            });
        }

        if (['rejected', 'suspended'].includes(driver.status)) {
            return res.status(403).json({
                status: 'fail',
                message: driver.adminNote || 'Your account is not active. Please contact support.'
            });
        }

        const token = signToken(driver._id);
        driver.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: { driver }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Upload Documents (Cloudinary) ──
exports.uploadDocuments = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        if (!driverId) {
            return res.status(401).json({ status: 'fail', message: 'Unauthorized request' });
        }

        const files = req.files; // { aadhaarCard, drivingLicense, selfie }

        if (!files?.aadhaarCard || !files?.drivingLicense || !files?.selfie) {
            return res.status(400).json({
                status: 'fail',
                message: 'All three documents are required: aadhaarCard, drivingLicense, selfie'
            });
        }

        // Upload to Cloudinary
        const uploadFile = async (fileArray) => {
            const filePath = fileArray[0].path;
            try {
                const result = await cloudinary.uploadImage(filePath, `clean2wash/sparedrivers/${driverId}`);
                try { fs.unlinkSync(filePath); } catch (e) { }
                return result.secure_url;
            } catch (uploadError) {
                console.warn('Falling back to local spare driver document storage:', uploadError.message);
                return `${req.protocol}://${req.get('host')}/uploads/sparedrivers/${path.basename(filePath)}`;
            }
        };

        const aadhaarUrl = await uploadFile(files.aadhaarCard);
        const dlUrl = await uploadFile(files.drivingLicense);
        const selfieUrl = await uploadFile(files.selfie);

        const driver = await SpareDriver.findByIdAndUpdate(
            driverId,
            {
                'documents.aadhaarCard.url': aadhaarUrl,
                'documents.drivingLicense.url': dlUrl,
                'documents.selfie.url': selfieUrl,
                status: 'pending_verification'
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Documents uploaded to cloud. Pending admin verification.',
            data: { driver }
        });

        await Promise.all([
            sendSpareDriverNotification(driverId, {
                title: 'Documents Submitted',
                message: 'Your KYC documents are under review. We will notify you once verification is complete.',
                type: 'verification',
                priority: 'high',
                actionUrl: '/spare-driver/profile',
                actionText: 'View Profile',
                metaData: { status: 'pending_verification' }
            }),
            sendAdminNotification({
                title: 'Spare Driver Review Pending',
                message: `${driver?.name || 'A spare driver'} has submitted documents for verification.`,
                type: 'verification',
                priority: 'high',
                actionUrl: '/admin/spare-drivers',
                actionText: 'Review Driver',
                metaData: { driverId, status: 'pending_verification' }
            })
        ]);
    } catch (err) {
        console.error('Doc Upload Error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Get own profile ──
exports.getProfile = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const driver = await SpareDriver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }
        res.status(200).json({ status: 'success', data: { driver } });
    } catch (err) {
        res.status(404).json({ status: 'fail', message: 'Driver not found' });
    }
};

// ── Admin: List all drivers (with optional status filter) ──
exports.adminListDrivers = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const drivers = await SpareDriver.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: drivers.length, data: { drivers } });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Admin: Verify / Reject a driver ──
exports.adminVerifyDriver = async (req, res) => {
    try {
        const { status, adminNote } = req.body; // status: 'active' | 'rejected'
        const allowed = ['active', 'rejected', 'suspended'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid status' });
        }

        const update = { status, adminNote };
        if (status !== 'active') {
            update.isOnline = false;
        }

        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        const io = getSocketIO();
        if (io) {
            io.to(driver._id.toString()).emit('driver_verification_updated', {
                driverId: driver._id,
                status: driver.status,
                adminNote: driver.adminNote
            });
        }

        await sendSpareDriverNotification(driver._id, {
            title: status === 'active' ? 'Account Approved' : 'Verification Updated',
            message: status === 'active'
                ? 'Your spare driver account is live now. Go online to receive bookings.'
                : (adminNote || `Your account status has been updated to ${status}.`),
            type: 'verification',
            priority: status === 'active' ? 'high' : 'medium',
            actionUrl: status === 'active' ? '/spare-driver/dashboard' : '/spare-driver/profile',
            actionText: status === 'active' ? 'Open Dashboard' : 'View Profile',
            metaData: { status, adminNote: adminNote || '' }
        });

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Get Bookings assigned to this spare driver ──
exports.getBookings = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const driver = await SpareDriver.findById(driverId).select('status isOnline');
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        const bookingQuery = {
            isActive: true,
            status: { $nin: ['completed', 'cancelled', 'refunded'] },
            $or: [
                {
                    'provider.id': driverId,
                    'provider.type': 'sparedriver'
                }
            ]
        };

        if (driver.status === 'active' && driver.isOnline) {
            bookingQuery.$or.push({
                status: 'pending',
                'service.type': 'sparedriver',
                'provider.id': null
            });
        }

        const bookings = await Booking.find(bookingQuery)
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .sort({ createdAt: -1 });

        const filteredBookings = bookings.filter((booking) => {
            if (booking.status !== 'pending') return true;

            const assignedDriverId = booking.provider?.id?._id?.toString?.() || booking.provider?.id?.toString?.() || '';
            if (assignedDriverId === driverId.toString()) return true;

            return !hasDriverRejectedBooking(booking, driverId) && isDispatchReadySchedule(booking.schedule);
        });

        res.status(200).json({
            status: 'success',
            data: { bookings: filteredBookings }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Get Trip History (Completed/Cancelled) ──
exports.getTripHistory = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const bookings = await Booking.find({
            'provider.id': driverId,
            'provider.type': 'sparedriver',
            status: { $in: ['completed', 'cancelled'] }
        })
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            status: 'success',
            data: { bookings }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Accept a booking ──
exports.acceptBooking = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const driver = await SpareDriver.findById(driverId).select('status isOnline');
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        if (!isDriverOperational(driver)) {
            return res.status(403).json({
                status: 'fail',
                message: 'Complete verification before accepting trips'
            });
        }

        if (!driver.isOnline) {
            return res.status(400).json({
                status: 'fail',
                message: 'Go online before accepting a booking'
            });
        }

        const booking = await Booking.findOneAndUpdate(
            {
                _id: req.params.id,
                isActive: true,
                'service.type': 'sparedriver',
                status: 'pending',
                $or: [
                    { 'provider.id': null },
                    { 'provider.id': driverId, 'provider.type': 'sparedriver' }
                ]
            },
            {
                $set: {
                    status: 'en_route',
                    'provider.id': driverId,
                    'provider.type': 'sparedriver',
                    'tracking.assignedAt': new Date()
                }
            },
            { new: true }
        );
        if (!booking) return res.status(404).json({ status: 'fail', message: 'Booking not found or already accepted' });

        appendBookingActivityLog(booking, 'sparedriver_accepted', 'Booking accepted by spare driver.', {
            driverId: driverId.toString()
        });
        await booking.save({ validateBeforeSave: false });

        // 🛡️ Elite Handover Protocol: Reveal OTP to Consumer via Socket
        try {
            const io = getSocketIO();
            if (io) {
                // 1. Notify Consumer Room (Private)
                io.to(booking.consumer.toString()).emit('otp_revealed', {
                    bookingId: booking._id,
                    pin: booking.securityPin
                });

                // 2. Notify Booking Room (Sync UI)
                io.to(booking._id.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: 'en_route',
                    pin: booking.securityPin // Also include in status update for immediate reveal
                });
            }
        } catch (socketErr) {
            console.error('Handover Pulse Failed:', socketErr.message);
        }

        await sendSpareDriverNotification(driverId, {
            title: 'Booking Accepted',
            message: `You accepted booking ${booking.bookingId || booking._id}. Head to the pickup point now.`,
            type: 'booking',
            priority: 'high',
            actionUrl: '/spare-driver/bookings',
            actionText: 'Open Booking',
            metaData: {
                bookingId: booking._id.toString(),
                status: 'en_route'
            }
        });

        res.status(200).json({ status: 'success', data: { booking } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Update live location (Throttled for battery) ──
exports.rejectBooking = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { reason } = req.body || {};

        const driver = await SpareDriver.findById(driverId).select('status isOnline');
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        if (!isDriverOperational(driver) || !driver.isOnline) {
            return res.status(403).json({
                status: 'fail',
                message: 'Go online with an approved account before rejecting trip requests'
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            isActive: true,
            'service.type': 'sparedriver',
            status: 'pending'
        }).populate('consumer', 'name phone');

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found or no longer available' });
        }

        if (hasDriverRejectedBooking(booking, driverId)) {
            return res.status(200).json({
                status: 'success',
                message: 'Booking already rejected for this driver',
                data: { booking }
            });
        }

        appendBookingActivityLog(
            booking,
            'sparedriver_rejected',
            reason || 'Booking rejected by spare driver.',
            {
                driverId: driverId.toString(),
                reason: reason || 'Rejected by spare driver'
            }
        );

        const dispatch = await broadcastBookingToDrivers(booking, {
            excludeDriverIds: [driverId],
            reason: 'driver_rejected',
            notificationMessage: 'A chauffeur request has been reassigned near your location.'
        });

        const io = getSocketIO();
        if (io) {
            io.to(booking._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: 'pending',
                message: dispatch.driverCount > 0
                    ? 'Your driver request has been reassigned to another nearby driver.'
                    : 'A driver declined the request. We are still searching for another driver.',
                dispatchState: 'reassigning'
            });
        }

        await Promise.all([
            sendSpareDriverNotification(driverId, {
                title: 'Request Rejected',
                message: 'This request was removed from your queue.',
                type: 'booking',
                priority: 'medium',
                actionUrl: '/spare-driver/bookings',
                actionText: 'View More Jobs',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'rejected'
                }
            }),
            sendNotification(booking.consumer?._id || booking.consumer, {
                title: 'Searching Another Driver',
                message: dispatch.driverCount > 0
                    ? 'A nearby driver is reviewing your request now.'
                    : 'One driver declined your request. We are still searching nearby.',
                type: 'booking',
                priority: 'high',
                actionUrl: '/spare-driver',
                actionText: 'Track Search',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'pending',
                    dispatchState: 'reassigning'
                }
            })
        ]);

        res.status(200).json({
            status: 'success',
            message: dispatch.driverCount > 0
                ? 'Booking rejected and reassigned successfully'
                : 'Booking rejected. No alternate drivers found yet.',
            data: {
                booking,
                dispatch
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminAssignBooking = async (req, res) => {
    try {
        const { driverId, adminNote } = req.body || {};

        if (!driverId) {
            return res.status(400).json({ status: 'fail', message: 'A spare driver must be selected' });
        }

        const [booking, nextDriver] = await Promise.all([
            populateAdminBooking(Booking.findOne({
                _id: req.params.id,
                isActive: true,
                'service.type': 'sparedriver',
                status: { $nin: ['completed', 'cancelled', 'refunded'] }
            })),
            SpareDriver.findById(driverId).select('name phone status isOnline currentLocation')
        ]);

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        if (!nextDriver || nextDriver.status !== 'active' || !nextDriver.isOnline) {
            return res.status(400).json({
                status: 'fail',
                message: 'Only verified online spare drivers can be manually assigned'
            });
        }

        if (booking.status === 'active') {
            return res.status(400).json({
                status: 'fail',
                message: 'An active trip cannot be reassigned from admin desk'
            });
        }

        const previousDriverId = booking.provider?.id?._id?.toString?.() || booking.provider?.id?.toString?.() || '';
        const isSameDriver = previousDriverId && previousDriverId === driverId.toString();

        booking.provider = {
            type: 'sparedriver',
            model: 'SpareDriver',
            id: nextDriver._id,
            name: nextDriver.name,
            phone: nextDriver.phone,
            photo: ''
        };
        booking.status = 'pending';
        booking.tracking = booking.tracking || {};
        booking.tracking.assignedAt = new Date();
        appendInternalAdminNote(booking, adminNote);
        appendBookingActivityLog(
            booking,
            isSameDriver ? 'admin_reconfirmed_driver' : 'admin_assigned_driver',
            isSameDriver
                ? 'Admin reconfirmed the current spare driver assignment.'
                : 'Admin manually assigned a spare driver to the booking.',
            {
                driverId: nextDriver._id.toString(),
                driverName: nextDriver.name,
                adminNote: adminNote || ''
            }
        );
        await booking.save({ validateBeforeSave: false });

        if (previousDriverId && previousDriverId !== nextDriver._id.toString()) {
            await sendSpareDriverNotification(previousDriverId, {
                title: 'Trip Reassigned',
                message: `Booking ${booking.bookingId || booking._id} has been reassigned by admin.`,
                type: 'booking',
                priority: 'medium',
                actionUrl: '/spare-driver/bookings',
                actionText: 'Open Jobs',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'reassigned'
                }
            });
        }

        await Promise.all([
            sendSpareDriverNotification(nextDriver._id, {
                title: 'Admin Assignment',
                message: 'A chauffeur trip has been reserved for you. Review and accept the booking.',
                type: 'booking',
                priority: 'high',
                actionUrl: '/spare-driver/bookings',
                actionText: 'Open Booking',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'pending',
                    dispatchState: 'manual_assignment'
                }
            }),
            sendNotification(booking.consumer?._id || booking.consumer, {
                title: 'Driver Reserved',
                message: 'Our operations team has reserved a verified driver for your trip. Final acceptance is in progress.',
                type: 'booking',
                priority: 'high',
                actionUrl: '/spare-driver',
                actionText: 'Track Booking',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'pending',
                    dispatchState: 'manual_assignment'
                }
            })
        ]);

        emitAdminBookingRefresh(booking, {
            message: 'Admin reserved a driver for this booking.',
            dispatchState: 'manual_assignment',
            adminAction: 'assign_driver'
        });

        const refreshedBooking = await populateAdminBooking(Booking.findById(booking._id));

        res.status(200).json({
            status: 'success',
            message: 'Driver assigned successfully',
            data: { booking: refreshedBooking }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminReleaseBooking = async (req, res) => {
    try {
        const { reason } = req.body || {};
        const booking = await populateAdminBooking(Booking.findOne({
            _id: req.params.id,
            isActive: true,
            'service.type': 'sparedriver',
            status: { $nin: ['completed', 'cancelled', 'refunded'] }
        }));

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        if (booking.status === 'active') {
            return res.status(400).json({
                status: 'fail',
                message: 'An active trip cannot be returned to the queue'
            });
        }

        const previousDriverId = booking.provider?.id?._id?.toString?.() || booking.provider?.id?.toString?.() || null;
        const dispatch = await releaseBookingBackToPool({
            booking,
            driverId: previousDriverId || 'admin',
            reason: reason || 'Admin released this trip back to the queue.',
            releaseStatus: 'admin_released'
        });
        appendInternalAdminNote(booking, reason);
        await booking.save({ validateBeforeSave: false });

        if (previousDriverId) {
            await sendSpareDriverNotification(previousDriverId, {
                title: 'Trip Released by Admin',
                message: 'Operations removed this booking from your active queue.',
                type: 'booking',
                priority: 'medium',
                actionUrl: '/spare-driver/bookings',
                actionText: 'View Jobs',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'released'
                }
            });
        }

        emitAdminBookingRefresh(booking, {
            message: dispatch.driverCount > 0
                ? 'Admin returned this trip to the nearby driver pool.'
                : 'Admin released this trip, but no alternate drivers are online right now.',
            dispatchState: 'reassigning',
            adminAction: 'release_booking'
        });

        const refreshedBooking = await populateAdminBooking(Booking.findById(booking._id));

        res.status(200).json({
            status: 'success',
            message: dispatch.driverCount > 0
                ? 'Booking released and reassignment started'
                : 'Booking released. No alternate drivers found yet.',
            data: { booking: refreshedBooking, dispatch }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminCancelBooking = async (req, res) => {
    try {
        const { reason } = req.body || {};
        const booking = await populateAdminBooking(Booking.findOne({
            _id: req.params.id,
            isActive: true,
            'service.type': 'sparedriver',
            status: { $nin: ['completed', 'cancelled', 'refunded'] }
        }));

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        booking.status = 'cancelled';
        appendInternalAdminNote(booking, reason || 'Booking cancelled by admin operations.');
        appendBookingActivityLog(booking, 'admin_cancelled', 'Booking cancelled by admin desk.', {
            reason: reason || 'Cancelled by admin'
        });
        await processAdminCancellationRefund(booking, reason);
        await booking.save({ validateBeforeSave: false });

        await Promise.all([
            sendNotification(booking.consumer?._id || booking.consumer, {
                title: 'Trip Cancelled by Support',
                message: reason || 'Your spare driver booking was cancelled by our operations team.',
                type: 'booking',
                priority: 'high',
                actionUrl: '/spare-driver',
                actionText: 'Review Booking',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'cancelled'
                }
            }),
            booking.provider?.id ? sendSpareDriverNotification(booking.provider.id._id || booking.provider.id, {
                title: 'Trip Cancelled',
                message: 'Operations cancelled this booking. No further action is needed.',
                type: 'booking',
                priority: 'medium',
                actionUrl: '/spare-driver/bookings',
                actionText: 'View Jobs',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'cancelled'
                }
            }) : Promise.resolve()
        ]);

        emitAdminBookingRefresh(booking, {
            message: reason || 'Booking cancelled by support.',
            adminAction: 'cancel_booking'
        });

        res.status(200).json({
            status: 'success',
            message: 'Booking cancelled successfully',
            data: { booking }
        });
    } catch (err) {
        console.error('Admin chauffeur cancellation failed:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminUpdateBookingIssue = async (req, res) => {
    try {
        const { issueId, status, adminNote } = req.body || {};
        const allowedStatuses = ['open', 'investigating', 'resolved', 'dismissed'];

        if (!issueId || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Issue id and a valid issue status are required'
            });
        }

        const booking = await populateAdminBooking(Booking.findOne({
            _id: req.params.id,
            isActive: true,
            'service.type': 'sparedriver'
        }));

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        const issue = booking.issues?.id(issueId) || booking.issues?.find((entry) => entry._id?.toString() === issueId);
        if (!issue) {
            return res.status(404).json({ status: 'fail', message: 'Issue not found' });
        }

        issue.status = status;
        appendInternalAdminNote(
            booking,
            adminNote
                ? `Issue ${issueId.slice(-6)} marked ${status}. ${adminNote}`
                : `Issue ${issueId.slice(-6)} marked ${status}.`
        );
        appendBookingActivityLog(booking, 'admin_issue_updated', 'Admin updated a chauffeur booking issue.', {
            issueId,
            issueType: issue.type,
            status,
            adminNote: adminNote || ''
        });
        await booking.save({ validateBeforeSave: false });

        await sendNotification(booking.consumer?._id || booking.consumer, {
            title: status === 'resolved' ? 'Issue Resolved' : 'Support Ticket Updated',
            message: status === 'resolved'
                ? 'Our support team resolved your chauffeur trip issue.'
                : `Your chauffeur trip issue is now marked as ${status}.`,
            type: 'support',
            priority: 'medium',
            actionUrl: '/spare-driver/support',
            actionText: 'View Support',
            metaData: {
                bookingId: booking._id.toString(),
                issueId,
                status
            }
        });

        emitAdminBookingRefresh(booking, {
            adminAction: 'update_issue'
        });

        res.status(200).json({
            status: 'success',
            message: 'Issue updated successfully',
            data: { booking }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const driverId = getDriverIdFromRequest(req);

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ status: 'fail', message: 'Latitude and longitude are required' });
        }

        // Throttling: Check if driver exists and when they last updated
        const driver = await SpareDriver.findById(driverId);
        if (!driver) return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        if (!isDriverOperational(driver)) {
            return res.status(403).json({ status: 'fail', message: 'Only verified drivers can share live location' });
        }

        // Throttling: Check status to determine frequency
        const activeTrip = await Booking.findOne({
            'provider.id': driverId,
            'provider.type': 'sparedriver',
            status: { $in: ['en_route', 'arrived', 'active'] }
        });

        // SOP Protocol: 10s for active/en-route trips, 30s for idle online drivers
        const throttleLimit = activeTrip ? 10000 : 30000;
        
        const lastUpdate = driver.updatedAt || 0;
        const diff = Date.now() - new Date(lastUpdate).getTime();
        if (diff < throttleLimit) {
            return res.status(200).json({
                status: 'success',
                message: 'Update skipped (throttled)',
                data: { location: driver.currentLocation }
            });
        }

        driver.currentLocation = {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
        };
        await driver.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            data: { location: driver.currentLocation }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Toggle online status ──
exports.toggleOnline = async (req, res) => {
    try {
        const { isOnline } = req.body;
        const driverId = getDriverIdFromRequest(req);

        const driver = await SpareDriver.findById(driverId);
        if (!driver) return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        if (isOnline && !isDriverOperational(driver)) {
            return res.status(403).json({
                status: 'fail',
                message: 'Your account must be verified before going online'
            });
        }

        driver.isOnline = Boolean(isOnline);
        await driver.save({ validateBeforeSave: false });

        res.status(200).json({ status: 'success', data: { isOnline: driver.isOnline } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Cancel a booking ──
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const driverId = getDriverIdFromRequest(req);

        const booking = await Booking.findOne({
            _id: id,
            isActive: true,
            'provider.id': driverId,
            'provider.type': 'sparedriver',
            status: { $in: ['en_route', 'arrived'] }
        }).populate('consumer', 'name phone');

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found or cannot be cancelled now' });
        }

        const dispatch = await releaseBookingBackToPool({
            booking,
            driverId,
            reason: reason || 'Driver cancelled before trip start.',
            releaseStatus: 'sparedriver_cancelled'
        });

        await sendSpareDriverNotification(driverId, {
            title: 'Trip Released',
            message: dispatch.driverCount > 0
                ? 'The trip has been returned to the queue and reassignment has started.'
                : 'The trip has been released. No alternate drivers were found yet.',
            type: 'booking',
            priority: 'medium',
            actionUrl: '/spare-driver/bookings',
            actionText: 'View Bookings',
            metaData: {
                bookingId: booking._id.toString(),
                status: 'pending',
                dispatchState: 'reassigning'
            }
        });

        res.status(200).json({
            status: 'success',
            message: dispatch.driverCount > 0
                ? 'Trip released and reassignment started'
                : 'Trip released. No alternate drivers found yet.',
            data: {
                booking,
                dispatch
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};


// ── Update booking status ──
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, pin } = req.body;
        const driverId = getDriverIdFromRequest(req);

        const booking = await Booking.findOne({
            _id: id,
            isActive: true,
            'provider.id': driverId,
            'provider.type': 'sparedriver'
        });
        if (!booking) return res.status(404).json({ status: 'fail', message: 'Booking not found or not assigned to you' });

        // 🛡️ Hardening: Transition Guards
        const currentStatus = booking.status;
        const validTransitions = {
            'en_route': ['arrived', 'cancelled'],
            'arrived': ['active', 'cancelled'],
            'active': ['completed'],
            'completed': [],
            'pending': ['en_route', 'cancelled']
        };

        if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                status: 'fail',
                message: `Invalid status transition: ${currentStatus} -> ${status}`
            });
        }

        // 🔐 Phase 2: Security Handover (PIN Verification)
        if (status === 'active') {
            if (!pin || pin !== booking.securityPin) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'Invalid Security PIN. Please verify with the customer.'
                });
            }
            booking.tracking = booking.tracking || {};
            const commercialRules = getChauffeurCommercialRules(booking);
            
            // 🕊️ Phase 11: Waiting Charge Calculation 🕊️
            if (booking.tracking.arrivedAt) {
                const waitMs = new Date() - new Date(booking.tracking.arrivedAt);
                const waitMins = Math.floor(waitMs / (1000 * 60));
                const freeWaitMins = commercialRules.waitingGraceMinutes;
                if (waitMins > freeWaitMins) {
                    const extraWait = waitMins - freeWaitMins;
                    const waitCharge = extraWait * commercialRules.waitChargePerMinute;
                    booking.pricing.totalAmount += waitCharge;
                    booking.pricing.breakdown = booking.pricing.breakdown || [];
                    booking.pricing.breakdown.push({ name: 'Waiting Charge', amount: waitCharge, type: 'surcharge' });
                    booking.notes.internal = `${booking.notes.internal || ''}\n[WAITING] Client delayed by ${waitMins}m. Charge: ₹${waitCharge}`.trim();
                }
            }
            booking.tracking.startedAt = new Date();
        }

        if (status === 'arrived') {
            booking.tracking = booking.tracking || {};
            booking.tracking.arrivedAt = new Date();
        }

        if (status === 'completed') {
            booking.tracking = booking.tracking || {};
            booking.tracking.completedAt = new Date();
            const commercialRules = getChauffeurCommercialRules(booking);

            // 💎 Phase 8 Hardening: Trip Extension & Arrears Engine 💎
            let finalPrice = booking.pricing?.totalAmount || 0;
            const isChauffeur = booking.service?.category === 'Chauffeur' || booking.service?.type === 'sparedriver';
            const normalizedServiceName = (booking.service?.name || '').toLowerCase();
            const isHourly = isChauffeur && (
                normalizedServiceName.includes('hourly') ||
                normalizedServiceName.includes('full day') ||
                normalizedServiceName.includes('outstation') ||
                normalizedServiceName.includes('point')
            );
            
            if (isHourly && booking.tracking.startedAt) {
                const actualDurationMs = booking.tracking.completedAt - booking.tracking.startedAt;
                
                // Parse booked duration from string (e.g. "4 Hours" -> 4)
                let bookedDurationHrs = 1;
                const serviceName = normalizedServiceName;
                const durationStr = String(booking.service?.duration || '').toLowerCase();

                if (serviceName.includes('outstation')) {
                    bookedDurationHrs = parseBookedDurationHours(durationStr, 24);
                } else if (serviceName.includes('full day')) {
                    bookedDurationHrs = parseBookedDurationHours(durationStr, 8);
                } else {
                    const match = durationStr.match(/(\d+)/);
                    if (match) {
                        bookedDurationHrs = parseInt(match[1]);
                    }
                }

                // 🛡️ Phase 2 Hardening: 15-Minute Grace Period Pulse 🛡️
                const bookedDurationMs = bookedDurationHrs * 60 * 60 * 1000;
                const gracePeriodMs = commercialRules.overtimeGraceMinutes * 60 * 1000;

                if (actualDurationMs > (bookedDurationMs + gracePeriodMs)) {
                    const actualDurationHrs = Math.max(1, Math.ceil(actualDurationMs / (1000 * 60 * 60)));
                    const extraHrs = actualDurationHrs - bookedDurationHrs;
                    
                    // Derived hourly rate from the original total amount paid
                    const hourlyRate = commercialRules.extensionRatePerHour
                        || Math.round((booking.pricing.initialPaidAmount || booking.pricing.totalAmount) / bookedDurationHrs)
                        || 180;
                    const extensionFee = extraHrs * hourlyRate;
                    
                    // 🏨 Phase 12: Multi-Day Outstation Allowance Engine 🏨
                    if (normalizedServiceName.includes('outstation')) {
                        const extraDays = Math.floor(extraHrs / 24);
                        if (extraDays > 0) {
                            const extraAllowance = extraDays * commercialRules.outstationAllowancePerDay;
                            finalPrice += extraAllowance;
                            booking.pricing.breakdown.push({ name: `Stay & Food (Day ${extraDays + 1}+)`, amount: extraAllowance, type: 'arrears' });
                            booking.notes.internal = `${booking.notes.internal || ''}\n[AUTO-ALOWANCE] Multi-day outstation detected. Added ₹${extraAllowance} for ${extraDays} extra nights.`.trim();
                        }
                    }

                    finalPrice += extensionFee;
                    
                    booking.pricing.totalAmount = finalPrice;
                    booking.pricing.breakdown = booking.pricing.breakdown || [];
                    booking.pricing.breakdown.push({ name: `Trip Extension (${extraHrs}h)`, amount: extensionFee, type: 'arrears' });
                    booking.notes.internal = `${booking.notes.internal || ''}\n[ARREARS] Trip extended by ${extraHrs}h. Extension Fee: ₹${extensionFee} (Rate: ₹${hourlyRate}/h).`.trim();
                }
            }

            // 🌙 Phase 11: Real-World Night Allowance Sync 🌙
            // If trip ends in night hours (11 PM - 5 AM) and no Night Allowance was charged yet
            const completeHour = new Date(booking.tracking.completedAt).getHours();
            const isNightEnd = completeHour >= 23 || completeHour < 5;
            const hasNightAllowance = (booking.pricing.breakdown || []).some(b => b.name?.includes('Night Shift Allowance')) || 
                                     booking.notes.internal?.includes('Night Shift Allowance');

            if (isNightEnd && !hasNightAllowance) {
                const nightAllowance = commercialRules.nightAllowance;
                finalPrice += nightAllowance;
                booking.pricing.totalAmount = finalPrice;
                booking.notes.internal = `${booking.notes.internal || ''}\n[NIGHT] Trip ended late (${completeHour}:00). Night Shift Allowance added: ₹${nightAllowance}`.trim();
                booking.pricing.breakdown = booking.pricing.breakdown || [];
                booking.pricing.breakdown.push({ name: 'Night Shift Allowance (Sync)', amount: nightAllowance, type: 'surcharge' });
            }

            booking.payment = booking.payment || {};

            const initialPaidAmount = booking.pricing?.initialPaidAmount || finalPrice;
            const extraSettlementAmount = Math.max(0, finalPrice - initialPaidAmount);
            let settledAdditionalAmount = 0;
            let pendingSettlementAmount = 0;
            let settlementStatus = 'not_required';
            let settlementMethod = '';
            const driver = await SpareDriver.findById(driverId);
            const consumer = await User.findById(booking.consumer);

            if (extraSettlementAmount > 0 && consumer) {
                const reserveCapturedAmount = await consumeChauffeurReserve(
                    booking,
                    extraSettlementAmount,
                    'trip_extra_usage'
                );
                settledAdditionalAmount += reserveCapturedAmount;
                const remainingSettlementAmount = Math.max(0, extraSettlementAmount - reserveCapturedAmount);
                try {
                    if (remainingSettlementAmount > 0) {
                        await executeWalletTransaction(
                            consumer._id,
                            remainingSettlementAmount,
                            'debit',
                            {
                                category: 'SERVICE_CHARGE',
                                description: `Auto settlement for chauffeur overage on #${booking.bookingId || booking._id}`,
                                referenceId: `${booking._id.toString()}-wallet-settlement`,
                                referenceType: 'booking_settlement',
                                creditLimit: -500
                            }
                        );
                        settledAdditionalAmount += remainingSettlementAmount;
                    }
                    settlementStatus = 'auto_collected';
                    settlementMethod = reserveCapturedAmount > 0 && remainingSettlementAmount > 0
                        ? 'wallet+reserve'
                        : (reserveCapturedAmount > 0 ? 'reserve' : 'wallet');
                    booking.notes.internal = `${booking.notes.internal || ''}\n[AUTO-SETTLEMENT] Extra ₹${extraSettlementAmount} settled automatically.${reserveCapturedAmount > 0 ? ` Reserve used: ₹${reserveCapturedAmount}.` : ''}${remainingSettlementAmount > 0 ? ` Wallet debit: ₹${remainingSettlementAmount}.` : ''}`.trim();
                } catch (walletError) {
                    pendingSettlementAmount = Math.max(0, extraSettlementAmount - settledAdditionalAmount);
                    settlementStatus = pendingSettlementAmount > 0 ? 'pending' : 'auto_collected';
                    settlementMethod = settledAdditionalAmount > 0 ? 'reserve_partial' : '';
                    booking.notes.internal = `${booking.notes.internal || ''}\n[SETTLEMENT_PENDING] Auto wallet settlement could not recover the full extra amount of ₹${extraSettlementAmount}. ${walletError.message}`.trim();
                }
            } else if (getHeldReserveAmount(booking) > 0) {
                await releaseChauffeurReserve(booking, 'trip_completed_without_extra');
            }

            if (getHeldReserveAmount(booking) > 0) {
                await releaseChauffeurReserve(booking, 'unused_trip_reserve_release');
            }

            booking.payment.pendingAmount = pendingSettlementAmount;
            booking.payment.settledAmount = settledAdditionalAmount;
            booking.payment.settlementStatus = settlementStatus;
            booking.payment.settlementMethod = settlementMethod;
            booking.payment.status = pendingSettlementAmount > 0 ? 'settlement_pending' : 'paid';
            booking.payment.paidAt = booking.payment.paidAt || new Date();

            // 💰 Controlled payout: only release payout against collected revenue.
            const settledRevenueAmount = initialPaidAmount + settledAdditionalAmount;
            if (settledRevenueAmount > 0 && driver) {
                const { adminCut, providerPayout } = await commissionHelper.calculatePayout(
                    settledRevenueAmount,
                    'sparedriver',
                    { overrideRate: getChauffeurCommissionOverride(booking) }
                );

                await executeWalletTransaction(
                    driver._id,
                    providerPayout,
                    'credit',
                    {
                        category: 'SERVICE_BOOKING',
                        description: `Payout for booking ${booking.bookingId || booking._id} (Collected revenue: ₹${settledRevenueAmount})`,
                        referenceId: booking._id.toString(),
                        referenceType: 'booking_payout'
                    },
                    null,
                    SpareDriver
                );

                booking.payment.providerPayoutAmount = providerPayout;
                booking.payment.platformCommissionAmount = adminCut;
            }
        }

        booking.status = status;
        await booking.save();
        await booking.populate('consumer', 'name phone');

        // Notify via Socket
        try {
            const io = getSocketIO();
            if (io) {
                // 1. Notify Booking Room (Consumer & Driver)
                io.to(booking._id.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: booking.status,
                    paymentStatus: booking.payment?.status,
                    pendingAmount: booking.payment?.pendingAmount || 0
                });

                // 2. Notify Admin Control Tower
                io.to('admin_room').emit('global_status_update', {
                    type: 'task_update',
                    bookingId: booking._id,
                    status: booking.status,
                    userName: booking.consumer?.name || 'Customer',
                    serviceType: 'sparedriver',
                    paymentStatus: booking.payment?.status
                });
            }
        } catch (e) {
            console.error('Socket notification failed:', e.message);
        }

        const notificationMessages = {
            arrived: 'You have marked the driver trip as arrived.',
            active: 'Trip has started successfully.',
            completed: booking.payment?.status === 'settlement_pending'
                ? 'Trip completed. Base payout synced and the remaining balance is waiting for customer settlement.'
                : 'Trip completed and earnings synced to your wallet.'
        };

        if (notificationMessages[status]) {
            await sendSpareDriverNotification(driverId, {
                title: status === 'completed' ? 'Trip Completed' : 'Trip Updated',
                message: notificationMessages[status],
                type: status === 'completed' ? 'payout' : 'booking',
                priority: status === 'completed' ? 'high' : 'medium',
                actionUrl: status === 'completed' ? '/spare-driver/earnings' : '/spare-driver/bookings',
                actionText: status === 'completed' ? 'Open Earnings' : 'Open Booking',
                metaData: {
                    bookingId: booking._id.toString(),
                    status
                }
            });
        }

        if (status === 'completed') {
            await sendNotification(booking.consumer?._id || booking.consumer, {
                title: booking.payment?.status === 'settlement_pending' ? 'Additional Payment Required' : 'Trip Completed',
                message: booking.payment?.status === 'settlement_pending'
                    ? `Your trip is complete. Please settle the additional ${booking.payment?.pendingAmount || 0} to close billing.`
                    : 'Your chauffeur trip has been completed successfully.',
                type: 'payment',
                priority: booking.payment?.status === 'settlement_pending' ? 'high' : 'medium',
                actionUrl: '/spare-driver/history',
                actionText: booking.payment?.status === 'settlement_pending' ? 'Pay Balance' : 'View Trip',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: booking.status,
                    paymentStatus: booking.payment?.status,
                    pendingAmount: booking.payment?.pendingAmount || 0
                }
            });
        }

        res.status(200).json({ status: 'success', data: { booking } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Get financial transactions ──
exports.getTransactions = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { page = 1, limit = 20 } = req.query;

        const result = await WalletTransaction.getUserTransactions(driverId, {
            page,
            limit,
            category: 'SERVICE_BOOKING'
        });

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Notifications ──
exports.getNotifications = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 20,
            type: req.query.type,
            isRead: req.query.isRead
        };

        const result = await Notification.getSpareDriverNotifications(driverId, options);
        res.status(200).json({ status: 'success', data: result });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const driverId = getDriverIdFromRequest(req);

        if (id === 'all') {
            await Notification.markAllAsReadForSpareDriver(driverId);
        } else {
            const notification = await Notification.findOne({ _id: id, spareDriver: driverId });
            if (!notification) return res.status(404).json({ status: 'fail', message: 'Notification not found' });
            await notification.markAsRead();
        }

        res.status(200).json({ status: 'success', message: 'Notification(s) marked as read' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.clearNotifications = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        await Notification.clearAllForSpareDriver(driverId);
        res.status(200).json({ status: 'success', message: 'Notifications cleared successfully' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Toggle online status ──
// Update FCM Token for push notifications (Phase 2 Hardening)
exports.updateFCMToken = async (req, res) => {
    try {
        const { token, platform } = req.body;

        if (!token) {
            return res.status(400).json({
                status: 'fail',
                message: 'FCM token is required'
            });
        }

        const driverId = getDriverIdFromRequest(req);
        const driver = await SpareDriver.findById(driverId);

        if (!driver) {
            return res.status(404).json({
                status: 'fail',
                message: 'SpareDriver not found'
            });
        }

        if (!driver.fcmTokens) driver.fcmTokens = [];

        const existingTokenIndex = driver.fcmTokens.findIndex(t => t.token === token);

        if (existingTokenIndex > -1) {
            driver.fcmTokens[existingTokenIndex].lastUsed = new Date();
            if (platform) driver.fcmTokens[existingTokenIndex].platform = platform;
        } else {
            driver.fcmTokens.push({
                token,
                platform: platform || 'unknown',
                lastUsed: new Date()
            });
        }

        if (driver.fcmTokens.length > 3) {
            driver.fcmTokens.sort((a, b) => b.lastUsed - a.lastUsed);
            driver.fcmTokens = driver.fcmTokens.slice(0, 3);
        }

        await driver.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'FCM token registered successfully'
        });

    } catch (error) {
        console.error('Error updating SpareDriver FCM token:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update FCM token'
        });
    }
};
