const AuditLog = require('../models/AuditLog');

/**
 * Log a system action with atomicity optionally tied to a session.
 * 
 * @param {Object} data - Log details
 * @param {string} data.userId - The user performing the action
 * @param {string} data.action - Action constant (e.g., 'ORDER_CREATED')
 * @param {string} data.resource - Resource type (e.g., 'ProductOrder')
 * @param {string} data.resourceId - ID of the affected resource
 * @param {Object} [data.oldValue] - State before change
 * @param {Object} [data.newValue] - State after change
 * @param {Object} [data.req] - Express request object for IP/UserAgent
 * @param {Object} [data.metadata] - Additional context
 * @param {Object} [session] - Mongoose session for transaction tagging
 */
exports.logAction = async (data, session = null) => {
    try {
        const { userId, action, resource, resourceId, oldValue, newValue, req, metadata = {} } = data;

        const logData = {
            userId,
            action,
            resource,
            resourceId,
            oldValue,
            newValue,
            metadata: {
                ...metadata,
                ip: req?.ip || 'internal',
                userAgent: req?.headers?.['user-agent'] || 'system',
                timestamp: new Date()
            }
        };

        // If a session is provided, we write as part of the transaction
        // If not, we still wait for the log to succeed before returning (hardening)
        await AuditLog.create([logData], { session });

        console.log(`[AuditLog] ${action} on ${resource}:${resourceId} by User:${userId}`);
    } catch (error) {
        // We log error but don't throw if it's not a session-based log?
        // Actually for hardening, we want to know if logging fails.
        console.error('[AuditHelper] Critical: Failed to write audit log:', error.message);
        if (session) throw error;
    }
};
