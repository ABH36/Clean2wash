const Booking = require('../../consumer/models/Booking');
const Captain = require('../models/Captain');

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
        timestamp: b.createdAt,
        landmark: b.location?.landmark
    };
};

exports.getPendingJobs = async (req, res) => {
    try {
        const jobs = await Booking.find({
            status: 'pending',
            isActive: true,
            $or: [
                { 'service.type': 'captain' },
                { 'provider.type': 'captain' }
            ]
        })
            .populate('consumer', 'name phone')
            .populate('vehicle', 'brand model type plate')
            .sort({ createdAt: -1 })
            .limit(20);

        const formatted = jobs.map(formatBookingForCaptain);
        res.status(200).json({
            status: 'success',
            results: formatted.length,
            data: { jobs: formatted }
        });
    } catch (error) {
        console.error('Captain getPendingJobs error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch pending jobs.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.acceptJob = async (req, res) => {
    try {
        const { id } = req.params;
        const captainId = req.captain.id;

        const booking = await Booking.findOne({
            _id: id,
            status: 'pending',
            isActive: true
        }).populate('consumer', 'name phone').populate('vehicle', 'brand model type');

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found or already assigned.'
            });
        }

        booking.status = 'confirmed';
        booking.provider = booking.provider || {};
        booking.provider.type = 'captain';
        booking.provider.id = captainId;
        booking.provider.name = req.captain.name;
        booking.provider.phone = req.captain.phone;
        booking.provider.rating = req.captain.rating;
        booking.tracking = booking.tracking || {};
        booking.tracking.assignedAt = new Date();
        await booking.save();

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

        const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'fail',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const booking = await Booking.findOne({
            _id: id,
            'provider.id': req.captain.id,
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found or you are not assigned to it.'
            });
        }

        booking.status = status;
        if (!booking.tracking) booking.tracking = {};
        if (status === 'in_progress') {
            booking.tracking.startedAt = new Date();
        } else if (status === 'completed') {
            booking.tracking.completedAt = new Date();
            if (booking.payment) booking.payment.status = 'paid';
            const amount = booking.pricing?.totalAmount || 0;
            if (amount > 0) {
                const captain = await Captain.findById(req.captain.id);
                if (captain) {
                    captain.wallet = captain.wallet || {};
                    captain.wallet.balance = (captain.wallet.balance || 0) + amount;
                    await captain.save({ validateBeforeSave: false });
                }
            }
        }
        await booking.save();

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
        const { amount, method = 'bank' } = req.body;
        const captain = await Captain.findById(req.captain.id);
        if (!captain) return res.status(404).json({ status: 'fail', message: 'Captain not found.' });

        captain.wallet = captain.wallet || {};
        const balance = captain.wallet.balance || 0;
        const withdrawAmount = Math.min(amount || balance, balance);

        if (withdrawAmount <= 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Insufficient balance to withdraw.'
            });
        }

        captain.wallet.balance = balance - withdrawAmount;
        captain.wallet.lastWithdrawAt = new Date();
        await captain.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'Withdrawal initiated successfully',
            data: {
                amount: withdrawAmount,
                newBalance: captain.wallet.balance,
                method
            }
        });
    } catch (error) {
        console.error('Captain withdrawPayout error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process withdrawal.' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const captainId = req.captain.id;
        const captain = await Captain.findById(captainId);

        const completed = await Booking.find({
            'provider.id': captainId,
            status: 'completed',
            isActive: true
        }).select('pricing.totalAmount createdAt').populate('consumer', 'name');

        const pending = await Booking.find({
            status: 'pending',
            isActive: true,
            $or: [{ 'service.type': 'captain' }, { 'provider.type': 'captain' }]
        }).limit(5).populate('consumer', 'name').populate('vehicle', 'brand model type');

        const myActive = await Booking.find({
            'provider.id': captainId,
            status: { $in: ['confirmed', 'in_progress'] },
            isActive: true
        }).populate('consumer', 'name phone').populate('vehicle', 'brand model type');

        const totalEarned = completed.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
        const walletBalance = captain?.wallet?.balance || 0;

        res.status(200).json({
            status: 'success',
            data: {
                captain: {
                    id: captain._id,
                    name: captain.name,
                    rating: captain.rating,
                    isOnline: captain.isOnline
                },
                stats: {
                    completedJobs: completed.length,
                    totalEarned,
                    walletBalance,
                    rating: captain?.rating || 5.0
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
        const captain = await Captain.findById(req.captain.id);
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
