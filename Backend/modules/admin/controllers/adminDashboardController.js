const Booking = require('../../../models/Booking');
const SpareDriver = require('../../../models/SpareDriver');
const User = require('../../../models/User');
const SOSAlert = require('../../../models/SOSAlert');
const catchAsync = require('../../../utils/catchAsync');
const { PLATFORM_MODE } = require('../../../middleware/featureGuard');

// ─── CONFIGURATION & CONSTANTS ───────────────────────────────────
const SERVICE_TYPE = process.env.SERVICE_TYPE || 'sparedriver';
const LOAD_THRESHOLD = 0.8;
const CANCELLATION_THRESHOLD = 0.15; // 15% cancellation rate alert
const IDLE_THRESHOLD_MINUTES = 30;
const OVERWORK_THRESHOLD_HOURS = 12;
const ACTIVE_TRIP_STATUSES = [
    'accepted',
    'assigned',
    'en_route',
    'arrived',
    'active',
    'picked-up',
    'in_progress'
];

/**
 * PRODUCTION-GRADE DASHBOARD CONTROLLER - UPGRADED
 * Aggregates Spare Driver platform metrics with advanced analytics.
 * Includes: Utilization, Cancellation, Duty Hours, Hybrid Booking Split, Enhanced Alerts
 */
exports.getDashboard = catchAsync(async (req, res) => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - IDLE_THRESHOLD_MINUTES * 60 * 1000);

    // ─── 1. CORE KPIs (PARALLEL AGGREGATION) ─────────────────────────
    const [
        totalDrivers,
        activeDrivers,
        totalUsers,
        totalBookings,
        todayStats,
        activeTripsCount,
        bookingTypeStats,
        completedBookings,
        cancelledBookings,
        idleDrivers,
        dutyHoursData,
        activeSOSAlerts
    ] = await Promise.all([
        SpareDriver.countDocuments({}),
        SpareDriver.countDocuments({ isActive: true, isOnline: true }),
        User.countDocuments({ role: 'consumer', isActive: true }),
        Booking.countDocuments({ 'service.type': SERVICE_TYPE, isActive: true }),
        
        // Today's bookings and revenue
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
                    count: { $sum: 1 },
                    revenue: { 
                        $sum: { 
                            $cond: [{ $eq: ['$status', 'completed'] }, '$pricing.totalAmount', 0] 
                        } 
                    }
                }
            }
        ]),
        
        // Active trips count
        Booking.countDocuments({ 
            'service.type': SERVICE_TYPE, 
            status: { $in: ACTIVE_TRIP_STATUSES },
            isActive: true
        }),
        
        // Booking type split (instant vs scheduled)
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
                    _id: '$schedule.type',
                    count: { $sum: 1 }
                }
            }
        ]),
        
        // Completed bookings (for fulfillment rate)
        Booking.countDocuments({
            'service.type': SERVICE_TYPE,
            status: 'completed',
            isActive: true
        }),
        
        // Cancelled bookings (for cancellation rate)
        Booking.countDocuments({
            'service.type': SERVICE_TYPE,
            status: 'cancelled',
            isActive: true
        }),
        
        // Idle drivers (online but no activity for 30+ min)
        SpareDriver.find({
            isActive: true,
            isOnline: true,
            lastActive: { $lt: thirtyMinutesAgo }
        }).select('name driverId phone lastActive').lean(),
        
        // Calculate duty hours from completed bookings today
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
                    _id: '$provider.id',
                    totalMinutes: {
                        $sum: {
                            $divide: [
                                { $subtract: ['$completedAt', '$acceptedAt'] },
                                60000 // Convert ms to minutes
                            ]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalHours: { $sum: { $divide: ['$totalMinutes', 60] } },
                    driverCount: { $sum: 1 }
                }
            }
        ]),
        
        // Active SOS Alerts (last 24 hours)
        SOSAlert.find({
            status: 'active',
            createdAt: { $gte: oneDayAgo }
        })
        .populate('consumer', 'name phone profile.avatar')
        .populate('responders.user', 'name phone')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    ]);

    // ─── 2. CALCULATE ADVANCED METRICS ───────────────────────────────
    const instantBookings = bookingTypeStats.find(b => b._id === 'instant')?.count || 0;
    const scheduledBookings = bookingTypeStats.find(b => b._id === 'scheduled')?.count || 0;
    
    const utilizationRate = totalDrivers > 0 ? ((activeDrivers / totalDrivers) * 100).toFixed(1) : 0;
    const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0;
    const fulfillmentRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0;
    
    const activeDutyHours = dutyHoursData[0]?.totalHours || 0;
    const revenuePerHour = activeDutyHours > 0 
        ? ((todayStats[0]?.revenue || 0) / activeDutyHours).toFixed(0) 
        : 0;

    // ─── 3. LIVE TRIPS & RECENT ACTIVITY ─────────────────────────────
    const [liveTrips, recentActivities] = await Promise.all([
        Booking.find({ 
            'service.type': SERVICE_TYPE, 
            status: { $in: ACTIVE_TRIP_STATUSES },
            isActive: true 
        })
        .populate('consumer', 'name phone profile.avatar')
        .populate('provider.id', 'name phone driverId')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),

        Booking.find({ 'service.type': SERVICE_TYPE, isActive: true })
        .populate('consumer', 'name')
        .populate('provider.id', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    // ─── 4. PERFORMANCE CHARTS (7 DAYS) ──────────────────────────────
    const [chartsData, bookingTypeChartData, utilizationChartData, cancellationChartData] = await Promise.all([
        // Existing: Bookings & Revenue
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
                        $sum: { 
                            $cond: [{ $eq: ['$status', 'completed'] }, '$pricing.totalAmount', 0] 
                        } 
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]),
        
        // New: Instant vs Scheduled trend
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
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        type: '$schedule.type'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]),
        
        // New: Driver utilization trend (daily active/total ratio)
        SpareDriver.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    dailyActive: [
                        {
                            $match: {
                                isActive: true,
                                updatedAt: { $gte: sevenDaysAgo }
                            }
                        },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                                active: { $sum: 1 }
                            }
                        },
                        { $sort: { "_id": 1 } }
                    ]
                }
            }
        ]),
        
        // New: Cancellation trend
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
                    total: { $sum: 1 },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    rate: {
                        $multiply: [
                            { $divide: ['$cancelled', '$total'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ])
    ]);

    // Fill missing days for chart stability
    const charts = { 
        bookings: [], 
        revenue: [], 
        instantVsScheduled: [],
        utilization: [],
        cancellation: []
    };
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Existing charts
        const dayData = chartsData.find(item => item._id === dateStr) || { bookings: 0, revenue: 0 };
        charts.bookings.push({ date: dateStr, count: dayData.bookings });
        charts.revenue.push({ date: dateStr, amount: dayData.revenue });
        
        // Instant vs Scheduled
        const instantCount = bookingTypeChartData.find(b => b._id.date === dateStr && b._id.type === 'instant')?.count || 0;
        const scheduledCount = bookingTypeChartData.find(b => b._id.date === dateStr && b._id.type === 'scheduled')?.count || 0;
        charts.instantVsScheduled.push({ 
            date: dateStr, 
            instant: instantCount, 
            scheduled: scheduledCount 
        });
        
        // Utilization
        const totalDriverCount = utilizationChartData[0]?.total[0]?.count || 1;
        const activeCount = utilizationChartData[0]?.dailyActive.find(d => d._id === dateStr)?.active || 0;
        const utilizationPercent = ((activeCount / totalDriverCount) * 100).toFixed(1);
        charts.utilization.push({ date: dateStr, rate: parseFloat(utilizationPercent) });
        
        // Cancellation
        const cancellationData = cancellationChartData.find(c => c._id === dateStr);
        charts.cancellation.push({ 
            date: dateStr, 
            rate: cancellationData?.rate ? parseFloat(cancellationData.rate.toFixed(1)) : 0 
        });
    }

    // ─── 5. ENHANCED SMART ALERTS ────────────────────────────────────
    const alerts = [];
    
    // Alert: CRITICAL - Active SOS Alerts
    if (activeSOSAlerts.length > 0) {
        alerts.push({
            type: 'CRITICAL',
            category: 'SOS_EMERGENCY',
            message: `${activeSOSAlerts.length} active SOS alert${activeSOSAlerts.length > 1 ? 's' : ''} require immediate attention`,
            data: activeSOSAlerts.map(sos => ({
                id: sos._id,
                consumer: sos.consumer?.name || 'Unknown',
                phone: sos.consumer?.phone || 'N/A',
                location: sos.location?.address || 'Location unavailable',
                coordinates: sos.location?.coordinates,
                description: sos.description || 'No description provided',
                createdAt: sos.createdAt,
                respondersCount: sos.responders?.length || 0,
                timeSinceAlert: Math.floor((Date.now() - new Date(sos.createdAt)) / 60000) // minutes
            })),
            suggestion: 'Dispatch nearest available drivers or contact emergency services immediately'
        });
    }
    
    // Alert: High cancellation rate
    if (parseFloat(cancellationRate) > (CANCELLATION_THRESHOLD * 100)) {
        alerts.push({
            type: 'CRITICAL',
            category: 'CANCELLATION_RATE',
            message: `Cancellation rate is ${cancellationRate}% (threshold: ${CANCELLATION_THRESHOLD * 100}%)`,
            suggestion: 'Review driver quality, customer expectations, and booking flow'
        });
    }
    
    // Alert: Low driver availability
    if (activeDrivers < 5 && totalDrivers > 10) {
        alerts.push({
            type: 'WARNING',
            category: 'LOW_AVAILABILITY',
            message: `Only ${activeDrivers} drivers online out of ${totalDrivers} total`,
            suggestion: 'Send push notifications or incentives to bring drivers online'
        });
    }
    
    // Alert: Idle drivers
    if (idleDrivers.length > 0) {
        alerts.push({
            type: 'WARNING',
            category: 'IDLE_DRIVERS',
            message: `${idleDrivers.length} drivers are online but idle for ${IDLE_THRESHOLD_MINUTES}+ minutes`,
            data: idleDrivers.slice(0, 5),
            suggestion: 'Check driver app connectivity or send engagement notifications'
        });
    }
    
    // Alert: Overworked drivers (check if any driver has > threshold hours today)
    const overworkedDrivers = await Booking.aggregate([
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
                _id: '$provider.id',
                totalHours: {
                    $sum: {
                        $divide: [
                            { $divide: [
                                { $subtract: ['$completedAt', '$acceptedAt'] },
                                60000
                            ] },
                            60
                        ]
                    }
                }
            }
        },
        {
            $match: {
                totalHours: { $gt: OVERWORK_THRESHOLD_HOURS }
            }
        }
    ]);
    
    if (overworkedDrivers.length > 0) {
        alerts.push({
            type: 'WARNING',
            category: 'OVERWORKED_DRIVERS',
            message: `${overworkedDrivers.length} drivers have worked more than ${OVERWORK_THRESHOLD_HOURS} hours today`,
            suggestion: 'Monitor driver fatigue and consider mandatory breaks'
        });
    }
    
    // Alert: Inactive qualified drivers (Security/Engagement risk)
    const inactiveHighRisk = await SpareDriver.find({ 
        isActive: true, 
        isOnline: false, 
        status: 'ACTIVE',
        updatedAt: { $lt: oneDayAgo } 
    }).limit(5).select('name driverId phone');

    if (inactiveHighRisk.length > 0) {
        alerts.push({
            type: 'WARNING',
            category: 'FLEET_ENGAGEMENT',
            message: `${inactiveHighRisk.length} active drivers have not logged in for 24h`,
            data: inactiveHighRisk
        });
    }

    // Alert: High load warning (Dynamic threshold)
    if (activeTripsCount > activeDrivers * LOAD_THRESHOLD && activeDrivers > 0) {
        alerts.push({
            type: 'CRITICAL',
            category: 'LOAD_BALANCING',
            message: `Dispatch load is at ${(activeTripsCount/activeDrivers*100).toFixed(0)}% capacity`,
            suggestion: 'Consider surge pricing or boosting driver incentives'
        });
    }

    // ─── 6. FINAL ASSEMBLY ──────────────────────────────────────────
    res.status(200).json({
        status: 'success',
        meta: {
            timestamp: new Date(),
            platform: PLATFORM_MODE,
            version: "2.0.0"
        },
        data: {
            kpis: {
                // Existing KPIs
                totalDrivers,
                activeDrivers,
                totalUsers,
                totalBookings,
                todayBookings: todayStats[0]?.count || 0,
                todayRevenue: todayStats[0]?.revenue || 0,
                activeTrips: activeTripsCount,
                
                // New KPIs
                utilizationRate: parseFloat(utilizationRate),
                cancellationRate: parseFloat(cancellationRate),
                fulfillmentRate: parseFloat(fulfillmentRate),
                revenuePerHour: parseFloat(revenuePerHour),
                activeDutyHours: parseFloat(activeDutyHours.toFixed(1)),
                
                // SOS KPI
                activeSOSCount: activeSOSAlerts.length
            },
            bookingSplit: {
                instant: instantBookings,
                scheduled: scheduledBookings
            },
            sosAlerts: activeSOSAlerts.map(sos => ({
                id: sos._id,
                consumer: {
                    name: sos.consumer?.name || 'Unknown',
                    phone: sos.consumer?.phone || 'N/A',
                    avatar: sos.consumer?.profile?.avatar
                },
                location: {
                    address: sos.location?.address || 'Location unavailable',
                    coordinates: sos.location?.coordinates
                },
                status: sos.status,
                description: sos.description || 'No description provided',
                photo: sos.photo,
                responders: sos.responders?.map(r => ({
                    name: r.user?.name || 'Unknown',
                    phone: r.user?.phone,
                    role: r.role,
                    status: r.status,
                    respondedAt: r.respondedAt
                })) || [],
                createdAt: sos.createdAt,
                timeSinceAlert: Math.floor((Date.now() - new Date(sos.createdAt)) / 60000) // minutes
            })),
            liveTrips,
            recentActivities: recentActivities.map(b => ({
                id: b.bookingId,
                serviceName: b.service.name,
                customer: b.consumer?.name,
                driver: b.provider?.name,
                status: b.status,
                amount: b.pricing.totalAmount,
                createdAt: b.createdAt
            })),
            alerts,
            charts
        }
    });
});
