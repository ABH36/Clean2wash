const fraudDetectionService = require('../services/fraudDetectionService');
const AppError = require('../utils/AppError');

/**
 * Middleware to check if user/driver is blacklisted before allowing actions
 */
exports.checkBlacklist = (entityType = 'USER') => {
    return async (req, res, next) => {
        try {
            let entityId;

            if (entityType === 'USER' && req.user) {
                entityId = req.user.id;
            } else if (entityType === 'DRIVER' && req.driver) {
                entityId = req.driver.id;
            }

            if (!entityId) {
                return next();
            }

            const isBlacklisted = await fraudDetectionService.isBlacklisted(entityType, entityId.toString());

            if (isBlacklisted) {
                return next(new AppError(
                    'Your account has been suspended due to suspicious activity. Please contact support.',
                    403
                ));
            }

            // Also check phone blacklist for users
            if (entityType === 'USER' && req.user.phone) {
                const phoneBlacklisted = await fraudDetectionService.isBlacklisted('PHONE', req.user.phone);
                if (phoneBlacklisted) {
                    return next(new AppError(
                        'This phone number has been blocked. Please contact support.',
                        403
                    ));
                }
            }

            next();
        } catch (error) {
            console.error('Blacklist check error:', error);
            next(); // Don't block on error, just log
        }
    };
};

/**
 * Middleware to run fraud detection on booking creation
 */
exports.checkBookingFraud = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }

        const context = {
            amount: req.body.totalAmount || 0,
            bookingLocation: req.body.location?.address?.coordinates,
            userLocation: req.user.profile?.address?.coordinates
        };

        // Run fraud check asynchronously (don't block booking)
        fraudDetectionService.runUserFraudCheck(
            req.user.id,
            null, // bookingId will be set after creation
            context
        ).catch(err => {
            console.error('Fraud check error:', err);
        });

        next();
    } catch (error) {
        console.error('Booking fraud check error:', error);
        next(); // Don't block on error
    }
};

/**
 * Middleware to check fraud after booking is created
 */
exports.postBookingFraudCheck = async (booking) => {
    try {
        if (!booking || !booking.consumer) {
            return;
        }

        const context = {
            amount: booking.pricing?.totalAmount || 0,
            bookingLocation: booking.location?.address?.coordinates,
            userLocation: null // Will be fetched from user profile
        };

        await fraudDetectionService.runUserFraudCheck(
            booking.consumer,
            booking._id,
            context
        );
    } catch (error) {
        console.error('Post-booking fraud check error:', error);
    }
};

/**
 * Middleware to check driver fraud patterns
 */
exports.checkDriverFraud = async (req, res, next) => {
    try {
        if (!req.driver && !req.user) {
            return next();
        }

        const driverId = req.driver?.id || req.user?.id;

        if (!driverId) {
            return next();
        }

        // Run fraud check asynchronously
        fraudDetectionService.runDriverFraudCheck(driverId).catch(err => {
            console.error('Driver fraud check error:', err);
        });

        next();
    } catch (error) {
        console.error('Driver fraud check error:', error);
        next(); // Don't block on error
    }
};
