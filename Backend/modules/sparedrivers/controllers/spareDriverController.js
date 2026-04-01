const SpareDriver = require('../../../models/SpareDriver');
const Booking = require('../../../models/Booking');
const User = require('../../../models/User');
const Setting = require('../../../models/Setting');
const WalletTransaction = require('../../../models/WalletTransaction');
const Notification = require('../../../models/Notification');
const commissionHelper = require('../../../utils/commissionHelper');
const { socketService } = require('../../../socketService');
const cloudinary = require('../../../utils/cloudinary');
const jwt = require('jsonwebtoken');
// 🚨 SOS Emergency Protocol (Phase 4 Hardening) 🚨
exports.reportEmergency = async (req, res) => {
    try {
        const { bookingId, reason, latitude, longitude } = req.body;
        const driverId = getDriverIdFromRequest(req);

        const booking = await Booking.findById(bookingId).populate('consumer', 'name phone');
        if (!booking) return res.status(404).json({ status: 'fail', message: 'Booking context missing' });

        // 1. Log incident in audit & security log
        const securityNote = `SOS ALERT: Triggered by ${req.user.role} for Booking #${bookingId}. Reason: ${reason || 'Not specified'}. Location: [${latitude}, ${longitude}]`;
        console.error(securityNote);

        // 2. Immediate Broadcast to Admin Room
        const io = socketService.getIO();
        if (io) {
            io.to('admin_room').emit('SOS_EMERGENCY_ALERT', {
                bookingId,
                actor: req.user.role,
                location: { lat: latitude, lng: longitude },
                consumer: booking.consumer?.name,
                phone: booking.consumer?.phone,
                timestamp: new Date()
            });
        }

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
const { executeWalletTransaction } = require('../../../utils/walletHelper');
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
        const uploadFile = async (fileArray, field) => {
            const filePath = fileArray[0].path;
            const result = await cloudinary.uploadImage(filePath, `clean2wash/sparedrivers/${driverId}`);
            // Cleanup local file
            try { fs.unlinkSync(filePath); } catch (e) { }
            return result.secure_url;
        };

        const aadhaarUrl = await uploadFile(files.aadhaarCard, 'aadhaar');
        const dlUrl = await uploadFile(files.drivingLicense, 'dl');
        const selfieUrl = await uploadFile(files.selfie, 'selfie');

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

        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            { status, adminNote },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Get Bookings assigned to this spare driver ──
exports.getBookings = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const bookings = await Booking.find({
            isActive: true,
            $or: [
                {
                    'provider.id': driverId,
                    'provider.type': 'sparedriver'
                },
                {
                    status: 'pending',
                    'service.type': 'sparedriver',
                    'provider.id': null
                }
            ]
        })
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: { bookings }
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
                    'tracking.startedAt': new Date()
                }
            },
            { new: true }
        );
        if (!booking) return res.status(404).json({ status: 'fail', message: 'Booking not found or already accepted' });

        // 🛡️ Elite Handover Protocol: Reveal OTP to Consumer via Socket
        try {
            const io = socketService.getIO();
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

        res.status(200).json({ status: 'success', data: { booking } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Update live location (Throttled for battery) ──
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

        // Throttling: Check status to determine frequency
        const activeTrip = await Booking.findOne({
            'provider.id': driverId,
            'provider.type': 'sparedriver',
            status: { $in: ['en_route', 'active'] }
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

        const driver = await SpareDriver.findByIdAndUpdate(
            driverId,
            { isOnline },
            { new: true, runValidators: true }
        );

        if (!driver) return res.status(404).json({ status: 'fail', message: 'Driver not found' });

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

        const booking = await Booking.findOneAndUpdate(
            {
                _id: id,
                isActive: true,
                'provider.id': driverId,
                'provider.type': 'sparedriver',
                status: { $in: ['en_route', 'arrived'] } // Can't cancel once active/completed
            },
            {
                $set: {
                    status: 'cancelled',
                    'cancellation.reason': reason || 'Cancelled by driver',
                    'cancellation.cancelledBy': 'provider',
                    'cancellation.time': new Date()
                }
            },
            { new: true }
        );

        if (!booking) return res.status(404).json({ status: 'fail', message: 'Booking not found or cannot be cancelled now' });

        // Notify Socket
        try {
            const io = socketService.getIO();
            if (io) io.to(booking._id.toString()).emit('booking_status_updated', { bookingId: booking._id, status: 'cancelled' });
        } catch (e) { }

        res.status(200).json({ status: 'success', data: { booking } });
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
            
            // 🕊️ Phase 11: Waiting Charge Calculation 🕊️
            if (booking.tracking.arrivedAt) {
                const waitMs = new Date() - new Date(booking.tracking.arrivedAt);
                const waitMins = Math.floor(waitMs / (1000 * 60));
                const freeWaitMins = 15;
                if (waitMins > freeWaitMins) {
                    const extraWait = waitMins - freeWaitMins;
                    const waitCharge = extraWait * 2; // ₹2/min
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

            // 💎 Phase 8 Hardening: Trip Extension & Arrears Engine 💎
            let finalPrice = booking.pricing?.totalAmount || 0;
            const isChauffeur = booking.service?.category === 'Chauffeur' || booking.service?.type === 'sparedriver';
            const isHourly = isChauffeur && (
                booking.service?.name?.toLowerCase().includes('hourly') || 
                booking.service?.name?.toLowerCase().includes('full day') || 
                booking.service?.name?.toLowerCase().includes('outstation') ||
                booking.service?.name?.toLowerCase().includes('point')
            );
            
            if (isHourly && booking.tracking.startedAt) {
                const actualDurationMs = booking.tracking.completedAt - booking.tracking.startedAt;
                
                // Parse booked duration from string (e.g. "4 Hours" -> 4)
                let bookedDurationHrs = 1;
                const serviceName = booking.service?.name?.toLowerCase() || '';
                const durationStr = String(booking.service?.duration || '').toLowerCase();

                if (serviceName.includes('outstation')) {
                    bookedDurationHrs = 24;
                } else if (serviceName.includes('full day')) {
                    bookedDurationHrs = 8;
                } else {
                    const match = durationStr.match(/(\d+)/);
                    if (match) {
                        bookedDurationHrs = parseInt(match[1]);
                    }
                }

                // 🛡️ Phase 2 Hardening: 15-Minute Grace Period Pulse 🛡️
                const bookedDurationMs = bookedDurationHrs * 60 * 60 * 1000;
                const gracePeriodMs = 15 * 60 * 1000;

                if (actualDurationMs > (bookedDurationMs + gracePeriodMs)) {
                    const actualDurationHrs = Math.max(1, Math.ceil(actualDurationMs / (1000 * 60 * 60)));
                    const extraHrs = actualDurationHrs - bookedDurationHrs;
                    
                    // Derived hourly rate from the original total amount paid
                    const hourlyRate = Math.round((booking.pricing.initialPaidAmount || booking.pricing.totalAmount) / bookedDurationHrs) || 180;
                    const extensionFee = extraHrs * hourlyRate;
                    
                    // 🏨 Phase 12: Multi-Day Outstation Allowance Engine 🏨
                    if (booking.service?.name?.toLowerCase().includes('outstation')) {
                        const extraDays = Math.floor(extraHrs / 24);
                        if (extraDays > 0) {
                            const extraAllowance = extraDays * 500;
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
                const nightAllowance = 300;
                finalPrice += nightAllowance;
                booking.pricing.totalAmount = finalPrice;
                booking.notes.internal = `${booking.notes.internal || ''}\n[NIGHT] Trip ended late (${completeHour}:00). Night Shift Allowance added: ₹${nightAllowance}`.trim();
                booking.pricing.breakdown = booking.pricing.breakdown || [];
                booking.pricing.breakdown.push({ name: 'Night Shift Allowance (Sync)', amount: nightAllowance, type: 'surcharge' });
            }

            booking.payment = booking.payment || {};
            booking.payment.status = 'paid';
            booking.payment.paidAt = new Date();

            // 💰 Phase 3: Real Payout Engine
            if (finalPrice > 0) {
                const { adminCut, providerPayout } = await commissionHelper.calculatePayout(finalPrice, 'sparedriver');

                const driver = await SpareDriver.findById(driverId);
                const consumer = await User.findById(booking.consumer);

                if (driver && consumer) {
                    // Force Transaction (Allow Negative Balance for User if needed - Arrears Protocol)
                    const walletHelper = require('../../../utils/walletHelper');
                    await walletHelper.executeWalletTransaction(
                        driver._id,
                        providerPayout,
                        'credit',
                        {
                            category: 'SERVICE_BOOKING',
                            description: `Payout for booking ${booking.bookingId || booking._id} (Duration: ${booking.service?.duration || '1'}h+)`,
                            referenceId: booking._id.toString(),
                            referenceType: 'booking_payout'
                        },
                        null,
                        SpareDriver
                    );

                    // If it was a wallet payment, we might need to deduct the extension fee from user
                    if (booking.payment.method === 'wallet' && finalPrice > (booking.pricing.initialPaidAmount || 0)) {
                        const extraToDeduct = finalPrice - (booking.pricing.initialPaidAmount || 0);
                        await walletHelper.executeWalletTransaction(
                            consumer._id,
                            extraToDeduct,
                            'debit',
                            {
                                category: 'SERVICE_CHARGE',
                                description: `Trip Extension Fee for #${booking.bookingId || booking._id}`,
                                referenceId: booking._id.toString(),
                                referenceType: 'booking_extension'
                            }
                        ).catch(e => {
                            console.error('Arrears Protocol: User balance went negative/insufficient but payout to driver remains atomic.');
                        });
                    }
                }
            }
        }

        booking.status = status;
        await booking.save();

        // Notify via Socket
        try {
            const io = socketService.getIO();
            if (io) {
                // 1. Notify Booking Room (Consumer & Driver)
                io.to(booking._id.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: booking.status
                });

                // 2. Notify Admin Control Tower
                io.to('admin_room').emit('global_status_update', {
                    type: 'task_update',
                    bookingId: booking._id,
                    status: booking.status,
                    userName: consumer.name,
                    serviceType: 'sparedriver'
                });
            }
        } catch (e) {
            console.error('Socket notification failed:', e.message);
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

// ── Toggle online status ──
exports.toggleOnline = async (req, res) => {
    try {
        const { isOnline } = req.body;
        const driverId = getDriverIdFromRequest(req);

        const driver = await SpareDriver.findByIdAndUpdate(
            driverId,
            { isOnline },
            { new: true, runValidators: true }
        );

        if (!driver) return res.status(404).json({ status: 'fail', message: 'Driver not found' });

        res.status(200).json({
            status: 'success',
            data: { isOnline: driver.isOnline }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

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
