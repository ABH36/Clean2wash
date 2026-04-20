const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../../../middleware/authMiddleware');

// ══════════════════════════════════════════════════════════════════════════════
// REVENUE REPORTS
// ══════════════════════════════════════════════════════════════════════════════

// Get revenue report
// GET /api/admin/reports/revenue?period=daily|weekly|monthly|custom&startDate=&endDate=&serviceType=
router.get('/revenue', reportController.getRevenueReport);

// Get driver earnings report
// GET /api/admin/reports/driver-earnings?period=daily|weekly|monthly|custom&driverId=&startDate=&endDate=
router.get('/driver-earnings', reportController.getDriverEarningsReport);

// ══════════════════════════════════════════════════════════════════════════════
// OPERATIONAL REPORTS
// ══════════════════════════════════════════════════════════════════════════════

// Get booking analytics
// GET /api/admin/reports/bookings?period=daily|weekly|monthly|custom&startDate=&endDate=
router.get('/bookings', reportController.getBookingAnalytics);

// Get driver performance report
// GET /api/admin/reports/driver-performance?period=monthly|weekly&driverId=
router.get('/driver-performance', reportController.getDriverPerformance);

// ══════════════════════════════════════════════════════════════════════════════
// FINANCIAL REPORTS
// ══════════════════════════════════════════════════════════════════════════════

// Get financial summary
// GET /api/admin/reports/financial-summary?period=monthly|custom&startDate=&endDate=
router.get('/financial-summary', reportController.getFinancialSummary);

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

// Export to Excel
// POST /api/admin/reports/export/excel
// Body: { reportType: 'revenue|driver-earnings|bookings', period, startDate, endDate }
router.post('/export/excel', reportController.exportToExcel);

// Export to PDF
// POST /api/admin/reports/export/pdf
// Body: { reportType: 'revenue|driver-earnings|bookings', period, startDate, endDate }
router.post('/export/pdf', reportController.exportToPDF);

module.exports = router;
