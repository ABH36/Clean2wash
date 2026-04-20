const FraudAlert = require('../models/FraudAlert');
const Blacklist = require('../models/Blacklist');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SpareDriver = require('../models/SpareDriver');
const WalletTransaction = require('../models/WalletTransaction');
const { sendAdminNotification } = require('../utils/notificationService');

/**
 * Fraud Detection Service
 * Monitors and detects suspicious activities across the platform
 */

// Risk score thresholds
const RISK_THRESHOLDS = {
    LOW: 30,
    MEDIUM: 50,
    HIGH: 70,
    CRITICAL: 85
};

// Time windows for pattern detection
const TIME_WINDOWS = {
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000
};

/**
 * Check if entity is blacklisted
 */
const isBlacklisted = async (entityType, entityId) => {
    const blacklistEntry = await Blacklist.findOne({
        entityType,
        entityId,
        isActive: true,
        $or: [
            { isPermanent: true },
            { expiresAt: { $gt: new Date() } }
        ]
    });

    return blacklistEntry ? blacklistEntry.isValid() : false;
};

/**
 * Create fraud alert
 */
const createFraudAlert = async (data) => {
    const alert = await FraudAlert.create(data);

    // Send notification to admins for high severity alerts
    if (['HIGH', 'CRITICAL'].includes(alert.severity)) {
        await sendAdminNotification({
            title: `🚨 ${alert.severity} Fraud Alert`,
            message: `${alert.alertType}: ${alert.description}`,
            type: 'fraud',
            priority: 'urgent',
            actionUrl: '/admin/fraud/alerts',
            actionText: 'Review Alert',
            metaData: {
                alertId: alert._id.toString(),
                alertType: alert.alertType,
                riskScore: alert.riskScore
            }
        });
    }

    return alert;
};

/**
 * Calculate risk score based on multiple factors
 */
const calculateRiskScore = (factors) => {
    let score = 0;
    let maxScore = 0;

    Object.entries(factors).forEach(([key, value]) => {
        if (typeof value === 'number') {
            score += value;
            maxScore += 100;
        }
    });

    return maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;
};

/**
 * Detect multiple cancellations
 */
const detectMultipleCancellations = async (userId) => {
    const recentCancellations = await Booking.countDocuments({
        consumer: userId,
        status: 'cancelled',
        createdAt: { $gte: new Date(Date.now() - TIME_WINDOWS.WEEK) }
    });

    if (recentCancellations >= 5) {
        const riskScore = Math.min(100, recentCancellations * 15);
        
        await createFraudAlert({
            user: userId,
            alertType: 'MULTIPLE_CANCELLATIONS',
            severity: recentCancellations >= 10 ? 'HIGH' : 'MEDIUM',
            riskScore,
            description: `User has cancelled ${recentCancellations} bookings in the last 7 days`,
            evidence: {
                cancellationCount: recentCancellations,
                timeWindow: '7 days'
            }
        });

        return true;
    }

    return false;
};

/**
 * Detect rapid bookings (potential bot activity)
 */
const detectRapidBookings = async (userId) => {
    const recentBookings = await Booking.find({
        consumer: userId,
        createdAt: { $gte: new Date(Date.now() - TIME_WINDOWS.HOUR) }
    }).sort({ createdAt: 1 });

    if (recentBookings.length >= 5) {
        // Check if bookings are too close together (< 2 minutes)
        let rapidCount = 0;
        for (let i = 1; i < recentBookings.length; i++) {
            const timeDiff = recentBookings[i].createdAt - recentBookings[i - 1].createdAt;
            if (timeDiff < 2 * 60 * 1000) {
                rapidCount++;
            }
        }

        if (rapidCount >= 3) {
            const riskScore = Math.min(100, rapidCount * 25);

            await createFraudAlert({
                user: userId,
                alertType: 'RAPID_BOOKINGS',
                severity: rapidCount >= 5 ? 'CRITICAL' : 'HIGH',
                riskScore,
                description: `User created ${recentBookings.length} bookings in 1 hour with ${rapidCount} rapid sequences`,
                evidence: {
                    bookingCount: recentBookings.length,
                    rapidSequences: rapidCount,
                    timeWindow: '1 hour'
                }
            });

            return true;
        }
    }

    return false;
};

/**
 * Detect suspicious payment patterns
 */
const detectSuspiciousPayment = async (userId, bookingId, amount) => {
    const recentFailedPayments = await Booking.countDocuments({
        consumer: userId,
        'payment.status': 'failed',
        createdAt: { $gte: new Date(Date.now() - TIME_WINDOWS.DAY) }
    });

    const recentRefunds = await Booking.countDocuments({
        consumer: userId,
        'payment.status': 'refunded',
        createdAt: { $gte: new Date(Date.now() - TIME_WINDOWS.WEEK) }
    });

    if (recentFailedPayments >= 3 || recentRefunds >= 5) {
        const riskScore = calculateRiskScore({
            failedPayments: recentFailedPayments * 20,
            refunds: recentRefunds * 10
        });

        await createFraudAlert({
            user: userId,
            booking: bookingId,
            alertType: 'SUSPICIOUS_PAYMENT',
            severity: riskScore >= RISK_THRESHOLDS.HIGH ? 'HIGH' : 'MEDIUM',
            riskScore,
            description: `Suspicious payment pattern: ${recentFailedPayments} failed payments, ${recentRefunds} refunds`,
            evidence: {
                failedPayments: recentFailedPayments,
                refunds: recentRefunds,
                amount
            }
        });

        return true;
    }

    return false;
};

/**
 * Detect location mismatch
 */
const detectLocationMismatch = async (userId, bookingLocation, userLocation) => {
    if (!bookingLocation || !userLocation) return false;

    // Calculate distance between booking location and user's typical location
    const distance = calculateDistance(
        bookingLocation.lat,
        bookingLocation.lng,
        userLocation.lat,
        userLocation.lng
    );

    // If distance > 500km, flag as suspicious
    if (distance > 500) {
        const riskScore = Math.min(100, Math.round(distance / 10));

        await createFraudAlert({
            user: userId,
            alertType: 'LOCATION_MISMATCH',
            severity: distance > 1000 ? 'HIGH' : 'MEDIUM',
            riskScore,
            description: `Booking location is ${Math.round(distance)}km away from user's typical location`,
            evidence: {
                distance: Math.round(distance),
                bookingLocation,
                userLocation
            }
        });

        return true;
    }

    return false;
};

/**
 * Detect driver fraud patterns
 */
const detectDriverFraud = async (driverId) => {
    const recentRejections = await Booking.countDocuments({
        'provider.id': driverId,
        'activityLog.status': 'sparedriver_rejected',
        createdAt: { $gte: new Date(Date.now() - TIME_WINDOWS.DAY) }
    });

    const recentCancellations = await Booking.countDocuments({
        'provider.id': driverId,
        status: 'cancelled',
        'provider.type': 'sparedriver',
        createdAt: { $gte: new Date(Date.now() - TIME_WINDOWS.WEEK) }
    });

    if (recentRejections >= 10 || recentCancellations >= 5) {
        const riskScore = calculateRiskScore({
            rejections: recentRejections * 8,
            cancellations: recentCancellations * 15
        });

        await createFraudAlert({
            driver: driverId,
            alertType: 'DRIVER_FRAUD',
            severity: riskScore >= RISK_THRESHOLDS.HIGH ? 'HIGH' : 'MEDIUM',
            riskScore,
            description: `Driver has ${recentRejections} rejections and ${recentCancellations} cancellations`,
            evidence: {
                rejections: recentRejections,
                cancellations: recentCancellations
            }
        });

        return true;
    }

    return false;
};

/**
 * Detect refund abuse
 */
const detectRefundAbuse = async (userId) => {
    const recentRefunds = await Booking.find({
        consumer: userId,
        'payment.status': 'refunded',
        createdAt: { $gte: new Date(Date.now() - TIME_WINDOWS.MONTH) }
    });

    const refundAmount = recentRefunds.reduce((sum, booking) => {
        return sum + (booking.payment?.refundAmount || 0);
    }, 0);

    if (recentRefunds.length >= 5 || refundAmount >= 5000) {
        const riskScore = calculateRiskScore({
            refundCount: recentRefunds.length * 15,
            refundAmount: Math.min(100, refundAmount / 100)
        });

        await createFraudAlert({
            user: userId,
            alertType: 'REFUND_ABUSE',
            severity: riskScore >= RISK_THRESHOLDS.HIGH ? 'HIGH' : 'MEDIUM',
            riskScore,
            description: `User has received ${recentRefunds.length} refunds totaling ₹${refundAmount} in last 30 days`,
            evidence: {
                refundCount: recentRefunds.length,
                totalRefundAmount: refundAmount,
                timeWindow: '30 days'
            }
        });

        return true;
    }

    return false;
};

/**
 * Detect account sharing
 */
const detectAccountSharing = async (userId) => {
    // Check for bookings from different locations at similar times
    const recentBookings = await Booking.find({
        consumer: userId,
        createdAt: { $gte: new Date(Date.now() - TIME_WINDOWS.DAY) }
    }).sort({ createdAt: 1 });

    if (recentBookings.length >= 3) {
        let suspiciousCount = 0;

        for (let i = 1; i < recentBookings.length; i++) {
            const timeDiff = recentBookings[i].createdAt - recentBookings[i - 1].createdAt;
            const loc1 = recentBookings[i - 1].location?.address?.coordinates;
            const loc2 = recentBookings[i].location?.address?.coordinates;

            if (loc1 && loc2 && timeDiff < 2 * 60 * 60 * 1000) {
                const distance = calculateDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
                
                // If distance > 50km in < 2 hours, suspicious
                if (distance > 50) {
                    suspiciousCount++;
                }
            }
        }

        if (suspiciousCount >= 2) {
            const riskScore = Math.min(100, suspiciousCount * 40);

            await createFraudAlert({
                user: userId,
                alertType: 'ACCOUNT_SHARING',
                severity: suspiciousCount >= 3 ? 'HIGH' : 'MEDIUM',
                riskScore,
                description: `Detected ${suspiciousCount} instances of bookings from distant locations in short time`,
                evidence: {
                    suspiciousInstances: suspiciousCount,
                    bookingCount: recentBookings.length
                }
            });

            return true;
        }
    }

    return false;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (value) => (value * Math.PI) / 180;

/**
 * Run comprehensive fraud check for user
 */
const runUserFraudCheck = async (userId, bookingId = null, context = {}) => {
    const checks = await Promise.allSettled([
        detectMultipleCancellations(userId),
        detectRapidBookings(userId),
        detectRefundAbuse(userId),
        detectAccountSharing(userId)
    ]);

    if (bookingId && context.amount) {
        await detectSuspiciousPayment(userId, bookingId, context.amount);
    }

    if (context.bookingLocation && context.userLocation) {
        await detectLocationMismatch(userId, context.bookingLocation, context.userLocation);
    }

    const fraudDetected = checks.some(result => result.status === 'fulfilled' && result.value === true);
    return fraudDetected;
};

/**
 * Run comprehensive fraud check for driver
 */
const runDriverFraudCheck = async (driverId) => {
    return await detectDriverFraud(driverId);
};

/**
 * Get user risk profile
 */
const getUserRiskProfile = async (userId) => {
    const alerts = await FraudAlert.find({
        user: userId,
        status: { $in: ['PENDING', 'INVESTIGATING', 'CONFIRMED'] }
    }).sort({ createdAt: -1 });

    const totalRiskScore = alerts.reduce((sum, alert) => sum + alert.riskScore, 0);
    const avgRiskScore = alerts.length > 0 ? Math.round(totalRiskScore / alerts.length) : 0;

    const isBlacklistedUser = await isBlacklisted('USER', userId.toString());
    const isBlacklistedPhone = await User.findById(userId).then(user => 
        user ? isBlacklisted('PHONE', user.phone) : false
    );

    return {
        userId,
        totalAlerts: alerts.length,
        averageRiskScore: avgRiskScore,
        highSeverityAlerts: alerts.filter(a => ['HIGH', 'CRITICAL'].includes(a.severity)).length,
        isBlacklisted: isBlacklistedUser || isBlacklistedPhone,
        recentAlerts: alerts.slice(0, 5),
        riskLevel: avgRiskScore >= RISK_THRESHOLDS.CRITICAL ? 'CRITICAL' :
                   avgRiskScore >= RISK_THRESHOLDS.HIGH ? 'HIGH' :
                   avgRiskScore >= RISK_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW'
    };
};

/**
 * Get driver risk profile
 */
const getDriverRiskProfile = async (driverId) => {
    const alerts = await FraudAlert.find({
        driver: driverId,
        status: { $in: ['PENDING', 'INVESTIGATING', 'CONFIRMED'] }
    }).sort({ createdAt: -1 });

    const totalRiskScore = alerts.reduce((sum, alert) => sum + alert.riskScore, 0);
    const avgRiskScore = alerts.length > 0 ? Math.round(totalRiskScore / alerts.length) : 0;

    const isBlacklistedDriver = await isBlacklisted('DRIVER', driverId.toString());

    return {
        driverId,
        totalAlerts: alerts.length,
        averageRiskScore: avgRiskScore,
        highSeverityAlerts: alerts.filter(a => ['HIGH', 'CRITICAL'].includes(a.severity)).length,
        isBlacklisted: isBlacklistedDriver,
        recentAlerts: alerts.slice(0, 5),
        riskLevel: avgRiskScore >= RISK_THRESHOLDS.CRITICAL ? 'CRITICAL' :
                   avgRiskScore >= RISK_THRESHOLDS.HIGH ? 'HIGH' :
                   avgRiskScore >= RISK_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW'
    };
};

module.exports = {
    isBlacklisted,
    createFraudAlert,
    detectMultipleCancellations,
    detectRapidBookings,
    detectSuspiciousPayment,
    detectLocationMismatch,
    detectDriverFraud,
    detectRefundAbuse,
    detectAccountSharing,
    runUserFraudCheck,
    runDriverFraudCheck,
    getUserRiskProfile,
    getDriverRiskProfile,
    RISK_THRESHOLDS
};
