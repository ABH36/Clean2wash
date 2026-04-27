const Booking = require('../../../models/Booking');
const Captain = require('../../../models/Captain');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const ProductOrder = require('../../../models/ProductOrder');
const Service = require('../../../models/Service');
const Hub = require('../../../models/Hub');
const Setting = require('../../../models/Setting');
const AuditLog = require('../../../models/AuditLog');
const Notification = require('../../../models/Notification');
const socketService = require('../../../socketService');
const { sendCaptainNotification, sendVendorNotification } = require('../../../utils/notificationService');
const WalletTransaction = require('../../../models/WalletTransaction');
const SpareDriver = require('../../../models/SpareDriver');
const SOSAlert = require('../../../models/SOSAlert');
const commissionHelper = require('../../../utils/commissionHelper');
const walletHelper = require('../../../utils/walletHelper');

// ── SOS & EMERGENCY MANAGEMENT ─────────────────────────────────────

/**
 * Get all active SOS alerts with full context
 */
exports.getActiveSOS = async (req, res) => {
    try {
        const activeAlerts = await SOSAlert.find({ status: 'active' })
            .populate('consumer', 'name phone profile.avatar profile.trustedContacts')
            .populate({
                path: 'booking',
                populate: { path: 'captain', select: 'name phone profile.avatar currentLocation vehicleType plate' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: activeAlerts.length,
            data: { alerts: activeAlerts }
        });
    } catch (error) {
        console.error('Error fetching active SOS alerts:', error);
        res.status(500).json({ status: 'error', message: 'Failed to synchronize emergency queue' });
    }
};

/**
 * Resolve an SOS alert
 */
exports.resolveSOS = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await SOSAlert.findById(id);

        if (!alert) {
            return res.status(404).json({ status: 'fail', message: 'SOS Alert not found' });
        }

        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        alert.resolvedBy = req.user.id;
        
        // Also update any linked booking issue
        if (alert.booking) {
            await Booking.updateOne(
                { _id: alert.booking, 'issues.type': 'SOS', 'issues.status': 'open' },
                { $set: { 'issues.$.status': 'resolved', 'issues.$.resolvedAt': new Date() } }
            );
        }

        await alert.save();

        // Broadcast resolution to all responders
        const io = socketService.getIO();
        if (io) {
            io.emit('sos_resolved', { sosId: alert._id, resolvedBy: req.user.name });
            io.to('admin_room').emit('sos_alert_cleared', { sosId: alert._id });
        }

        res.status(200).json({
            status: 'success',
            message: 'SOS Situation marked as RESOLVED and archived.',
            data: { alert }
        });
    } catch (error) {
        console.error('Error resolving SOS alert:', error);
        res.status(500).json({ status: 'error', message: 'Failed to record resolution protocol' });
    }
};

const getChauffeurCommissionOverride = (booking = {}) => {
    const rate = Number(booking?.service?.metadata?.commercialRules?.commissionPercent);
    return Number.isFinite(rate) && rate >= 0 ? rate : null;
};


// Get Admin Dashboard Stats (P6)
// Get Admin Dashboard Stats (P6)
exports.getDashboard = async (req, res) => {
    try {
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // --- 1. SERVICE METRICS ---
        const serviceRevenueResult = await Booking.aggregate([
            { $match: { status: 'completed', isActive: true } },
            { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]);
        const serviceRevenue = serviceRevenueResult[0]?.total || 0;

        const activeServicesCount = await Booking.countDocuments({
            status: { $nin: ['completed', 'cancelled', 'refunded'] },
            isActive: true
        });

        // --- 2. PRODUCT METRICS ---
        const productRevenueResult = await ProductOrder.aggregate([
            { $match: { status: { $in: ['delivered', 'completed'] }, isActive: true } },
            { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]);
        const productRevenue = productRevenueResult[0]?.total || 0;

        const activeProductOrders = await ProductOrder.countDocuments({
            status: { $nin: ['delivered', 'completed', 'cancelled', 'returned'] },
            isActive: true
        });

        const lowStockCount = await Product.countDocuments({ stock: { $lt: 5 }, status: 'Live' });

        // --- 3. UNIFIED KPIs ---
        const totalRevenue = serviceRevenue + productRevenue;
        const totalActiveOps = activeServicesCount + activeProductOrders;
        const totalUsers = await User.countDocuments({ isActive: true });

        // Segregated Populations (P12 Expanded - Multi-Collection Census)
        const roleCounts = {
            consumer: await User.countDocuments({ role: 'consumer', isActive: true }),
            captain: await Captain.countDocuments({ isActive: true }),
            vendor: await User.countDocuments({ role: 'vendor', isActive: true }),
            staff: await User.countDocuments({ role: 'staff', isActive: true }),
            sparedriver: await SpareDriver.countDocuments({ isActive: true })
        };
        const totalBookingsAllTime = await Booking.countDocuments({ isActive: true });

        // Today's Velocity
        const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
        const todayRevenueResult = await Booking.aggregate([
            { $match: { status: 'completed', isActive: true, updatedAt: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]);
        const todayRevenue = todayRevenueResult[0]?.total || 0;

        // 7-Day Performance Matrix (Global & Category Segregated)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Parallel aggregation for global trend & category mix
        const [yieldTrend, categoryMix] = await Promise.all([
            Booking.aggregate([
                { $match: { isActive: true, createdAt: { $gte: sevenDaysAgo } } },
                { 
                    $group: { 
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        bookings: { $sum: 1 },
                        revenue: { $sum: { $ifNull: ["$pricing.totalAmount", 0] } }
                    } 
                },
                { $sort: { "_id": 1 } }
            ]),
            Booking.aggregate([
                { $match: { isActive: true, createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { 
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            category: { $ifNull: ["$service.category", "General"] }
                        },
                        bookings: { $sum: 1 },
                        revenue: { $sum: { $ifNull: ["$pricing.totalAmount", 0] } }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ])
        ]);

        // Process Category Mix into a usable matrix
        const categoryMatrix = {};
        categoryMix.forEach(item => {
            const { date, category } = item._id;
            if (!categoryMatrix[category]) categoryMatrix[category] = [];
            categoryMatrix[category].push({ date, bookings: item.bookings, revenue: item.revenue });
        });

        // --- 4. STUCK BOOKINGS DETECTION (Operational IQ) ---
        // Definition: Active for > 120 mins without status update
        const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
        const stuckBookings = await Booking.find({
            status: { $in: ['assigned', 'en_route', 'arrived', 'pickup-assigned', 'picked-up', 'at-studio', 'washing', 'before_photo', 'after_photo', 'in_progress', 'quality-check', 'ready-for-delivery', 'delivery-assigned', 'out_for_delivery'] },
            updatedAt: { $lt: twoHoursAgo },
            isActive: true
        })
            .populate('consumer', 'name phone')
            .populate('provider.id', 'name phone')
            .sort({ updatedAt: 1 })
            .limit(5);

        // --- 5. CATEGORY MIX (Ecosystem Health) ---
        const serviceMix = await Booking.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$service.category', count: { $sum: 1 } } }
        ]);

        // --- 6. RECENT ACTIVITY ---
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

        const mappedRecentBookings = recentBookings.map(b => ({
            ...b.toObject(),
            price: `₹${b.pricing?.totalAmount || 0}`
        }));

        // 7. Network Load
        const onlineCaptains = await User.countDocuments({ role: 'captain', isOnline: true, isActive: true }) || 1;
        const totalCapacity = onlineCaptains * 3;
        const networkLoad = Math.min(Math.round((activeServicesCount / totalCapacity) * 100), 100) || 5;

        // --- 8. GROWTH METRICS (Phase 4) ---
        const totalReferredUsers = await User.countDocuments({ referredBy: { $exists: true, $ne: null }, isActive: true });
        const rewardedReferralsResult = await WalletTransaction.aggregate([
            { $match: { category: 'REFERRAL', type: 'credit', status: 'completed' } },
            { $group: { _id: null, totalRewards: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const totalReferralRewards = rewardedReferralsResult[0]?.totalRewards || 0;
        const successfulReferrals = (rewardedReferralsResult[0]?.count || 0) / 2; // Pair reward logic

        const growthLoop = {
            totalReferredUsers,
            referralConversionRate: totalReferredUsers > 0 ? Math.round((successfulReferrals / totalReferredUsers) * 100) : 0,
            totalReferralRewards
        };

        res.status(200).json({
            status: 'success',
            data: {
                totalRevenue,
                todayRevenue,
                yieldTrend,
                categoryMatrix, // New: Segregated Analytics
                serviceRevenue,
                productRevenue,
                activeJobs: activeServicesCount,
                activeProductOrders,
                totalActiveOps,
                totalUsers,
                roleCounts,
                totalBookingsAllTime,
                lowStockCount,
                stuckBookings,
                recentBookings: mappedRecentBookings,
                criticalIssues,
                networkLoad,
                onlineCaptains,
                serviceMix,
                growthLoop,
                topNodes: [] // Leaving for now or can keep previous logic
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
            .populate('provider.id')
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
            return res.status(400).json({ status: 'fail', message: 'Booking ID and Captain/Driver ID are required' });
        }

        // Try to find as captain first
        let provider = await User.findOne({ _id: captainId, role: 'captain' });
        let providerType = 'captain';
        
        // If not found, try spare driver
        if (!provider) {
            const SpareDriver = require('../../../models/SpareDriver');
            provider = await SpareDriver.findById(captainId);
            providerType = 'sparedriver';
        }
        
        if (!provider) {
            return res.status(404).json({ status: 'fail', message: 'Captain or Driver not found' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        booking.provider = {
            type: providerType,
            id: provider._id,
            name: provider.name,
            phone: provider.phone,
            rating: provider.rating || provider.reliabilityScore?.score || 5.0,
            photo: provider.profile?.avatar || provider.profile?.photo || ''
        };

        booking.status = 'assigned';
        booking.tracking = booking.tracking || {};
        booking.tracking.assignedAt = new Date();

        await booking.save();

        const io = socketService.getIO();
        io.to(provider._id.toString()).emit('booking_assigned', {
            bookingId: booking._id,
            message: `You have been assigned to booking ${booking.bookingId || booking._id}`
        });
        
        // Broadcast to admin room
        io.to('admin_room').emit('driver_assigned', {
            bookingId: booking._id,
            driverId: provider._id,
            driverName: provider.name
        });

        res.status(200).json({
            status: 'success',
            message: `Booking assigned to ${providerType === 'captain' ? 'captain' : 'driver'} ${provider.name}`,
            data: { booking }
        });
    } catch (error) {
        console.error('Error assigning captain/driver:', error);
        res.status(500).json({ status: 'error', message: 'Failed to assign captain/driver' });
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

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        const oldStatus = booking.status;
        booking.status = status;

        // 💎 INTEGRATION: Arrears Engine & Payout for Hourly Services (Admin Override) 💎
        if (status === 'completed' && oldStatus !== 'completed') {
            booking.tracking = booking.tracking || {};
            if (!booking.tracking.completedAt) booking.tracking.completedAt = new Date();

            const serviceName = booking.service?.name?.toLowerCase() || '';
            const isHourly = serviceName.includes('hourly') || 
                             serviceName.includes('full day') || 
                             serviceName.includes('outstation') ||
                             serviceName.includes('point') ||
                             booking.service?.category === 'Chauffeur';
            
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

                const bookedDurationMs = bookedDurationHrs * 60 * 60 * 1000;
                const gracePeriodMs = 15 * 60 * 1000;

                if (actualDurationMs > (bookedDurationMs + gracePeriodMs)) {
                    const actualDurationHrs = Math.max(1, Math.ceil(actualDurationMs / (1000 * 60 * 60)));
                    const extraHrs = actualDurationHrs - bookedDurationHrs;
                    const hourlyRate = Math.round((booking.pricing.initialPaidAmount || booking.pricing.totalAmount) / bookedDurationHrs) || 180;
                    const extensionFee = extraHrs * hourlyRate;
                    
                    // 🏨 Multi-Day Outstation Allowance Engine (Admin Sync) 🏨
                    if (booking.service?.name?.toLowerCase().includes('outstation')) {
                        const extraDays = Math.floor(extraHrs / 24);
                        if (extraDays > 0) {
                            const extraAllowance = extraDays * 500;
                            booking.pricing.totalAmount += extraAllowance;
                            booking.pricing.breakdown.push({ name: `Stay & Food (Day ${extraDays + 1}+)`, amount: extraAllowance, type: 'arrears' });
                            booking.notes.internal = `${booking.notes.internal || ''}\n[ADMIN-ALOWANCE] Multi-day outstation detected by admin. Added ₹${extraAllowance} for ${extraDays} extra nights.`.trim();
                        }
                    }

                    booking.pricing.totalAmount += extensionFee;
                    booking.pricing.breakdown = booking.pricing.breakdown || [];
                    booking.pricing.breakdown.push({ name: `Trip Extension (${extraHrs}h)`, amount: extensionFee, type: 'arrears' });
                    booking.notes.internal = `${booking.notes.internal || ''}\n[ADMIN ARREARS] Trip manually completed by admin. Arrears calculated: ₹${extensionFee} for ${extraHrs}h.`.trim();
                    
                    // Deduct from consumer if applicable
                    if (booking.payment.method === 'wallet') {
                        await walletHelper.executeWalletTransaction(
                            booking.consumer,
                            extensionFee,
                            'debit',
                            {
                                category: 'SERVICE_CHARGE',
                                description: `Admin Arrears: Trip Extension Fee for #${booking.bookingId || booking._id}`,
                                referenceId: booking._id.toString(),
                                referenceType: 'booking_extension'
                            }
                        ).catch(e => console.error('[Admin] Extension fee deduction failed:', e.message));
                    }
                }
            }

            // 🌙 Phase 11: Real-World Night Allowance Sync 🌙
            const completeHour = new Date(booking.tracking.completedAt).getHours();
            const isNightEnd = completeHour >= 23 || completeHour < 5;
            const hasNightAllowance = (booking.pricing.breakdown || []).some(b => b.name?.includes('Night Shift Allowance')) || 
                                     booking.notes.internal?.includes('Night Shift Allowance');

            if (isNightEnd && !hasNightAllowance) {
                const nightAllowance = 300;
                booking.pricing.totalAmount += nightAllowance;
                booking.notes.internal = `${booking.notes.internal || ''}\n[NIGHT] Trip ended late (${completeHour}:00). Night Shift Allowance added: ₹${nightAllowance}`.trim();
                booking.pricing.breakdown = booking.pricing.breakdown || [];
                booking.pricing.breakdown.push({ name: 'Night Shift Allowance (Admin Sync)', amount: nightAllowance, type: 'surcharge' });
            }

            // Payout Logic for Spare Driver (if not already handled)
            if (booking.provider?.type === 'sparedriver' && booking.provider?.id) {
                const finalPrice = booking.pricing?.totalAmount || 0;
                const { providerPayout } = await commissionHelper.calculatePayout(
                    finalPrice,
                    'sparedriver',
                    { overrideRate: getChauffeurCommissionOverride(booking) }
                );
                
                await walletHelper.executeWalletTransaction(
                    booking.provider.id,
                    providerPayout,
                    'credit',
                    {
                        category: 'SERVICE_BOOKING',
                        description: `Payout for booking #${booking.bookingId || booking._id} (Admin Completed)`,
                        referenceId: booking._id.toString(),
                        referenceType: 'booking_payout'
                    },
                    null,
                    SpareDriver
                ).catch(e => console.error('[Admin] Driver payout failed:', e.message));
            }
        }

        await booking.save();

        // Notify via Socket
        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status
        });

        // Notify Admin Control Tower (Resilience Protocol)
        io.to('admin_room').emit('global_status_update', {
            type: 'task_update',
            bookingId: booking._id,
            status: booking.status,
            serviceType: 'sparedriver'
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

        if (product.vendor) {
            const isApproved = status === 'Live' || status === 'Approved';
            const title = isApproved ? 'Product Verified! 💎' : 'Product Rejected ⚠️';
            const message = isApproved
                ? `Your product "${product.name}" has been verified and is now live on the marketplace!`
                : `Your product "${product.name}" was not approved. Please check the admin notes for more details.`;

            await sendVendorNotification(product.vendor, {
                title,
                message,
                type: 'verification',
                priority: isApproved ? 'medium' : 'high',
                metaData: {
                    productId: product._id,
                    status: product.status
                }
            });

            // Socket notification
            const io = socketService.getIO();
            io.to(product.vendor.toString()).emit('product_status_updated', {
                productId: product._id,
                status: product.status,
                message
            });
        }

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
        const { role, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        let users = [];
        let total = 0;

        if (role === 'captain') {
            const query = { isActive: { $ne: false } };
            total = await Captain.countDocuments(query);
            users = await Captain.find(query)
                .select('-password')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });
        } else if (role === 'sparedriver') {
            const SpareDriver = require('../../../models/SpareDriver');
            const query = { isActive: { $ne: false } };
            total = await SpareDriver.countDocuments(query);
            users = await SpareDriver.find(query)
                .select('-password')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });
        } else {
            const query = { isActive: { $ne: false } };
            if (role) query.role = role;
            total = await User.countDocuments(query);
            users = await User.find(query)
                .select('-password')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });
        }

        res.status(200).json({
            status: 'success',
            results: users.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: { users }
        });
    } catch (error) {
        console.error("Fetch Users Error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to synchronize registry' });
    }
};

// Get all Spare Drivers
exports.getSpareDrivers = async (req, res) => {
    try {
        const SpareDriver = require('../../../models/SpareDriver');
        const drivers = await SpareDriver.find({})
            .select('-password -tokens')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: drivers.length,
            data: { drivers }
        });
    } catch (error) {
        console.error('Error fetching spare drivers:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch spare drivers' });
    }
};

// Get Sparse Driver Specific Bookings
exports.getSpareDriverBookings = async (req, res) => {
    try {
        console.log('[Admin] getSpareDriverBookings called with query:', req.query);
        
        const { status, search, limit = 100, page = 1 } = req.query;
        
        // Build query
        const query = {
            'service.category': 'Chauffeur',
            isActive: true
        };
        
        // Filter by status if provided (support multiple statuses)
        if (status && status !== 'ALL') {
            const statuses = status.split(',').map(s => s.trim().toLowerCase());
            query.status = { $in: statuses };
        }
        
        // Search by booking ID, customer name, or phone
        if (search) {
            query.$or = [
                { bookingId: { $regex: search, $options: 'i' } },
                { 'consumer.name': { $regex: search, $options: 'i' } }
            ];
        }
        
        console.log('[Admin] Query built:', JSON.stringify(query, null, 2));
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const bookings = await Booking.find(query)
            .populate('consumer', 'name phone email profile')
            .populate('vehicle', 'brand model type plate')
            .populate({
                path: 'provider.id',
                select: 'name phone driverId reliabilityScore onlineStatus location currentDutyStatus'
            })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        console.log('[Admin] Found bookings:', bookings.length);

        const total = await Booking.countDocuments(query);

        const mappedBookings = bookings.map(b => {
            const booking = b.toObject();
            
            // Add driver location if available
            if (booking.provider?.id?.location) {
                booking.provider.id.location = {
                    coordinates: booking.provider.id.location.coordinates || {},
                    address: booking.provider.id.location.address || 'Location updating...',
                    lastUpdated: booking.provider.id.location.lastUpdated || null,
                    speed: booking.provider.id.location.speed || 0
                };
            }
            
            return {
                ...booking,
                price: `₹${booking.pricing?.totalAmount || 0}`,
                serviceName: booking.service?.name || 'Chauffeur Service',
                // ✅ Include customer review for admin visibility
                customerReview: booking.feedback ? {
                    rating: booking.feedback.rating,
                    review: booking.feedback.review,
                    photos: booking.feedback.photos,
                    submittedAt: booking.feedback.submittedAt
                } : null
            };
        });

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: { 
                bookings: mappedBookings,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching chauffeur bookings:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to fetch chauffeur bookings',
            error: error.message 
        });
    }
};

exports.getStudioWashConsole = async (req, res) => {
    try {
        const studioCategories = ['Studio', 'Studio Detailing'];

        const [bookings, staff, vendors, studioServices] = await Promise.all([
            Booking.find({
                'service.category': { $in: studioCategories },
                isActive: true
            })
                .populate('consumer', 'name phone email profile')
                .populate('vehicle', 'brand model type plate')
                .populate('provider.id', 'name phone profile.studioName profile.city')
                .populate('pickupStaff', 'name phone profile.photo profile.vendorId')
                .populate('deliveryStaff', 'name phone profile.photo profile.vendorId')
                .sort({ createdAt: -1 }),
            User.find({ role: 'staff', isActive: true })
                .select('name phone profile.vendorId profile.studioName profile.city'),
            User.find({ role: 'vendor', isActive: true })
                .select('name phone email profile.studioName profile.city profile.verificationStatus'),
            Service.find({ category: { $in: studioCategories } })
                .sort({ updatedAt: -1 })
        ]);

        const mappedBookings = bookings.map((booking) => ({
            ...booking.toObject(),
            price: `₹${booking.pricing?.totalAmount || 0}`,
            serviceName: booking.service?.name || 'Studio Wash',
            assignment: {
                pickupStaffId: booking.pickupStaff?._id || null,
                deliveryStaffId: booking.deliveryStaff?._id || null
            }
        }));

        const liveCount = mappedBookings.filter((booking) => (
            !['completed', 'cancelled', 'refunded'].includes(booking.status)
        )).length;

        const unassignedPickup = mappedBookings.filter((booking) => (
            !booking.pickupStaff && !['completed', 'cancelled', 'refunded'].includes(booking.status)
        )).length;

        const unassignedDelivery = mappedBookings.filter((booking) => (
            ['ready-for-delivery', 'delivery-assigned', 'out_for_delivery'].includes(booking.status) && !booking.deliveryStaff
        )).length;

        return res.status(200).json({
            status: 'success',
            data: {
                metrics: {
                    totalStudioBookings: mappedBookings.length,
                    liveStudioBookings: liveCount,
                    totalStudioServices: studioServices.length,
                    activeVendors: vendors.length,
                    activeStaff: staff.length,
                    unassignedPickup,
                    unassignedDelivery
                },
                bookings: mappedBookings,
                staff,
                vendors,
                studioServices
            }
        });
    } catch (error) {
        console.error('Error fetching studio wash console:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch studio wash console' });
    }
};

// Specialized KYC update for Consumers
exports.updateUserKyc = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        // Initialize KYC object if it doesn't exist
        user.kyc = user.kyc || {};
        user.kyc.status = status;
        user.kyc.rejectionReason = note || '';
        user.kyc.reviewedAt = new Date();
        user.kyc.reviewedBy = req.user.id;

        if (status === 'verified') {
            user.isVerified = true;
        } else if (status === 'rejected') {
            user.isVerified = false;
        }

        await user.save({ validateBeforeSave: false });

        // Push Notification & Socket
        const notificationTitle = status === 'verified' ? 'Identity Verified! 🛡️' : 'KYC Rejected ⚠️';
        const notificationMessage = status === 'verified' 
            ? 'Your documents have been verified. You now have "Elite" trust status.' 
            : `Your verification proof was not accepted. Reason: ${note || 'Documents were not clear.'}`;

        // Send formal notification
        await Notification.create({
            user: user._id,
            title: notificationTitle,
            message: notificationMessage,
            type: 'verification',
            priority: status === 'verified' ? 'medium' : 'high'
        });

        const io = socketService.getIO();
        if (io) {
            io.to(user._id.toString()).emit('kyc_status_updated', {
                status,
                message: notificationMessage
            });
        }

        res.status(200).json({
            status: 'success',
            message: `KYC ${status} successfully`,
            data: { kyc: user.kyc }
        });
    } catch (error) {
        console.error('Error updating user KYC:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update identity status' });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('consumer', 'name phone email profile')
            .populate('vehicle', 'brand model type plate')
            .populate('provider.id')
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
            if (updates.hub !== undefined) {
                if (!user.profile) user.profile = {};
                user.profile.hub = updates.hub;
            }
            if (updates.city !== undefined) {
                if (!user.profile) user.profile = {};
                user.profile.city = updates.city;
            }

            // Trigger Notification for Verification
            if ((modelType === 'Captain' || modelType === 'SpareDriver') && updates.isVerified === true) {
                // Enforce Kit Purchase workflow - move to pending_kit instead of direct ACTIVE
                if (user.profile?.kit?.status !== 'COMPLETED') {
                    user.status = 'verified_pending_kit';
                } else {
                    user.status = 'ACTIVE';
                }

                const io = socketService.getIO();
                io.to(user._id.toString()).emit('captain_verified', {
                    message: user.status === 'verified_pending_kit' 
                        ? 'Your documents are verified! Please purchase your activation kit to start working.' 
                        : 'Your account has been verified by an admin. You can now receive requests.'
                });

                await sendCaptainNotification(user._id, {
                    title: 'Verification Approved! 🛡️',
                    message: user.status === 'verified_pending_kit'
                        ? 'Your identity is verified. Next step: Purchase your activation kit to go online.'
                        : 'Congratulations! Your account has been verified. You can now go online.',
                    type: 'verification',
                    priority: 'high'
                });
            }
        } else if (user.role === 'vendor') {
            if (updates.studioName) user.profile.studioName = updates.studioName;
            if (updates.city) user.profile.city = updates.city;
            if (updates.verificationStatus) {
                user.profile.verificationStatus = updates.verificationStatus;

                if (updates.verificationStatus === 'verified') {
                    // Trigger Notification for Verification
                    const io = socketService.getIO();
                    io.to(user._id.toString()).emit('vendor_verified', {
                        message: 'Your studio has been verified! You can now accept bookings and list products.'
                    });

                    await sendVendorNotification(user._id, {
                        title: 'Studio Verified! 🏆',
                        message: 'Welcome to the elite circle! Your studio has been verified by the admin team. You can now receive service orders and sell products on our marketplace.',
                        type: 'verification',
                        priority: 'high'
                    });
                }
            }
        } else if (user.role === 'staff') {
            if (updates.role) user.profile.role = updates.role;
            if (updates.hub !== undefined) {
                if (!user.profile) user.profile = {};
                user.profile.hub = updates.hub;
            }
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
                { key: 'firewall_mode', value: 'Neural', category: 'Security', description: 'Encryption matrix status' },
                { key: 'maintenance_mode', value: false, category: 'Security', description: 'Enable global platform maintenance' },
                { key: 'payout_freeze', value: false, category: 'Security', description: 'Temporarily suspend all wallet withdrawals' }
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

        const oldSetting = await Setting.findOne({ key });
        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, updatedBy: req.user._id },
            { upsert: true, new: true }
        );

        // Record in Audit Log
        await AuditLog.create({
            userId: req.user._id,
            action: 'UPDATE_SETTING',
            resource: 'Setting',
            resourceId: setting._id,
            oldValue: oldSetting ? oldSetting.value : null,
            newValue: value,
            metadata: {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        res.status(200).json({
            status: 'success',
            data: { setting }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to update setting' });
    }
};

// --- GLOBAL PRODUCT ORDER MANAGEMENT (PHASE 28) ---

exports.getAllProductOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { isActive: true };
        if (status && status !== 'All') query.status = status;

        const orders = await ProductOrder.find(query)
            .populate('consumer', 'name email phone')
            .populate('items.vendor', 'name profile.studioName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: { orders }
        });
    } catch (error) {
        console.error('Error fetching global product orders:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch global product orders' });
    }
};

exports.updateGlobalProductOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const order = await ProductOrder.findById(id);
        if (!order) {
            return res.status(404).json({ status: 'fail', message: 'Order not found' });
        }

        order.status = status;
        order.history.push({
            status,
            timestamp: new Date(),
            note: note || `Status updated to ${status} by Admin.`
        });

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order status updated successfully',
            data: { order }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Update failed' });
    }
};

// --- NOTIFICATION MANAGEMENT ---

// Get all admin notifications
exports.getNotifications = async (req, res) => {
    try {
        const { page, limit, type, isRead, priority } = req.query;

        // Safely parse isRead boolean
        let isReadParsed = undefined;
        if (isRead === 'true') isReadParsed = true;
        if (isRead === 'false') isReadParsed = false;

        const options = {
            page,
            limit,
            type,
            isRead: isReadParsed,
            priority
        };

        const result = await Notification.getAdminNotifications(options);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
    }
};

// Mark a notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ status: 'fail', message: 'Notification not found' });
        }

        await notification.markAsRead();

        res.status(200).json({
            status: 'success',
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ status: 'error', message: 'Update failed' });
    }
};

// Mark all admin notifications as read
exports.clearAllNotifications = async (req, res) => {
    try {
        await Notification.updateMany(
            { isAdmin: true, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error clearing admin notifications:', error);
        res.status(500).json({ status: 'error', message: 'Failed to clear notifications' });
    }
};
