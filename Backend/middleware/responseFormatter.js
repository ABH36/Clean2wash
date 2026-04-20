/**
 * Response Formatter Middleware - Consistent API response format
 */

/**
 * Standard response format:
 * {
 *   status: 'success' | 'error' | 'fail',
 *   message: string,
 *   data: object | array | null,
 *   meta: {
 *     timestamp: string,
 *     requestId: string,
 *     pagination: object (optional)
 *   }
 * }
 */

// Generate unique request ID
const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Add request ID to all requests
const addRequestId = (req, res, next) => {
    req.requestId = generateRequestId();
    
    // Set header only if not already sent
    if (!res.headersSent) {
        res.setHeader('X-Request-ID', req.requestId);
    }
    
    next();
};

// Success response helper
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
    const response = {
        status: 'success',
        message,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: res.req?.requestId,
            ...meta
        }
    };

    return res.status(statusCode).json(response);
};

// Error response helper
const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
    const response = {
        status: 'error',
        message,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: res.req?.requestId
        }
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

// Fail response helper (client error)
const sendFail = (res, message = 'Request failed', statusCode = 400, data = null) => {
    const response = {
        status: 'fail',
        message,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: res.req?.requestId
        }
    };

    return res.status(statusCode).json(response);
};

// Paginated response helper
const sendPaginated = (res, data, pagination, message = 'Success', statusCode = 200) => {
    const response = {
        status: 'success',
        message,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: res.req?.requestId,
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 10,
                total: pagination.total || 0,
                totalPages: pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
                hasMore: pagination.hasMore !== undefined 
                    ? pagination.hasMore 
                    : (pagination.page || 1) < Math.ceil((pagination.total || 0) / (pagination.limit || 10))
            }
        }
    };

    return res.status(statusCode).json(response);
};

// Created response helper (201)
const sendCreated = (res, data, message = 'Resource created successfully') => {
    return sendSuccess(res, data, message, 201);
};

// No content response helper (204)
const sendNoContent = (res) => {
    return res.status(204).send();
};

// Not found response helper (404)
const sendNotFound = (res, message = 'Resource not found') => {
    return sendError(res, message, 404);
};

// Unauthorized response helper (401)
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return sendError(res, message, 401);
};

// Forbidden response helper (403)
const sendForbidden = (res, message = 'Access forbidden') => {
    return sendError(res, message, 403);
};

// Bad request response helper (400)
const sendBadRequest = (res, message = 'Bad request', errors = null) => {
    return sendError(res, message, 400, errors);
};

// Validation error response helper (422)
const sendValidationError = (res, errors, message = 'Validation failed') => {
    return sendError(res, message, 422, errors);
};

// Conflict response helper (409)
const sendConflict = (res, message = 'Resource conflict') => {
    return sendError(res, message, 409);
};

// Too many requests response helper (429)
const sendTooManyRequests = (res, message = 'Too many requests', retryAfter = null) => {
    if (retryAfter) {
        res.setHeader('Retry-After', retryAfter);
    }
    return sendError(res, message, 429);
};

// Internal server error response helper (500)
const sendInternalError = (res, message = 'Internal server error') => {
    return sendError(res, message, 500);
};

// Service unavailable response helper (503)
const sendServiceUnavailable = (res, message = 'Service temporarily unavailable') => {
    return sendError(res, message, 503);
};

// Attach response helpers to res object
const attachResponseHelpers = (req, res, next) => {
    res.sendSuccess = (data, message, statusCode, meta) => 
        sendSuccess(res, data, message, statusCode, meta);
    
    res.sendError = (message, statusCode, errors) => 
        sendError(res, message, statusCode, errors);
    
    res.sendFail = (message, statusCode, data) => 
        sendFail(res, message, statusCode, data);
    
    res.sendPaginated = (data, pagination, message, statusCode) => 
        sendPaginated(res, data, pagination, message, statusCode);
    
    res.sendCreated = (data, message) => 
        sendCreated(res, data, message);
    
    res.sendNoContent = () => 
        sendNoContent(res);
    
    res.sendNotFound = (message) => 
        sendNotFound(res, message);
    
    res.sendUnauthorized = (message) => 
        sendUnauthorized(res, message);
    
    res.sendForbidden = (message) => 
        sendForbidden(res, message);
    
    res.sendBadRequest = (message, errors) => 
        sendBadRequest(res, message, errors);
    
    res.sendValidationError = (errors, message) => 
        sendValidationError(res, errors, message);
    
    res.sendConflict = (message) => 
        sendConflict(res, message);
    
    res.sendTooManyRequests = (message, retryAfter) => 
        sendTooManyRequests(res, message, retryAfter);
    
    res.sendInternalError = (message) => 
        sendInternalError(res, message);
    
    res.sendServiceUnavailable = (message) => 
        sendServiceUnavailable(res, message);

    next();
};

// Format existing responses to standard format
const formatResponse = (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
        // If already formatted, send as is
        if (data && (data.status === 'success' || data.status === 'error' || data.status === 'fail')) {
            return originalJson.call(this, data);
        }

        // Format the response
        const formatted = {
            status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error',
            message: data?.message || (res.statusCode >= 200 && res.statusCode < 300 ? 'Success' : 'Error'),
            data: data?.data || data,
            meta: {
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
                ...(data?.meta || {})
            }
        };

        return originalJson.call(this, formatted);
    };

    next();
};

// Response time tracker
const trackResponseTime = (req, res, next) => {
    const start = Date.now();

    // Track response time without modifying headers
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Log slow requests (> 1 second)
        if (duration > 1000) {
            console.warn(`⚠️  Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
        }
    });

    next();
};

// CORS headers for consistent responses
const setCorsHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
};

module.exports = {
    addRequestId,
    attachResponseHelpers,
    formatResponse,
    trackResponseTime,
    setCorsHeaders,
    sendSuccess,
    sendError,
    sendFail,
    sendPaginated,
    sendCreated,
    sendNoContent,
    sendNotFound,
    sendUnauthorized,
    sendForbidden,
    sendBadRequest,
    sendValidationError,
    sendConflict,
    sendTooManyRequests,
    sendInternalError,
    sendServiceUnavailable
};
