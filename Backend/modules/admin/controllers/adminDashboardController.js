const Booking = require('../../../models/Booking');
const SpareDriver = require('../../../models/SpareDriver');
const User = require('../../../models/User');
const SOSAlert = require('../../../models/SOSAlert');
const SupportTicket = require('../../../models/SupportTicket');
const ChatRoom = require('../../../models/ChatRoom');
const Promotion = require('../../../models/Promotion');
const Task = require('../../../models/Task');
const catchAsync = require('../../../utils/catchAsync');
const { PLATFORM_MODE } = require('../../../middleware/featureGuard');
const mongoose = require('mongoose');

// ─── CONFIGURATION & CONSTANTS ───────────────────────────────────
const SERVICE_TYPE = process.env.SERVICE_TYPE || 'sparedriver';
const ONGOING_STATUSES = ['accepted', 'assigned', 'en_route', 'arrived', 'active', 'picked-up', 'in_progress', 'washing', 'at-studio'];

/**
 * PRODUCTION-GRADE DASHBOARD CONTROLLER - PHASE 2 (DATA CONTRACT)
 * Redesigned to support the "Industrial Pro" cockpit UI.
 * Aggregates multi-module data for KPIs, Trends, Alerts, and Operations.
 */
exports.getDashboard = catchAsync(async (req, res) => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ─── 1. PARALLEL AGGREGATION ─────────────────────────────────────
    const [
        kpis,
        bookingByStatus,
        alertsOverview,
        driverStatusBreakdown,
        earningsOverview,
        trends,
        recentBookings,
        liveTrips,
        taskSummary,
        couponsAds,
        sosLive,
        refundRequests
    ] = await Promise.all([
        // A. KPI Aggregation (Today)
        Booking.aggregate([
            { 
                $match: { 
                    'service.type': SERVICE_TYPE, 
                    isActive: true, 
                    createdAt: { $gte: startOfToday } 
                } 
            },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    totalRevenue: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$pricing.totalAmount', 0] } 
                    },
                    cancelledBookings: { 
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } 
                    },
                    ongoingTrips: {
                        $sum: { $cond: [{ $in: ['$status', ONGOING_STATUSES] }, 1, 0] }
                    }
                }
            }
        ]),

        // B. Bookings by Status (Donut Chart)
        Booking.aggregate([
            { $match: { 'service.type': SERVICE_TYPE, isActive: true, createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        // C. Alerts Overview Counts
        Promise.all([
            SOSAlert.countDocuments({ status: 'active' }),
            Booking.countDocuments({ 'payment.status': 'refund_pending' }),
            SupportTicket.countDocuments({ status: 'open' }),
            ChatRoom.countDocuments({ status: 'active', 'metadata.lastMessageFrom': 'user' }), // Mocking unread logic
            SpareDriver.countDocuments({ status: 'PENDING' })
        ]),

        // D. Driver Status Breakdown
        Promise.all([
            SpareDriver.countDocuments({ isOnline: true, status: 'ACTIVE' }),
            Booking.countDocuments({ 'service.type': SERVICE_TYPE, status: { $in: ONGOING_STATUSES }, isActive: true }),
            SpareDriver.countDocuments({ isOnline: false, status: 'ACTIVE' })
        ]),

        // E. Earnings Overview (Today)
        Booking.aggregate([
            { 
                $match: { 
                    'service.type': SERVICE_TYPE, 
                    status: 'completed', 
                    isActive: true, 
                    createdAt: { $gte: startOfToday } 
                } 
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricing.totalAmount' },
                    driverPayouts: { $sum: '$pricing.driverEarning' },
                    platformCommission: { $sum: '$pricing.platformCommission' },
                    otherEarnings: { $sum: 0 } // Reserved for fees/addons
                }
            }
        ]),

        // F. Trends (7 Days)
        Booking.aggregate([
            { 
                $match: { 
                    'service.type': SERVICE_TYPE, 
                    isActive: true, 
                    createdAt: { $gte: sevenDaysAgo } 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    bookings: { $sum: 1 },
                    revenue: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$pricing.totalAmount', 0] } 
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]),

        // G. Recent Bookings (List)
        Booking.find({ 'service.type': SERVICE_TYPE, isActive: true })
            .select('bookingId createdAt status pricing.totalAmount location.address.city')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),

        // H. Live Trips (List)
        Booking.find({ 
            'service.type': SERVICE_TYPE, 
            status: { $in: ONGOING_STATUSES },
            isActive: true 
        })
            .populate('consumer', 'name')
            .populate('provider.id', 'name')
            .select('bookingId status consumer provider location.address tracking')
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean(),

        // I. Task Summary
        Promise.all([
            Task.countDocuments({}),
            Task.countDocuments({ status: 'pending' }),
            Task.countDocuments({ status: 'in_progress' }),
            Task.countDocuments({ status: 'completed' }),
            Task.find({}).sort({ createdAt: -1 }).limit(4).lean()
        ]),

        // J. Coupons & Ads
        Promise.all([
            Promotion.find({ type: 'Coupons', status: 'Active' }).limit(4).lean(),
            Promotion.find({ type: 'Banners', status: 'Active' }).limit(4).lean()
        ]),

        // K. SOS Live Feed
        SOSAlert.find({ status: 'active' })
            .populate('consumer', 'name phone')
            .sort({ createdAt: -1 })
            .limit(3)
            .lean(),

        // L. Refund Requests
        Booking.find({ 'payment.status': 'refund_pending', isActive: true })
            .populate('consumer', 'name')
            .select('bookingId consumer pricing.totalAmount createdAt status')
            .sort({ createdAt: -1 })
            .limit(3)
            .lean()
    ]);

    // ─── 2. DATA POST-PROCESSING ─────────────────────────────────────
    const processedKPIs = kpis[0] || { totalBookings: 0, totalRevenue: 0, cancelledBookings: 0, ongoingTrips: 0 };
    const activeDriversCount = await SpareDriver.countDocuments({ isOnline: true, status: 'ACTIVE' });

    // Format Trends for 7 days (fill gaps)
    const trendsFormatted = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayData = trends.find(t => t._id === dateStr) || { bookings: 0, revenue: 0 };
        trendsFormatted.push({ date: dateStr, bookings: dayData.bookings, revenue: dayData.revenue });
    }

    // Earnings Overview formatting
    const earnings = earningsOverview[0] || { totalRevenue: 0, driverPayouts: 0, platformCommission: 0, otherEarnings: 0 };

    // ─── 3. FINAL RESPONSE ───────────────────────────────────────────
    res.status(200).json({
        status: 'success',
        meta: {
            timestamp: new Date(),
            platform: PLATFORM_MODE,
            version: "2.1.0"
        },
        data: {
            kpis: {
                totalBookings: processedKPIs.totalBookings,
                totalRevenue: processedKPIs.totalRevenue,
                activeDrivers: activeDriversCount,
                ongoingTrips: processedKPIs.ongoingTrips,
                cancelledBookings: processedKPIs.cancelledBookings,
                sosAlerts: alertsOverview[0]
            },
            charts: {
                bookingTrend: trendsFormatted.map(t => ({ day: t.date, count: t.bookings })),
                revenueTrend: trendsFormatted.map(t => ({ day: t.date, amount: t.revenue })),
                bookingByStatus: bookingByStatus.map(s => ({ status: s._id, count: s.count }))
            },
            alertsOverview: {
                sosAlerts: alertsOverview[0],
                pendingRefunds: alertsOverview[1],
                openTickets: alertsOverview[2],
                unreadChats: alertsOverview[3],
                kycPending: alertsOverview[4]
            },
            operations: {
                recentBookings: recentBookings.map(b => ({
                    id: b.bookingId,
                    time: b.createdAt,
                    city: b.location?.address?.city || 'Unknown',
                    amount: b.pricing?.totalAmount || 0,
                    status: b.status
                })),
                liveTrips: liveTrips.map(t => ({
                    id: t.bookingId,
                    customer: t.consumer?.name || 'N/A',
                    driver: t.provider?.name || 'N/A',
                    status: t.status,
                    location: t.location?.address?.street || 'On Trip'
                })),
                driverStatus: {
                    online: driverStatusBreakdown[0],
                    onTrip: driverStatusBreakdown[1],
                    offline: driverStatusBreakdown[2]
                },
                earnings: {
                    totalRevenue: earnings.totalRevenue,
                    driverPayouts: earnings.driverPayouts,
                    platformCommission: earnings.platformCommission,
                    otherEarnings: earnings.otherEarnings
                }
            },
            bottomRow: {
                tasks: {
                    total: taskSummary[0],
                    pending: taskSummary[1],
                    inProgress: taskSummary[2],
                    completed: taskSummary[3],
                    recent: taskSummary[4].map(t => ({
                        title: t.title,
                        priority: t.priority,
                        createdAt: t.createdAt
                    }))
                },
                coupons: couponsAds[0].map(c => ({
                    code: c.code,
                    discount: c.val,
                    expiry: c.expiry,
                    usage: c.usage,
                    status: c.status
                })),
                advertisements: couponsAds[1].map(a => ({
                    title: a.title,
                    image: a.image,
                    status: a.status,
                    impressions: a.usage // Using usage as impression proxy for now
                }))
            },
            footer: {
                sosLive: sosLive.map(s => ({
                    id: s._id,
                    user: s.consumer?.name,
                    location: s.location?.address,
                    time: s.createdAt,
                    status: s.status
                })),
                refundRequests: refundRequests.map(r => ({
                    id: r.bookingId,
                    customer: r.consumer?.name,
                    amount: r.pricing?.totalAmount,
                    reason: 'Driver cancelled', // Mock reason as it's not in schema yet
                    status: r.status
                })),
                socialCampaigns: [
                    { platform: 'Instagram', clicks: 12456, engagement: '8.2%', status: 'Active' },
                    { platform: 'Facebook', clicks: 8932, engagement: '6.1%', status: 'Active' }
                ] // Mocking social as no model exists yet
            }
        }
    });
});
