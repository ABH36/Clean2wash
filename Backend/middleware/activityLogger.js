const ActivityLog = require('../models/ActivityLog');

/**
 * Log admin activity
 * Usage: logActivity('CREATE_DRIVER', 'Driver')
 */
exports.logActivity = (action, resource) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;
        const originalJson = res.json;

        // Override send function
        const logAndSend = function(data) {
            // Log activity after response
            setImmediate(async () => {
                try {
                    const logData = {
                        admin: req.admin?._id,
                        action,
                        resource,
                        resourceId: req.params.id || req.body._id || req.body.id,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('user-agent'),
                        status: res.statusCode < 400 ? 'SUCCESS' : 'FAILED'
                    };

                    // Add changes if available
                    if (req.activityChanges) {
                        logData.changes = req.activityChanges;
                    }

                    // Add error message if failed
                    if (res.statusCode >= 400 && data) {
                        try {
                            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                            logData.errorMessage = parsedData.message || 'Unknown error';
                        } catch (e) {
                            logData.errorMessage = 'Failed to parse error';
                        }
                    }

                    // Add metadata
                    if (req.body) {
                        logData.metadata = {
                            method: req.method,
                            path: req.path,
                            query: req.query,
                            bodyKeys: Object.keys(req.body)
                        };
                    }

                    await ActivityLog.create(logData);
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
            });

            // Call original function
            return originalSend.call(this, data);
        };

        res.send = logAndSend;
        res.json = logAndSend;

        next();
    };
};

/**
 * Helper to attach changes to request
 * Usage: In controller before saving:
 * req.activityChanges = { before: oldData, after: newData };
 */
exports.attachChanges = (before, after) => {
    return (req, res, next) => {
        req.activityChanges = { before, after };
        next();
    };
};

/**
 * Log authentication events
 */
exports.logAuth = (action) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        const originalJson = res.json;

        const logAndSend = function(data) {
            setImmediate(async () => {
                try {
                    await ActivityLog.create({
                        admin: req.admin?._id || req.body.email,
                        action,
                        resource: 'Authentication',
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('user-agent'),
                        status: res.statusCode < 400 ? 'SUCCESS' : 'FAILED',
                        errorMessage: res.statusCode >= 400 ? (typeof data === 'string' ? JSON.parse(data).message : data.message) : null,
                        metadata: {
                            method: req.method,
                            path: req.path
                        }
                    });
                } catch (error) {
                    console.error('Failed to log auth activity:', error);
                }
            });

            return originalSend.call(this, data);
        };

        res.send = logAndSend;
        res.json = logAndSend;

        next();
    };
};
