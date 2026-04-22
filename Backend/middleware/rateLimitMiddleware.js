const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware - Protect critical endpoints
 * Note: Redis support is optional. Install 'rate-limit-redis' and 'ioredis' for distributed rate limiting.
 */

// Redis client for distributed rate limiting (optional)
let redisClient = null;
let RedisStore = null;

// Try to load Redis dependencies if available
try {
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        RedisStore = require('rate-limit-redis');
        const Redis = require('ioredis');
        
        const redisConfig = process.env.REDIS_URL || {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD
        };
        redisClient = new Redis(redisConfig);
        console.log('✅ Redis connected for rate limiting');
    }
} catch (err) {
    console.warn('⚠️  Redis dependencies not installed. Using memory store for rate limiting.');
    console.warn('   To enable Redis: npm install rate-limit-redis ioredis');
    redisClient = null;
    RedisStore = null;
}

// Create rate limiter with optional Redis store
const createRateLimiter = (options) => {
    const config = {
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
        max: options.max || 100,
        message: options.message || {
            status: 'error',
            message: 'Too many requests, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting in development for localhost
            if (process.env.NODE_ENV === 'development') {
                const ip = req.ip || req.connection.remoteAddress;
                return ip === '::1' || ip === '127.0.0.1' || ip?.includes('localhost');
            }
            return false;
        },
        keyGenerator: options.keyGenerator, // If undefined, express-rate-limit uses its internal safe IP generator
        handler: (req, res) => {
            res.status(429).json({
                status: 'error',
                message: options.message?.message || 'Too many requests, please try again later.',
                retryAfter: Math.ceil((options.windowMs || 900000) / 1000)
            });
        }
    };
    
    // Copy options except prefix and useRedis
    for (const [key, value] of Object.entries(options)) {
        if (!['prefix', 'useRedis', 'message', 'windowMs', 'max', 'keyGenerator'].includes(key)) {
            config[key] = value;
        }
    }

    // Use Redis store if available
    if (redisClient && RedisStore && options.useRedis !== false) {
        try {
            config.store = new RedisStore({
                client: redisClient,
                prefix: options.prefix || 'rl:'
            });
        } catch (err) {
            console.warn('⚠️  Failed to create Redis store, using memory store:', err.message);
        }
    }

    return rateLimit(config);
};

// General API rate limiter
const generalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.'
    },
    prefix: 'rl:general:'
});

// Authentication rate limiter (stricter)
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true,
    message: {
        status: 'error',
        message: 'Too many login attempts, please try again after 15 minutes.'
    },
    prefix: 'rl:auth:'
});

// Registration rate limiter
const registerLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: {
        status: 'error',
        message: 'Too many registration attempts, please try again after 1 hour.'
    },
    prefix: 'rl:register:'
});

// Password reset rate limiter
const passwordResetLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
    message: {
        status: 'error',
        message: 'Too many password reset attempts, please try again after 1 hour.'
    },
    prefix: 'rl:password:'
});

// OTP rate limiter
const otpLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 OTP requests per 15 minutes
    message: {
        status: 'error',
        message: 'Too many OTP requests, please try again after 15 minutes.'
    },
    prefix: 'rl:otp:'
});

// Booking creation rate limiter
const bookingLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 bookings per minute
    message: {
        status: 'error',
        message: 'Too many booking requests, please slow down.'
    },
    prefix: 'rl:booking:'
});

// Payment rate limiter
const paymentLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 payment requests per minute
    message: {
        status: 'error',
        message: 'Too many payment requests, please try again later.'
    },
    prefix: 'rl:payment:'
});

// File upload rate limiter
const uploadLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: {
        status: 'error',
        message: 'Too many file uploads, please slow down.'
    },
    prefix: 'rl:upload:'
});

// Search/Query rate limiter
const searchLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: {
        status: 'error',
        message: 'Too many search requests, please slow down.'
    },
    prefix: 'rl:search:'
});

// Admin operations rate limiter
const adminLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 admin operations per minute
    message: {
        status: 'error',
        message: 'Too many admin operations, please slow down.'
    },
    prefix: 'rl:admin:'
});

// Critical operations rate limiter (very strict)
const criticalLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 critical operations per minute
    message: {
        status: 'error',
        message: 'Too many critical operations, please wait before trying again.'
    },
    prefix: 'rl:critical:'
});

// Location update rate limiter (for drivers)
const locationLimiter = createRateLimiter({
    windowMs: 10 * 1000, // 10 seconds
    max: 5, // 5 location updates per 10 seconds
    message: {
        status: 'error',
        message: 'Too many location updates, please slow down.'
    },
    prefix: 'rl:location:'
});

// Chat message rate limiter
const chatLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: {
        status: 'error',
        message: 'Too many messages, please slow down.'
    },
    prefix: 'rl:chat:'
});

// API key based rate limiter (for external integrations)
const apiKeyLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per API key
    keyGenerator: (req) => {
        // Return undefined to let express-rate-limit handle IP detection safely
        return req.headers['x-api-key'] || undefined;
    },
    message: {
        status: 'error',
        message: 'API rate limit exceeded.'
    },
    prefix: 'rl:apikey:'
});

// Dynamic rate limiter based on user role
const dynamicRoleLimiter = (req, res, next) => {
    const user = req.user;
    
    if (!user) {
        return generalLimiter(req, res, next);
    }

    // Different limits for different roles
    const roleLimits = {
        superadmin: 10000,
        admin: 5000,
        staff: 2000,
        driver: 1000,
        user: 500
    };

    const max = roleLimits[user.role] || 100;

    const limiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max,
        keyGenerator: (req) => `${req.user.id}:${req.user.role}`,
        prefix: 'rl:role:'
    });

    return limiter(req, res, next);
};

// Sliding window rate limiter (more accurate)
const slidingWindowLimiter = (options) => {
    const windowMs = options.windowMs || 60 * 1000;
    const max = options.max || 10;
    const requests = new Map();

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get existing requests for this key
        let userRequests = requests.get(key) || [];

        // Remove old requests outside the window
        userRequests = userRequests.filter(timestamp => timestamp > windowStart);

        // Check if limit exceeded
        if (userRequests.length >= max) {
            return res.status(429).json({
                status: 'error',
                message: options.message || 'Too many requests, please try again later.',
                retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
            });
        }

        // Add current request
        userRequests.push(now);
        requests.set(key, userRequests);

        // Cleanup old entries periodically
        if (Math.random() < 0.01) { // 1% chance
            const cutoff = now - windowMs * 2;
            for (const [k, v] of requests.entries()) {
                if (v.every(t => t < cutoff)) {
                    requests.delete(k);
                }
            }
        }

        next();
    };
};

module.exports = {
    generalLimiter,
    authLimiter,
    registerLimiter,
    passwordResetLimiter,
    otpLimiter,
    bookingLimiter,
    paymentLimiter,
    uploadLimiter,
    searchLimiter,
    adminLimiter,
    criticalLimiter,
    locationLimiter,
    chatLimiter,
    apiKeyLimiter,
    dynamicRoleLimiter,
    slidingWindowLimiter,
    createRateLimiter
};
