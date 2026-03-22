const Setting = require('../models/Setting');

/**
 * Global middleware to handle Platform Maintenance Mode.
 * Blocks non-admin requests with a 503 Service Unavailable if active.
 */
module.exports = async (req, res, next) => {
    try {
        // Skip check for Admin API routes to allow turning it off
        if (req.originalUrl.startsWith('/api/admin')) {
            return next();
        }

        const maintenanceSetting = await Setting.findOne({ key: 'maintenance_mode' });

        if (maintenanceSetting && maintenanceSetting.value === true) {
            return res.status(503).json({
                status: 'error',
                message: 'SYSTEM_MAINTENANCE',
                displayMessage: 'Clean-2-Wash is currently undergoing essential maintenance. We will be back shortly!'
            });
        }

        next();
    } catch (error) {
        console.error('Maintenance Check Error:', error);
        next(); // Fail-safe: let traffic pass if DB check fails
    }
};
