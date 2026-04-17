const Booking = require('../../../models/Booking');
const User = require('../../../models/User');

// Get Detailed Analytics (P6)
exports.getDetailedAnalytics = async (req, res) => {
    try {
        const { timeRange, category } = req.query;
        let startDate;
        const now = new Date();
        const SERVICE_TYPE = process.env.SERVICE_TYPE || 'sparedriver';
        const baseQuery = { isActive: true, 'service.type': SERVICE_TYPE };

        // 1. Unified Filter Engine
        if (category && category !== 'All' && category !== 'Global history') {
            baseQuery['service.category'] = category;
        }

        switch (timeRange) {
            case 'Last 7 Days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'Last 30 Days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'Year-to-Date':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        baseQuery.createdAt = { $gte: startDate };

        // 2. Revenue & Volume Velocity
        const isSmallRange = timeRange === 'Last 7 Days' || timeRange === 'Last 30 Days';
        
        const revenueTimeline = await Booking.aggregate([
            { $match: { ...baseQuery, status: 'completed' } },
            {
                $group: {
                    _id: isSmallRange ? {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    } : {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.totalAmount' },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // 3. Operational Composition (Always global Mix unless specified)
        const opsMix = await Booking.aggregate([
            { $match: { createdAt: { $gte: startDate }, isActive: true, 'service.type': SERVICE_TYPE } },
            {
                $group: {
                    _id: '$service.category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 4. User Growth
        const userGrowth = await User.countDocuments({
            isActive: true,
            createdAt: { $gte: startDate }
        });

        // 5. Aggregated Metrics
        const periodTotalRevenue = revenueTimeline.reduce((sum, item) => sum + item.revenue, 0);
        const periodTotalBookings = revenueTimeline.reduce((sum, item) => sum + item.bookings, 0);

        // 6. Active pipeline count
        const activeJobs = await Booking.countDocuments({
            ...baseQuery,
            status: { $nin: ['completed', 'cancelled', 'refunded'] }
        });

        res.status(200).json({
            status: 'success',
            data: {
                revenueTimeline,
                opsMix,
                userGrowth,
                periodTotalRevenue,
                periodTotalBookings,
                activeJobs,
                timeRange
            }
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
