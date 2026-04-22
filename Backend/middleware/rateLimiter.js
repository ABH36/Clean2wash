const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Middleware Factory
 * Creates rate limiters with different configurations for different endpoints
 */

// Try to load Redis store if available (optional dependency)
let RedisStore = null;
try {
    RedisStore = require('rate-limit-redis');
} catch (err) {
    console.log('📝 Rate limiting using in-memory store (Redis not installed)');
}

// In-memory store for development (use Redis in production)
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes default
        max = 100, // 100 requests per window default
        message = 'Too many requests from this IP, please try again later.',
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        handler = (req, res) => {
            res.status(429).json({
                status: 'error',
                message: options.message || message,
                retryAfter: Math.ceil(options.windowMs / 1000)
            });
        }
    } = options;

    const limiterConfig = {
        windowMs,
        max,
        message,
        skipSuccessfulRequests,
        skipFailedRequests,
        handler,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    };

    // Only apply custom keyGenerator if provided in options
    if (options.keyGenerator) {
        limiterConfig.keyGenerator = options.keyGenerator;
    }

    // Use Redis store if available (production)
    if (process.env.REDIS_URL && RedisStore) {
        try {
            console.log('🔴 Using Redis for rate limiting');
            limiterConfig.store = new RedisStore({
                sendCommand: (...args) => {
                    // Implement Redis connection here
                    // This is a placeholder for Redis integration
                    console.log('Redis command:', args);
                }
            });
        } catch (error) {
            console.warn('⚠️ Redis not available, using in-memory rate limiting');
        }
    }

    return rateLimit(limiterConfig);
};

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false // Count failed attempts
});

/**
 * Moderate rate limiter for general API endpoints
 */
const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later.'
});

/**
 * Strict rate limiter for sensitive operations
 * (e.g., password reset, account deletion)
 */
const strictLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many attempts for this sensitive operation, please try again after 1 hour.'
});

/**
 * Lenient rate limiter for read-only operations
 */
const readLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per 15 minutes
    message: 'Too many read requests from this IP, please try again later.'
});

/**
 * Rate limiter for file uploads
 */
const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Too many file uploads from this IP, please try again after 1 hour.'
});

/**
 * Custom rate limiter based on user ID (for authenticated requests)
 */
const createUserRateLimiter = (options = {}) => {
    return createRateLimiter({
        ...options,
        keyGenerator: (req) => {
            // Priority: User ID > Auth ID > Default IP detection
            // Note: Returning undefined tells express-rate-limit to use its default IP generator
            return req.user?._id?.toString() || req.user?.id || req.auth?.id || undefined;
        }
    });
};

/**
 * Sliding window rate limiter for more accurate rate limiting
 */
const createSlidingWindowLimiter = (options = {}) => {
    const store = new Map();
    const { windowMs = 60000, max = 10 } = options;

    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        
        if (!store.has(key)) {
            store.set(key, []);
        }

        const requests = store.get(key);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
        
        if (validRequests.length >= max) {
            return res.status(429).json({
                status: 'error',
                message: 'Too many requests, please try again later.',
                retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
            });
        }

        validRequests.push(now);
        store.set(key, validRequests);

        // Cleanup old entries periodically
        if (Math.random() < 0.01) { // 1% chance
            for (const [k, v] of store.entries()) {
                const valid = v.filter(timestamp => now - timestamp < windowMs);
                if (valid.length === 0) {
                    store.delete(k);
                } else {
                    store.set(k, valid);
                }
            }
        }

        next();
    };
};

module.exports = {
    authLimiter,
    apiLimiter,
    strictLimiter,
    readLimiter,
    uploadLimiter,
    createRateLimiter,
    createUserRateLimiter,
    createSlidingWindowLimiter
};
