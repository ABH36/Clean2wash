const Booking = require('../../../models/Booking');
const Captain = require('../../../models/Captain');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Hub = require('../../../models/Hub');
const Setting = require('../../../models/Setting');
const socketService = require('../../../socketService');
const { sendCaptainNotification } = require('../../../utils/notificationService');

// Get Admin Dashboard Stats (P6)
exports.getDashboard = async (req, res) => {
    try {
        // 1. Core KPIs with Trends (Current vs Previous Month)
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Revenue (Current)
        const revenueResult = await Booking.aggregate([
            { $match: { status: 'completed', isActive: true } },
            { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // Revenue (Previous Month)
        const prevRevenueResult = await Booking.aggregate([
            {
                $match: {
                    status: 'completed',
                    isActive: true,
                    createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]);
        const prevRevenue = prevRevenueResult[0]?.total || 0;
        const revenueTrend = prevRevenue === 0 ? 100 : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);

        // Active Jobs
        const activeJobsCount = await Booking.countDocuments({
            status: { $nin: ['completed', 'cancelled', 'refunded'] },
            isActive: true
        });
        const prevActiveJobs = await Booking.countDocuments({
            status: { $nin: ['completed', 'cancelled', 'refunded'] },
            isActive: true,
            createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
        });
        const jobsTrend = prevActiveJobs === 0 ? 100 : Math.round(((activeJobsCount - prevActiveJobs) / prevActiveJobs) * 100);

        // Total Users
        const totalUsers = await User.countDocuments({ isActive: true });
        const prevUsers = await User.countDocuments({
            isActive: true,
            createdAt: { $lt: startOfCurrentMonth }
        });
        const usersTrend = prevUsers === 0 ? 100 : Math.round(((totalUsers - prevUsers) / prevUsers) * 100);

        // 2. Revenue Timeline (Last 12 Months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const revenueTimeline = await Booking.aggregate([
            {
                $match: {
                    status: 'completed',
                    isActive: true,
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 3. Ops Mix (Category Distribution)
        const opsMix = await Booking.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$service.category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 4. Recent Bookings
        const recentBookings = await Booking.find({ isActive: true })
            .populate('consumer', 'name phone')
            .sort({ createdAt: -1 })
            .limit(5);

        const criticalIssues = await Booking.find({
            'issues.status': 'open',
            'issues.type': 'SOS',
            isActive: true
        })
        .populate('consumer', 'name phone')
        .sort({ updatedAt: -1 })
        .limit(3);
        
        // Map price for frontend
        const mappedRecentBookings = recentBookings.map(b => ({
            ...b.toObject(),
            price: `₹${b.pricing?.totalAmount || 0}`
        }));

        // 5. Top Performing Nodes (Aggregated from Bookings)
        const topNodes = await Booking.aggregate([
            { $match: { status: 'completed', isActive: true } },
            {
                $group: {
                    _id: '$provider.id',
                    name: { $first: '$provider.name' },
                    count: { $sum: 1 },
                    revenue: { $sum: '$pricing.totalAmount' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        // 6. Network Load (Active vs Capacity)
        // Load = (Active Jobs / (Total Online Captains * JobsPerCaptain))
        const onlineCaptains = await User.countDocuments({ role: 'captain', isOnline: true, isActive: true }) || 1;
        const captainCapacity = 3; // Max concurrent jobs per captain (assumed)
        const totalCapacity = onlineCaptains * captainCapacity;
        const networkLoad = Math.min(Math.round((activeJobsCount / totalCapacity) * 100), 100) || 5;

        res.status(200).json({
            status: 'success',
            data: {
                totalRevenue,
                revenueTrend,
                activeJobs: activeJobsCount,
                jobsTrend,
                totalUsers,
                usersTrend,
                revenueTimeline,
                opsMix,
                recentBookings: mappedRecentBookings,
                criticalIssues,
                topNodes,
                networkLoad,
                onlineCaptains
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to aggregate dashboard data' });
    }
};

// Get all pending bookings
exports.getPendingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            status: { $in: ['pending', 'confirmed', 'assigned', 'pickup-assigned', 'en_route', 'at-studio', 'in_progress', 'quality-check'] },
            isActive: true
        })
            .populate('consumer', 'name phone email profile')
            .populate('vehicle', 'brand model type plate')
            .sort({ createdAt: -1 });

        const mappedBookings = bookings.map(b => ({
            ...b.toObject(),
            price: `₹${b.pricing?.totalAmount || 0}`,
            serviceName: b.service?.name || 'Wash Service'
        }));

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: {
                bookings: mappedBookings
            }
        });
    } catch (error) {
        console.error('Error fetching pending bookings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch pending bookings'
        });
    }
};

// Get all active captains
exports.getActiveCaptains = async (req, res) => {
    try {
        const captains = await Captain.find({ isActive: true })
            .select('name phone rating isOnline profile.city')
            .sort({ isOnline: -1, rating: -1 });

        res.status(200).json({
            status: 'success',
            results: captains.length,
            data: {
                captains
            }
        });
    } catch (error) {
        console.error('Error fetching captains:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch active captains'
        });
    }
};

// Assign booking to a captain (deprecated/legacy or for backward compatibility)
exports.assignCaptain = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { captainId } = req.body;

        if (!bookingId || !captainId) {
            return res.status(400).json({ status: 'fail', message: 'Booking ID and Captain ID are required' });
        }

        const captain = await User.findOne({ _id: captainId, role: 'captain' });
        if (!captain) {
            return res.status(404).json({ status: 'fail', message: 'Captain not found' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        booking.provider = {
            type: 'captain',
            id: captain._id,
            name: captain.name,
            phone: captain.phone,
            rating: captain.rating || 5.0,
            photo: captain.profile?.avatar || ''
        };

        booking.status = 'assigned';
        booking.tracking = booking.tracking || {};
        booking.tracking.assignedAt = new Date();

        await booking.save();

        const io = socketService.getIO();
        io.to(captain._id.toString()).emit('booking_assigned', {
            bookingId: booking._id,
            message: `You have been assigned to booking ${booking.bookingId || booking._id}`
        });

        res.status(200).json({
            status: 'success',
            message: `Booking assigned to captain ${captain.name}`,
            data: { booking }
        });
    } catch (error) {
        console.error('Error assigning captain:', error);
        res.status(500).json({ status: 'error', message: 'Failed to assign captain' });
    }
};

// Generic Staff Assignment (Pickup/Delivery)
exports.assignStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { staffId, type } = req.body; // type: 'pickup' or 'delivery'

        if (!staffId || !type) {
            return res.status(400).json({ status: 'fail', message: 'Staff ID and type (pickup/delivery) are required' });
        }

        const staff = await User.findById(staffId);
        if (!staff) {
            return res.status(404).json({ status: 'fail', message: 'Staff member not found' });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        if (type === 'pickup') {
            booking.pickupStaff = staff._id;
            if (['pending', 'confirmed', 'assigned'].includes(booking.status)) {
                booking.status = 'pickup-assigned';
            }
        } else if (type === 'delivery') {
            booking.deliveryStaff = staff._id;
            if (['at-studio', 'in_progress', 'quality-check'].includes(booking.status)) {
                booking.status = 'delivery-assigned';
            }
        }

        await booking.save();

        res.status(200).json({
            status: 'success',
            message: `Staff ${staff.name} assigned for ${type}`,
            data: { booking }
        });
    } catch (error) {
        console.error('Error assigning staff:', error);
        res.status(500).json({ status: 'error', message: 'Failed to assign staff' });
    }
};

// Update Booking Status manually by Admin
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        // Notify via Socket
        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status
        });

        res.status(200).json({
            status: 'success',
            data: { booking }
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update status' });
    }
};

// Product Governance: Fetch all products for verification
exports.getProducts = async (req, res) => {
    try {
        const { status, category } = req.query;
        const query = {};
        if (status && status !== 'All') query.status = status;
        if (category && category !== 'All') query.category = category;

        const products = await Product.find(query)
            .populate('vendor', 'name email profile.studioName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: products.length,
            data: { products }
        });
    } catch (error) {
        console.error('Error fetching products for verification:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch products for verification' });
    }
};

// Refactored verifyProduct to use standalone Product model
exports.verifyProduct = async (req, res) => {
    try {
        const { productId, status, note } = req.body;

        if (!productId || !status) {
            return res.status(400).json({ status: 'fail', message: 'ProductId and Status are required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ status: 'fail', message: 'Product not found' });
        }

        // Update product status and optional note
        product.status = status;
        if (note) {
            product.adminNote = note;
        }

        await product.save();

        res.status(200).json({
            status: 'success',
            message: `Product ${status} successfully`,
            data: { product }
        });
    } catch (error) {
        console.error('Error verifying product:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to verify product' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let users = [];
        
        if (role === 'captain') {
            users = await Captain.find({}).select('-password');
        } else if (role === 'sparedriver') {
            const SpareDriver = require('../../../models/SpareDriver');
            users = await SpareDriver.find({}).select('-password');
        } else {
            const query = role ? { role } : {};
            users = await User.find(query).select('-password');
        }

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to get users' });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('consumer', 'name phone email profile')
            .populate('vehicle', 'brand model type plate')
            .sort({ createdAt: -1 });

        const mappedBookings = bookings.map(b => ({
            ...b.toObject(),
            price: `₹${b.pricing?.totalAmount || 0}`,
            serviceName: b.service?.name || 'Wash Service'
        }));

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: { bookings: mappedBookings }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch bookings' });
    }
};

// Create a new user (any role)
exports.createUser = async (req, res) => {
    try {
        const { name, email, phone, password, role, ...extra } = req.body;

        // Basic validation
        if (!name || !phone || !email || !role) {
            return res.status(400).json({ status: 'fail', message: 'Name, email, phone, and role are required' });
        }

        // Check for existing user
        const existing = await User.findOne({
            $or: [{ phone }, { email }]
        });

        if (existing) {
            const field = existing.phone === phone ? 'phone' : 'email';
            return res.status(400).json({ status: 'fail', message: `User with this ${field} already exists` });
        }

        // Prepare user data
        const userData = {
            name,
            email,
            phone,
            password: password || '1234', // Default password if not provided
            role,
            isVerified: true, // Admin-created users are pre-verified
            profile: {}
        };

        // Handle role-specific fields
        if (role === 'captain' || role === 'sparedriver') {
            userData.profile.hub = extra.hub || '';
            userData.profile.city = extra.city || '';
        } else if (role === 'vendor') {
            userData.profile.studioName = extra.studioName || extra.name || '';
            userData.profile.city = extra.city || '';
        } else if (role === 'staff') {
            userData.profile.role = extra.role || 'Field Agent';
        }

        const newUser = await User.create(userData);

        res.status(201).json({
            status: 'success',
            data: { user: newUser }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to create user' });
    }
};

// Update user details or status
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        let modelType = 'User';
        let user = await User.findById(id);
        
        if (!user) {
            user = await Captain.findById(id);
            if (user) modelType = 'Captain';
        }
        
        if (!user) {
            const SpareDriver = require('../../../models/SpareDriver');
            user = await SpareDriver.findById(id);
            if (user) modelType = 'SpareDriver';
        }

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'Entity not found' });
        }

        // Separate core fields from profile fields if needed
        const coreFields = ['name', 'email', 'phone', 'role', 'status', 'verificationStatus', 'isActive', 'isVerified'];
        coreFields.forEach(field => {
            if (updates[field] !== undefined) user[field] = updates[field];
        });

        // Update profile based on role
        if (modelType === 'Captain' || modelType === 'SpareDriver' || user.role === 'captain' || user.role === 'sparedriver') {
            if (updates.hub) {
                if (!user.profile) user.profile = {};
                user.profile.hub = updates.hub;
            }
            if (updates.city) {
                if (!user.profile) user.profile = {};
                user.profile.city = updates.city;
            }
            
            // Trigger Notification for Verification
            if ((modelType === 'Captain' || modelType === 'SpareDriver') && updates.isVerified === true) {
                const io = socketService.getIO();
                io.to(user._id.toString()).emit('captain_verified', {
                    message: 'Your account has been verified by an admin. You can now receive requests.'
                });
                
                await sendCaptainNotification(user._id, {
                    title: 'Account Verified!',
                    message: 'Congratulations! Your account has been verified by an admin. You can now go online.',
                    type: 'verification',
                    priority: 'high'
                });
            }
        } else if (user.role === 'vendor') {
            if (updates.studioName) user.profile.studioName = updates.studioName;
            if (updates.city) user.profile.city = updates.city;
            if (updates.verificationStatus) user.profile.verificationStatus = updates.verificationStatus;
        } else if (user.role === 'staff') {
            if (updates.role) user.profile.role = updates.role;
        }

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update user' });
    }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        let user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
        
        if (!user) {
            user = await Captain.findByIdAndUpdate(id, { isActive: false }, { new: true });
        }
        
        if (!user) {
            const SpareDriver = require('../../../models/SpareDriver');
            user = await SpareDriver.findByIdAndUpdate(id, { isActive: false }, { new: true });
        }

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'Entity not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Entity deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete user' });
    }
};

// --- SYSTEM SETTINGS ---

// Get all settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.find();

        // Seed initial settings if empty
        if (settings.length === 0) {
            const defaults = [
                { key: 'platform_commission', value: 15, category: 'Financial', description: 'Percentage per booking' },
                { key: 'min_withdrawal', value: 500, category: 'Financial', description: 'Minimum amount for vendor payout' },
                { key: 'support_email', value: 'support@clean2wash.com', category: 'General', description: 'System support contact' },
                { key: 'firewall_mode', value: 'Neural', category: 'Security', description: 'Encryption matrix status' }
            ];
            settings = await Setting.create(defaults);
        }

        res.status(200).json({
            status: 'success',
            data: { settings }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
    }
};

// Update or create setting
exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, updatedBy: req.user._id },
            { upsert: true, new: true }
        );

        res.status(200).json({
            status: 'success',
            data: { setting }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to update setting' });
    }
};
