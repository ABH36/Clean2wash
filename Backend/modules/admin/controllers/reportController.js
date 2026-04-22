const Booking = require('../../../models/Booking');
const User = require('../../../models/User');
const SpareDriver = require('../../../models/SpareDriver');
const WalletTransaction = require('../../../models/WalletTransaction');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ══════════════════════════════════════════════════════════════════════════════
// DATA FETCHING HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const fetchRevenueData = async (params) => {
    const { period = 'monthly', startDate, endDate, serviceType } = params;
    let dateFilter = {};
    const now = new Date();

    switch (period) {
        case 'daily':
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
            break;
        case 'weekly':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { $gte: startOfWeek } };
            break;
        case 'monthly':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { $gte: startOfMonth } };
            break;
        case 'custom':
            if (!startDate || !endDate) throw new AppError('Dates required', 400);
            dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
            break;
    }

    const query = { status: 'completed', isActive: true, ...dateFilter };
    if (serviceType) query['service.type'] = serviceType;

    const [summaryData, serviceWise, dailyTrend, paymentMethods] = await Promise.all([
        Booking.aggregate([{ $match: query }, { $group: { _id: null, totalRevenue: { $sum: '$pricing.totalAmount' }, totalBookings: { $sum: 1 }, averageBookingValue: { $avg: '$pricing.totalAmount' }, totalCommission: { $sum: '$payment.platformCommissionAmount' }, totalDriverPayout: { $sum: '$payment.providerPayoutAmount' } } }]),
        Booking.aggregate([{ $match: query }, { $group: { _id: '$service.name', revenue: { $sum: '$pricing.totalAmount' }, bookings: { $sum: 1 }, avgValue: { $avg: '$pricing.totalAmount' } } }, { $sort: { revenue: -1 } }]),
        Booking.aggregate([{ $match: { status: 'completed', isActive: true, createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$pricing.totalAmount' }, bookings: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
        Booking.aggregate([{ $match: query }, { $group: { _id: '$payment.method', revenue: { $sum: '$pricing.totalAmount' }, count: { $sum: 1 } } }])
    ]);

    return {
        summary: summaryData[0] || { totalRevenue: 0, totalBookings: 0, averageBookingValue: 0, totalCommission: 0, totalDriverPayout: 0 },
        serviceWise,
        dailyTrend,
        paymentMethods,
        period,
        dateRange: { start: dateFilter.createdAt?.$gte, end: dateFilter.createdAt?.$lte || now }
    };
};

const fetchDriverEarningsData = async (params) => {
    const { period = 'monthly', driverId, startDate, endDate } = params;
    let dateFilter = {};
    const now = new Date();

    switch (period) {
        case 'daily': dateFilter = { createdAt: { $gte: new Date(now.setHours(0,0,0,0)) } }; break;
        case 'weekly':
            const sw = new Date(now); sw.setDate(now.getDate() - now.getDay()); sw.setHours(0,0,0,0);
            dateFilter = { createdAt: { $gte: sw } }; break;
        case 'monthly': dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } }; break;
        case 'custom':
            if (!startDate || !endDate) throw new AppError('Dates required', 400);
            dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }; break;
    }

    const query = { status: 'completed', isActive: true, 'service.type': 'sparedriver', ...dateFilter };
    if (driverId) query['provider.id'] = driverId;

    const driverEarnings = await Booking.aggregate([
        { $match: query },
        { $group: { _id: '$provider.id', driverName: { $first: '$provider.name' }, totalEarnings: { $sum: '$payment.providerPayoutAmount' }, totalTrips: { $sum: 1 }, totalRevenue: { $sum: '$pricing.totalAmount' }, avgEarningsPerTrip: { $avg: '$payment.providerPayoutAmount' }, totalCommission: { $sum: '$payment.platformCommissionAmount' } } },
        { $sort: { totalEarnings: -1 } },
        { $limit: 50 }
    ]);

    return {
        driverEarnings,
        topPerformers: driverEarnings.slice(0, 10),
        summary: {
            totalDrivers: driverEarnings.length,
            totalEarnings: driverEarnings.reduce((sum, d) => sum + d.totalEarnings, 0),
            totalTrips: driverEarnings.reduce((sum, d) => sum + d.totalTrips, 0),
            avgEarningsPerDriver: driverEarnings.length > 0 ? driverEarnings.reduce((sum, d) => sum + d.totalEarnings, 0) / driverEarnings.length : 0
        },
        period
    };
};

const fetchBookingAnalyticsData = async (params) => {
    const { period = 'monthly', startDate, endDate } = params;
    let dateFilter = {};
    const now = new Date();

    switch (period) {
        case 'daily': dateFilter = { createdAt: { $gte: new Date(now.setHours(0,0,0,0)) } }; break;
        case 'weekly':
            const sw = new Date(now); sw.setDate(now.getDate() - now.getDay()); sw.setHours(0,0,0,0);
            dateFilter = { createdAt: { $gte: sw } }; break;
        case 'monthly': dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } }; break;
        case 'custom':
            if (!startDate || !endDate) throw new AppError('Dates required', 400);
            dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }; break;
    }

    const [statusBreakdown, avgDuration, peakHours, serviceDistribution] = await Promise.all([
        Booking.aggregate([{ $match: { isActive: true, ...dateFilter } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        Booking.aggregate([{ $match: { status: 'completed', isActive: true, 'tracking.startedAt': { $exists: true }, 'tracking.completedAt': { $exists: true }, ...dateFilter } }, { $project: { duration: { $subtract: ['$tracking.completedAt', '$tracking.startedAt'] } } }, { $group: { _id: null, avgDuration: { $avg: '$duration' } } }]),
        Booking.aggregate([{ $match: { isActive: true, ...dateFilter } }, { $project: { hour: { $hour: '$createdAt' } } }, { $group: { _id: '$hour', bookings: { $sum: 1 } } }, { $sort: { bookings: -1 } }]),
        Booking.aggregate([{ $match: { isActive: true, ...dateFilter } }, { $group: { _id: '$service.type', count: { $sum: 1 }, revenue: { $sum: '$pricing.totalAmount' } } }, { $sort: { count: -1 } }])
    ]);

    const totalBookings = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
    const completed = statusBreakdown.find(s => s._id === 'completed')?.count || 0;
    const cancelled = statusBreakdown.find(s => s._id === 'cancelled')?.count || 0;

    return {
        summary: {
            totalBookings,
            completedBookings: completed,
            cancelledBookings: cancelled,
            completionRate: totalBookings > 0 ? (completed / totalBookings * 100).toFixed(2) : 0,
            cancellationRate: totalBookings > 0 ? (cancelled / totalBookings * 100).toFixed(2) : 0,
            avgTripDuration: avgDuration[0]?.avgDuration ? Math.round(avgDuration[0].avgDuration / 60000) : 0
        },
        statusBreakdown,
        peakHours,
        serviceDistribution,
        period
    };
};

const fetchFinancialSummaryData = async (params) => {
    const { period = 'monthly', startDate, endDate } = params;
    let dateFilter = {};
    const now = new Date();

    switch (period) {
        case 'monthly': dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } }; break;
        case 'custom':
            if (!startDate || !endDate) throw new AppError('Dates required', 400);
            dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }; break;
    }

    const [revenueData, walletStats, refundsData, outstandingData] = await Promise.all([
        Booking.aggregate([{ $match: { status: 'completed', isActive: true, ...dateFilter } }, { $group: { _id: null, totalRevenue: { $sum: '$pricing.totalAmount' }, totalCommission: { $sum: '$payment.platformCommissionAmount' }, totalDriverPayout: { $sum: '$payment.providerPayoutAmount' }, totalBookings: { $sum: 1 } } }]),
        WalletTransaction.aggregate([{ $match: { ...dateFilter, status: 'completed' } }, { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
        Booking.aggregate([{ $match: { 'payment.status': { $in: ['refunded', 'refund_pending'] }, isActive: true, ...dateFilter } }, { $group: { _id: null, totalRefunds: { $sum: '$payment.refundAmount' }, count: { $sum: 1 } } }]),
        Booking.aggregate([{ $match: { 'payment.status': 'settlement_pending', isActive: true } }, { $group: { _id: null, totalOutstanding: { $sum: '$payment.pendingAmount' }, count: { $sum: 1 } } }])
    ]);

    const rev = revenueData[0] || { totalRevenue: 0, totalCommission: 0, totalDriverPayout: 0, totalBookings: 0 };
    const walletCredits = walletStats.find(w => w._id === 'credit')?.total || 0;
    const walletDebits = walletStats.find(w => w._id === 'debit')?.total || 0;

    return {
        revenue: { gross: rev.totalRevenue, commission: rev.totalCommission, driverPayouts: rev.totalDriverPayout, net: rev.totalCommission, bookings: rev.totalBookings },
        wallet: { credits: walletCredits, debits: walletDebits, net: walletCredits - walletDebits },
        refunds: { total: refundsData[0]?.totalRefunds || 0, count: refundsData[0]?.count || 0 },
        outstanding: { total: outstandingData[0]?.totalOutstanding || 0, count: outstandingData[0]?.count || 0 },
        profitLoss: { revenue: rev.totalCommission, expenses: rev.totalDriverPayout, profit: rev.totalCommission },
        period
    };
};

// ══════════════════════════════════════════════════════════════════════════════
// REVENUE REPORTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get Revenue Report
 * @route GET /api/admin/reports/revenue
 */
exports.getRevenueReport = catchAsync(async (req, res, next) => {
    const data = await fetchRevenueData(req.query);
    res.status(200).json({ status: 'success', data });
});


/**
 * Get Driver Earnings Report
 * @route GET /api/admin/reports/driver-earnings
 */
exports.getDriverEarningsReport = catchAsync(async (req, res, next) => {
    const data = await fetchDriverEarningsData(req.query);
    res.status(200).json({ status: 'success', data });
});

// ══════════════════════════════════════════════════════════════════════════════
// OPERATIONAL REPORTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get Booking Analytics Report
 * @route GET /api/admin/reports/bookings
 */
exports.getBookingAnalytics = catchAsync(async (req, res, next) => {
    const data = await fetchBookingAnalyticsData(req.query);
    res.status(200).json({ status: 'success', data });
});

/**
 * Get Driver Performance Report
 * @route GET /api/admin/reports/driver-performance
 */
exports.getDriverPerformance = catchAsync(async (req, res, next) => {
    const { period = 'monthly', driverId } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
        case 'monthly':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { $gte: startOfMonth } };
            break;
        case 'weekly':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { $gte: startOfWeek } };
            break;
    }

    const query = {
        'service.type': 'sparedriver',
        isActive: true,
        ...dateFilter
    };

    if (driverId) {
        query['provider.id'] = driverId;
    }

    // Driver performance metrics
    const performance = await Booking.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$provider.id',
                driverName: { $first: '$provider.name' },
                totalTrips: { $sum: 1 },
                completedTrips: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                cancelledTrips: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                },
                totalEarnings: { $sum: '$payment.providerPayoutAmount' },
                avgRating: { $avg: '$feedback.rating' },
                totalRatings: {
                    $sum: { $cond: [{ $gt: ['$feedback.rating', 0] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                driverName: 1,
                totalTrips: 1,
                completedTrips: 1,
                cancelledTrips: 1,
                totalEarnings: 1,
                avgRating: { $round: ['$avgRating', 2] },
                totalRatings: 1,
                completionRate: {
                    $multiply: [
                        { $divide: ['$completedTrips', '$totalTrips'] },
                        100
                    ]
                }
            }
        },
        { $sort: { totalEarnings: -1 } }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            performance,
            summary: {
                totalDrivers: performance.length,
                avgCompletionRate: performance.length > 0
                    ? performance.reduce((sum, d) => sum + d.completionRate, 0) / performance.length
                    : 0,
                avgRating: performance.length > 0
                    ? performance.reduce((sum, d) => sum + (d.avgRating || 0), 0) / performance.length
                    : 0
            },
            period
        }
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// FINANCIAL REPORTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get Financial Summary Report
 * @route GET /api/admin/reports/financial-summary
 */
exports.getFinancialSummary = catchAsync(async (req, res, next) => {
    const data = await fetchFinancialSummaryData(req.query);
    res.status(200).json({ status: 'success', data });
});

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Export Report to Excel
 * @route POST /api/admin/reports/export/excel
 */
exports.exportToExcel = catchAsync(async (req, res, next) => {
    const { reportType, period, startDate, endDate } = req.body;

    // Fetch data based on report type
    let data;
    switch (reportType) {
        case 'revenue':
            data = await fetchRevenueData({ period, startDate, endDate });
            break;
        case 'driver-earnings':
            data = await fetchDriverEarningsData({ period, startDate, endDate });
            break;
        case 'bookings':
            data = await fetchBookingAnalyticsData({ period, startDate, endDate });
            break;
        case 'financial':
            data = await fetchFinancialSummaryData({ period, startDate, endDate });
            break;
        default:
            return next(new AppError('Invalid report type', 400));
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add headers and data based on report type
    if (reportType === 'revenue') {
        worksheet.columns = [
            { header: 'Service', key: 'service', width: 30 },
            { header: 'Revenue', key: 'revenue', width: 15 },
            { header: 'Bookings', key: 'bookings', width: 15 },
            { header: 'Avg Value', key: 'avgValue', width: 15 }
        ];

        data.serviceWise.forEach(item => {
            worksheet.addRow({
                service: item._id,
                revenue: `₹${item.revenue}`,
                bookings: item.bookings,
                avgValue: `₹${Math.round(item.avgValue)}`
            });
        });
    } else if (reportType === 'driver-earnings') {
        worksheet.columns = [
            { header: 'Driver Name', key: 'name', width: 30 },
            { header: 'Total Earnings', key: 'earnings', width: 15 },
            { header: 'Total Trips', key: 'trips', width: 15 },
            { header: 'Avg Per Trip', key: 'avgPerTrip', width: 15 }
        ];

        data.driverEarnings.forEach(item => {
            worksheet.addRow({
                name: item.driverName,
                earnings: `₹${item.totalEarnings}`,
                trips: item.totalTrips,
                avgPerTrip: `₹${Math.round(item.avgEarningsPerTrip)}`
            });
        });
    } else if (reportType === 'bookings') {
        worksheet.columns = [
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Count', key: 'count', width: 15 }
        ];

        data.statusBreakdown.forEach(item => {
            worksheet.addRow({
                status: item._id.toUpperCase(),
                count: item.count
            });
        });

        // Add summary row
        worksheet.addRow({});
        worksheet.addRow({ status: 'SUMMARY' });
        worksheet.addRow({ status: 'Total Bookings', count: data.summary.totalBookings });
        worksheet.addRow({ status: 'Completion Rate', count: `${data.summary.completionRate}%` });
    } else if (reportType === 'financial') {
        worksheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 }
        ];

        worksheet.addRow({ metric: 'Gross Revenue', value: `₹${data.revenue.gross}` });
        worksheet.addRow({ metric: 'Platform Commission', value: `₹${data.revenue.commission}` });
        worksheet.addRow({ metric: 'Driver Payouts', value: `₹${data.revenue.driverPayouts}` });
        worksheet.addRow({ metric: 'Net Profit', value: `₹${data.profitLoss.profit}` });
    }

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}-${Date.now()}.xlsx`);
    res.send(buffer);
});

/**
 * Export Report to PDF
 * @route POST /api/admin/reports/export/pdf
 */
exports.exportToPDF = catchAsync(async (req, res, next) => {
    const { reportType, period, startDate, endDate } = req.body;

    // Fetch data based on report type
    let data;
    switch (reportType) {
        case 'revenue':
            data = await fetchRevenueData({ period, startDate, endDate });
            break;
        case 'driver-earnings':
            data = await fetchDriverEarningsData({ period, startDate, endDate });
            break;
        case 'bookings':
            data = await fetchBookingAnalyticsData({ period, startDate, endDate });
            break;
        case 'financial':
            data = await fetchFinancialSummaryData({ period, startDate, endDate });
            break;
        default:
            return next(new AppError('Invalid report type', 400));
    }

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SD_REPORT_${reportType.toUpperCase()}_${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Styling constants
    const brandColor = '#FF6B00';
    
    // Header
    doc.fillColor(brandColor).fontSize(24).text('SPARE DRIVER', { align: 'center' });
    doc.fillColor('#333333').fontSize(16).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
    doc.moveDown();
    
    // Meta Info
    doc.fontSize(10).fillColor('#666666');
    doc.text(`Generated On: ${new Date().toLocaleString()}`);
    doc.text(`Report Period: ${period}`);
    if (startDate && endDate) doc.text(`Range: ${startDate} to ${endDate}`);
    doc.moveDown(2);

    // Content based on type
    if (reportType === 'revenue') {
        doc.fontSize(14).fillColor(brandColor).text('Executive Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`Total Revenue: ₹${data.summary.totalRevenue.toLocaleString()}`);
        doc.text(`Total Bookings: ${data.summary.totalBookings}`);
        doc.text(`Platform Commission: ₹${data.summary.totalCommission.toLocaleString()}`);
        doc.moveDown();
    } else if (reportType === 'driver-earnings') {
        doc.fontSize(14).fillColor(brandColor).text('Driver Performance Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`Total Drivers: ${data.summary.totalDrivers}`);
        doc.text(`Total Payouts: ₹${data.summary.totalEarnings.toLocaleString()}`);
        doc.moveDown();
    } else if (reportType === 'bookings') {
        doc.fontSize(14).fillColor(brandColor).text('Operational Metrics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`Total Market Demand: ${data.summary.totalBookings} units`);
        doc.text(`Fulfillment Rate: ${data.summary.completionRate}%`);
        doc.moveDown();
    } else if (reportType === 'financial') {
        doc.fontSize(14).fillColor(brandColor).text('Profit & Loss Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`Gross Inflow: ₹${data.revenue.gross.toLocaleString()}`);
        doc.text(`Operational Cost: ₹${data.revenue.driverPayouts.toLocaleString()}`);
        doc.text(`Net Yield: ₹${data.profitLoss.profit.toLocaleString()}`);
        doc.moveDown();
    }

    // Finalize PDF
    doc.end();
});

module.exports = exports;
