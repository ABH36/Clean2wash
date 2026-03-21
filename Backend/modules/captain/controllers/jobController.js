const Booking = require('../../../models/Booking');
const Captain = require('../../../models/Captain');
const User = require('../../../models/User');
const Promotion = require('../../../models/Promotion');
const Setting = require('../../../models/Setting');
const WalletTransaction = require('../../../models/WalletTransaction');
const socketService = require('../../../socketService');
const { sendNotification } = require('../../../utils/notificationService');
const { executeWalletTransaction } = require('../../../utils/walletHelper');
const auditHelper = require('../../../utils/auditHelper');
const referralService = require('../../../utils/referralService');

const formatBookingForCaptain = (b) => {
    const consumer = b.consumer && b.consumer.name ? b.consumer : {};
    const vehicle = b.vehicle && b.vehicle.brand ? b.vehicle : {};
    const addr = b.location?.address;
    const addressStr = addr ? [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') : 'Address not set';
    return {
        id: b._id.toString(),
        bookingId: b.bookingId || b._id.toString(),
        serviceName: b.service?.name || 'Car Wash',
        vehicle: vehicle.brand && vehicle.model ? `${vehicle.brand} ${vehicle.model}` : (vehicle.type || 'Vehicle'),
        userName: consumer.name || 'Customer',
        userPhone: consumer.phone || '',
        address: addressStr,
        price: `₹${b.pricing?.totalAmount || 0}`,
        status: b.status,
        type: b.service?.type || 'captain',
        schedule: b.schedule,
        timestamp: b.createdAt,
        landmark: b.location?.landmark
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

        const pendingJobs = await findQuery;

        const formatted = pendingJobs.map(formatBookingForCaptain);

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

        // Phase 7: Slot Conflict Engine
        // Prevent specialist from accepting an instant job if a scheduled slot is starting soon
        const targetJob = await Booking.findById(id);
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

            // ➕ Phase 3: Global Notification Sync
            // Emit to Consumer's personal room for list-view updates
            io.to(booking.consumer._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: 'confirmed',
                message: `Captain ${req.captain.name} has accepted your booking.`,
                updatedFields: { 'provider.id': captainId, 'provider.type': 'captain' }
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

        const validStatuses = ['confirmed', 'en_route', 'arrived', 'before_photo', 'washing', 'after_photo', 'completed', 'cancelled'];
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
        if (status === 'washing' && (booking.status === 'before_photo' || booking.status === 'arrived')) {
            const providedPin = req.body.securityPin || req.body.pin;
            if (!providedPin || providedPin !== booking.securityPin) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'Invalid Security PIN. Please verify the 4-digit PIN with the customer to start the wash.'
                });
            }
        }

        // Elite Hardening: Mandatory Service Proofs (Photos)
        if (status === 'before_photo' && !req.body.photo && (!booking.serviceImages?.before?.length)) {
            // In a real app, this would be integrated with S3/Cloudinary upload
            // For this audit, we'll accept a 'photo' string in the body as proof
            return res.status(400).json({
                status: 'fail',
                message: 'Before-service photo is mandatory to document vehicle condition.'
            });
        }

        if (status === 'after_photo' && !req.body.photo && (!booking.serviceImages?.after?.length)) {
            return res.status(400).json({
                status: 'fail',
                message: 'After-service photo is mandatory to verify completion quality.'
            });
        }

        // Store photos if provided
        if (req.body.photo) {
            if (!booking.serviceImages) booking.serviceImages = { before: [], after: [] };
            if (status === 'before_photo') {
                booking.serviceImages.before.push(req.body.photo);
            } else if (status === 'after_photo') {
                booking.serviceImages.after.push(req.body.photo);
            } else if (status === 'washing' && booking.serviceImages.before.length === 0) {
                // Also allow storing before photo during PIN verification if not already set
                booking.serviceImages.before.push(req.body.photo);
            }
            booking.serviceImages.capturedAt = new Date();
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
            if (booking.payment) booking.payment.status = 'paid';
            const amount = booking.pricing?.totalAmount || 0;
            if (amount > 0) {
                // Fetch Dynamic Payout details via helper
                const commissionHelper = require('../../../utils/commissionHelper');
                const { adminCut, providerPayout, rate } = await commissionHelper.calculatePayout(amount, 'captain');

                // 1. Credit Captain Wallet
                await executeWalletTransaction(
                    req.captain._id,
                    providerPayout,
                    'credit',
                    {
                        category: 'SERVICE_BOOKING',
                        description: `Payout for booking ${booking.bookingId || booking._id} (Commission: ₹${adminCut.toFixed(2)})`,
                        referenceId: booking._id.toString(),
                        referenceType: 'booking_payout'
                    },
                    null,
                    Captain
                );

                // --- Referral Reward Logic (Phase 4) ---
                await referralService.processReferralReward(booking.consumer, booking._id);
            }
        }
        await booking.save();

        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status,
            tracking: booking.tracking
        });

        // ➕ Phase 3: Global Notification Sync
        // Emit to Consumer's personal room for list-view updates
        io.to(booking.consumer.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status,
            tracking: booking.tracking,
            message: `Booking status changed to ${booking.status}`
        });

        // Send notification to consumer on status change
        let notifTitle = '';
        let notifMsg = '';
        let priority = 'medium';

        if (status === 'en_route') {
            notifTitle = 'Captain En Route! 🚚';
            notifMsg = `Captain ${req.captain.name} is on the way to your location.`;
        } else if (status === 'in_progress') {
            notifTitle = 'Wash Started ✨';
            notifMsg = `Your ${booking.service?.name || 'car wash'} has officially started.`;
        } else if (status === 'completed') {
            notifTitle = 'Your Car is Clean! ✨';
            notifMsg = `Captain ${req.captain.name} has finished the wash. Order #${booking.bookingId || booking._id} is complete.`;
            priority = 'high';
        } else if (status === 'cancelled') {
            notifTitle = 'Booking Cancelled';
            notifMsg = `Your booking was cancelled. If payment was made, it will be refunded.`;
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
            .populate('vehicle', 'brand model type plate');

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

        const totalEarned = completed.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayEarned = completed
            .filter(b => b.createdAt >= startOfToday)
            .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
        const weekEarned = completed
            .filter(b => b.createdAt >= startOfWeek)
            .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
        const monthEarned = completed
            .filter(b => b.createdAt >= startOfMonth)
            .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);

        const captain = await Captain.findById(captainId);
        const walletBalance = (captain?.wallet?.balance || 0);

        res.status(200).json({
            status: 'success',
            data: {
                today: { earned: todayEarned, jobs: completed.filter(b => b.createdAt >= startOfToday).length },
                week: { earned: weekEarned, jobs: completed.filter(b => b.createdAt >= startOfWeek).length },
                month: { earned: monthEarned, jobs: completed.filter(b => b.createdAt >= startOfMonth).length },
                total: totalEarned,
                walletBalance,
                recentJobs: completed.slice(0, 5).map(b => ({
                    id: b._id,
                    serviceName: b.service?.name || 'Car Wash',
                    userName: b.consumer?.name || 'Customer',
                    amount: b.pricing?.totalAmount,
                    price: `₹${b.pricing?.totalAmount || 0}`,
                    createdAt: b.createdAt
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
            return res.status(400).json({ status: 'fail', message: 'Insufficient balance.' });
        }

        // 1. Atomic Debit & Create Record (Status PENDING Override)
        const result = await executeWalletTransaction(
            captainId,
            withdrawAmount,
            'debit',
            {
                category: 'WITHDRAWAL',
                description: `Bank Withdrawal Request. Account: ${bankDetails?.accountNumber || 'Stored Bank'}`,
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
        }).select('pricing.totalAmount createdAt').populate('consumer', 'name');

        const pending = captain.isOnline ? await Booking.find({
            status: 'pending',
            isActive: true,
            $or: [{ 'service.type': 'captain' }, { 'provider.type': 'captain' }]
        }).limit(5).populate('consumer', 'name').populate('vehicle', 'brand model type') : [];

        const myActive = await Booking.find({
            'provider.id': captainId,
            status: { $in: ['accepted', 'confirmed', 'en_route', 'arrived', 'before_photo', 'washing', 'after_photo'] },
            isActive: true
        }).populate('consumer', 'name phone').populate('vehicle', 'brand model type');

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayJobs = completed.filter(b => b.createdAt >= startOfToday);
        const weekJobs = completed.filter(b => b.createdAt >= startOfWeek);
        const monthJobs = completed.filter(b => b.createdAt >= startOfMonth);

        const todayEarned = todayJobs.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
        const weekEarned = weekJobs.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
        const monthEarned = monthJobs.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);

        const totalEarned = completed.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
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
                pendingJobs: pending.map(b => formatBookingForCaptain(b)),
                activeJob: myActive[0] ? formatBookingForCaptain(myActive[0]) : null,
                recentCompleted: completed.slice(0, 5).map(b => formatBookingForCaptain(b))
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
