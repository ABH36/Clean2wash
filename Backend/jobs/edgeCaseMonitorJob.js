const cron = require('node-cron');
const edgeCaseHandler = require('../services/edgeCaseHandlerService');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SpareDriver = require('../models/SpareDriver');

/**
 * Edge Case Monitor Job
 * Runs periodic checks and fixes for timing issues and inconsistencies
 */

/**
 * Process pending payment settlements
 * Runs every 5 minutes
 */
const processPaymentSettlements = cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('[EdgeCaseMonitor] Processing payment settlements...');

        // Find bookings with pending settlements
        const pendingSettlements = await Booking.find({
            status: { $in: ['completed', 'cancelled'] },
            'payment.settlementStatus': { $in: ['pending', 'auto_collected'] },
            'payment.status': 'paid'
        }).limit(50);

        let successCount = 0;
        let failCount = 0;

        for (const booking of pendingSettlements) {
            try {
                await edgeCaseHandler.processPaymentSettlement(booking._id);
                successCount++;
            } catch (error) {
                console.error(`Settlement failed for ${booking.bookingId}:`, error.message);
                failCount++;
            }
        }

        console.log(`[EdgeCaseMonitor] Settlements: ${successCount} success, ${failCount} failed`);

    } catch (error) {
        console.error('[EdgeCaseMonitor] Payment settlement job error:', error);
    }
}, {
    scheduled: false
});

/**
 * Process queued status updates
 * Runs every 2 minutes
 */
const processStatusUpdates = cron.schedule('*/2 * * * *', async () => {
    try {
        console.log('[EdgeCaseMonitor] Processing queued status updates...');

        const results = await edgeCaseHandler.processQueuedStatusUpdates();

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`[EdgeCaseMonitor] Status updates: ${successCount} success, ${failCount} failed`);

    } catch (error) {
        console.error('[EdgeCaseMonitor] Status update job error:', error);
    }
}, {
    scheduled: false
});

/**
 * Reconcile wallet balances
 * Runs every hour
 */
const reconcileWallets = cron.schedule('0 * * * *', async () => {
    try {
        console.log('[EdgeCaseMonitor] Reconciling wallet balances...');

        // Get users with recent transactions
        const recentTransactionUsers = await require('../models/WalletTransaction')
            .distinct('user', {
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            });

        let reconciledCount = 0;
        let discrepancyCount = 0;

        for (const userId of recentTransactionUsers.slice(0, 100)) { // Limit to 100 per run
            try {
                const result = await edgeCaseHandler.reconcileWalletBalance(userId);
                
                if (result.reconciled) {
                    discrepancyCount++;
                    console.log(`Reconciled wallet for user ${userId}: ₹${result.discrepancy} discrepancy`);
                }
                
                reconciledCount++;
            } catch (error) {
                console.error(`Reconciliation failed for user ${userId}:`, error.message);
            }
        }

        console.log(`[EdgeCaseMonitor] Reconciled ${reconciledCount} wallets, found ${discrepancyCount} discrepancies`);

    } catch (error) {
        console.error('[EdgeCaseMonitor] Wallet reconciliation job error:', error);
    }
}, {
    scheduled: false
});

/**
 * Process scheduled bookings
 * Runs every minute
 */
const processScheduledBookings = cron.schedule('* * * * *', async () => {
    try {
        console.log('[EdgeCaseMonitor] Processing scheduled bookings...');

        const results = await edgeCaseHandler.processScheduledBookings();

        console.log(`[EdgeCaseMonitor] Dispatched ${results.length} scheduled bookings`);

        // Log any failures
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
            console.error(`[EdgeCaseMonitor] ${failures.length} bookings failed to dispatch`);
        }

    } catch (error) {
        console.error('[EdgeCaseMonitor] Scheduled booking job error:', error);
    }
}, {
    scheduled: false
});

/**
 * Detect and fix stuck bookings
 * Runs every 10 minutes
 */
const detectStuckBookings = cron.schedule('*/10 * * * *', async () => {
    try {
        console.log('[EdgeCaseMonitor] Detecting stuck bookings...');

        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        // Find bookings stuck in intermediate states
        const stuckBookings = await Booking.find({
            status: { $in: ['assigned', 'en_route', 'arrived', 'in_progress'] },
            updatedAt: { $lt: twoHoursAgo },
            isStuckAlertSent: false
        });

        for (const booking of stuckBookings) {
            try {
                // Mark as stuck
                booking.isStuckAlertSent = true;
                
                booking.activityLog.push({
                    status: booking.status,
                    timestamp: new Date(),
                    description: 'Booking detected as stuck - requires manual intervention',
                    metadata: new Map(Object.entries({
                        stuckDuration: Math.floor((now - booking.updatedAt) / 1000 / 60), // minutes
                        lastStatus: booking.status,
                        detectedAt: now
                    }))
                });

                await booking.save();

                // TODO: Send alert to admin
                // TODO: Notify customer

                console.log(`Detected stuck booking: ${booking.bookingId} (${booking.status})`);

            } catch (error) {
                console.error(`Failed to process stuck booking ${booking.bookingId}:`, error);
            }
        }

        console.log(`[EdgeCaseMonitor] Found ${stuckBookings.length} stuck bookings`);

    } catch (error) {
        console.error('[EdgeCaseMonitor] Stuck booking detection error:', error);
    }
}, {
    scheduled: false
});

/**
 * Clean up expired status update queue
 * Runs every 6 hours
 */
const cleanupStatusQueue = cron.schedule('0 */6 * * *', async () => {
    try {
        console.log('[EdgeCaseMonitor] Cleaning up expired status queue...');

        const StatusUpdateQueue = require('mongoose').model('StatusUpdateQueue');
        
        const result = await StatusUpdateQueue.deleteMany({
            $or: [
                { expiresAt: { $lt: new Date() } },
                { status: 'completed', createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 days old
            ]
        });

        console.log(`[EdgeCaseMonitor] Cleaned up ${result.deletedCount} expired queue items`);

    } catch (error) {
        console.error('[EdgeCaseMonitor] Queue cleanup error:', error);
    }
}, {
    scheduled: false
});

/**
 * Monitor wallet hold timeouts
 * Runs every 15 minutes
 */
const monitorWalletHolds = cron.schedule('*/15 * * * *', async () => {
    try {
        console.log('[EdgeCaseMonitor] Monitoring wallet holds...');

        const now = new Date();

        // Find bookings with expired wallet holds
        const expiredHolds = await Booking.find({
            'payment.walletReserveStatus': 'held',
            'payment.walletReserveHeldAt': {
                $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
            },
            status: { $nin: ['completed', 'cancelled', 'refunded'] }
        });

        for (const booking of expiredHolds) {
            try {
                // Release expired hold
                const { adjustWalletHold } = require('../utils/walletHelper');
                
                await adjustWalletHold(
                    booking.consumer,
                    booking.payment.walletReserveHeldAmount,
                    'release',
                    {
                        category: 'SERVICE_BOOKING',
                        description: `Expired wallet hold released for booking ${booking.bookingId}`,
                        referenceId: `HOLD-EXPIRE-${booking.bookingId}`,
                        referenceType: 'wallet_hold_expiry',
                        metaData: {
                            bookingId: booking._id.toString(),
                            heldAt: booking.payment.walletReserveHeldAt,
                            releasedAt: now,
                            reason: 'timeout'
                        }
                    }
                );

                // Update booking
                booking.payment.walletReserveStatus = 'released';
                booking.payment.walletReserveReleasedAt = now;
                booking.payment.walletReserveReleasedAmount = booking.payment.walletReserveHeldAmount;

                await booking.save();

                console.log(`Released expired hold for booking ${booking.bookingId}`);

            } catch (error) {
                console.error(`Failed to release hold for ${booking.bookingId}:`, error);
            }
        }

        console.log(`[EdgeCaseMonitor] Released ${expiredHolds.length} expired wallet holds`);

    } catch (error) {
        console.error('[EdgeCaseMonitor] Wallet hold monitoring error:', error);
    }
}, {
    scheduled: false
});

/**
 * Start all monitoring jobs
 */
const startAllJobs = () => {
    console.log('[EdgeCaseMonitor] Starting all monitoring jobs...');
    
    processPaymentSettlements.start();
    processStatusUpdates.start();
    reconcileWallets.start();
    processScheduledBookings.start();
    detectStuckBookings.start();
    cleanupStatusQueue.start();
    monitorWalletHolds.start();
    
    console.log('[EdgeCaseMonitor] All jobs started successfully');
};

/**
 * Stop all monitoring jobs
 */
const stopAllJobs = () => {
    console.log('[EdgeCaseMonitor] Stopping all monitoring jobs...');
    
    processPaymentSettlements.stop();
    processStatusUpdates.stop();
    reconcileWallets.stop();
    processScheduledBookings.stop();
    detectStuckBookings.stop();
    cleanupStatusQueue.stop();
    monitorWalletHolds.stop();
    
    console.log('[EdgeCaseMonitor] All jobs stopped');
};

module.exports = {
    startAllJobs,
    stopAllJobs,
    jobs: {
        processPaymentSettlements,
        processStatusUpdates,
        reconcileWallets,
        processScheduledBookings,
        detectStuckBookings,
        cleanupStatusQueue,
        monitorWalletHolds
    }
};
