const SpareDriver = require('../../../models/SpareDriver');
const Booking = require('../../../models/Booking');
const Setting = require('../../../models/Setting');
const WalletTransaction = require('../../../models/WalletTransaction');
const Notification = require('../../../models/Notification');
const commissionHelper = require('../../../utils/commissionHelper');
const { socketService } = require('../../../socketService');
const cloudinary = require('../../../utils/cloudinary');
const jwt = require('jsonwebtoken');
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

        // If updated in last 30 seconds, skip DB write (but return success)
        const lastUpdate = driver.updatedAt || 0;
        const diff = Date.now() - new Date(lastUpdate).getTime();
        if (diff < 30000) {
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
            booking.tracking.startedAt = new Date();
        }

        if (status === 'arrived') {
            booking.tracking = booking.tracking || {};
            booking.tracking.arrivedAt = new Date();
        }

        if (status === 'completed') {
            booking.tracking = booking.tracking || {};
            booking.tracking.completedAt = new Date();
            booking.payment = booking.payment || {};
            booking.payment.status = 'paid';
            booking.payment.paidAt = new Date();

            // 💰 Phase 3: Real Payout Engine
            const totalAmount = booking.pricing?.totalAmount || 0;
            if (totalAmount > 0) {
                const { adminCut, providerPayout } = await commissionHelper.calculatePayout(totalAmount, 'sparedriver');

                const driver = await SpareDriver.findById(driverId);
                if (driver) {
                    // 1. Credit Driver Wallet (Atomic)
                    await executeWalletTransaction(
                        driver._id,
                        providerPayout,
                        'credit',
                        {
                            category: 'SERVICE_BOOKING',
                            description: `Payout for booking ${booking.bookingId || booking._id} (Commission: ₹${adminCut})`,
                            referenceId: booking._id.toString(),
                            referenceType: 'booking_payout'
                        },
                        null,
                        SpareDriver
                    );
                }
            }
        }

        booking.status = status;
        await booking.save();

        // Notify via Socket
        try {
            const io = socketService.getIO();
            if (io) {
                io.to(booking._id.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: booking.status
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
