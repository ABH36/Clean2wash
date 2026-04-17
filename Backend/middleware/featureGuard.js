/**
 * Backend Feature Guard Configuration
 */

const PLATFORM_MODE = process.env.PLATFORM_MODE || 'SPARE_DRIVER';

// ── GROUPED FEATURE FLAGS (Pillar Architecture) ──
const FEATURE_FLAGS = {
    OVERVIEW: true,           // Dashboards, Stats
    OPERATIONS: true,         // Dispatch, Live Ops
    USERS: true,              // Driver/Customer Registry
    FINANCE: true,            // Wallet, Transactions
    SERVICES: true,           // Service/Vehicle Inventory
    SAFETY_SUPPORT: true,     // SOS, Helpdesk
    SYSTEM_CONTROL: true,     // Settings, Logs

    // Legacy Mapping (Disabled in Spare Driver Mode)
    APARTMENT_WASH: PLATFORM_MODE !== 'SPARE_DRIVER',
    STUDIO_WASH: PLATFORM_MODE !== 'SPARE_DRIVER',
    PRODUCT_ECOSYSTEM: PLATFORM_MODE !== 'SPARE_DRIVER',
    CAMPAIGN_DESK: PLATFORM_MODE !== 'SPARE_DRIVER',
};

exports.PLATFORM_MODE = PLATFORM_MODE;
exports.FEATURE_FLAGS = FEATURE_FLAGS;

/**
 * Middleware to protect routes based on the active platform mode.
 * @param {string} feature - The feature key to check.
 */
exports.guard = (feature) => {
    return (req, res, next) => {
        if (FEATURE_FLAGS[feature] === false) {
            const userId = req.user?._id || 'ANONYMOUS';
            console.warn(`[SECURITY] Blocked access to disabled feature: "${feature}" | User: ${userId} | IP: ${req.ip} | Method: ${req.method} | URL: ${req.originalUrl}`);
            
            return res.status(403).json({
                status: 'error',
                message: `The ${feature.replace('_', ' ')} module is currently disabled in ${PLATFORM_MODE} mode.`
            });
        }
        next();
    };
};
