const Booking = require('../../../models/Booking');
const User = require('../../../models/User');

// Get Detailed Analytics (P6)
exports.getDetailedAnalytics = async (req, res) => {
    try {
        const { timeRange } = req.query;
        let startDate;
        const now = new Date();

        switch (timeRange) {
            case 'Last 7 Days':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'Last 30 Days':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case 'Year-to-Date':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 30));
        }

        // 1. Revenue Velocity (Daily granularity for small ranges, Monthly for large)
        const isSmallRange = timeRange === 'Last 7 Days' || timeRange === 'Last 30 Days';
        
        const revenueTimeline = await Booking.aggregate([
            {
                $match: {
                    status: 'completed',
                    isActive: true,
                    createdAt: { $gte: startDate }
                }
            },
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
                    revenue: { $sum: '$pricing.totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // 2. Operational Composition (Category Distribution)
        const opsMix = await Booking.aggregate([
            {
                $match: {
                    isActive: true,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$service.category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. User Growth
        const userGrowth = await User.countDocuments({
            isActive: true,
            createdAt: { $gte: startDate }
        });

        // 4. Total Revenue for period
        const periodTotalRevenue = revenueTimeline.reduce((sum, item) => sum + item.revenue, 0);

        // 5. Active pipeline count
        const activeJobs = await Booking.countDocuments({
            status: { $nin: ['completed', 'cancelled', 'refunded'] },
            isActive: true,
            createdAt: { $gte: startDate }
        });

        res.status(200).json({
            status: 'success',
            data: {
                revenueTimeline,
                opsMix,
                userGrowth,
                periodTotalRevenue,
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
