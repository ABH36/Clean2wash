const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SpareDriver = require('../models/SpareDriver');
const WalletTransaction = require('../models/WalletTransaction');
const { executeWalletTransaction, adjustWalletHold } = require('../utils/walletHelper');

/**
 * Edge Case Handler Service
 * Handles critical timing issues and race conditions
 */

/**
 * 1. PAYMENT SETTLEMENT TIMING EDGE CASES
 * Handles delayed settlements, partial payments, and timing conflicts
 */

/**
 * Process payment settlement with retry logic and idempotency
 */
const processPaymentSettlement = async (bookingId, options = {}) => {
    const {
        forceSettle = false,
        maxRetries = 3,
        retryDelay = 2000
    } = options;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Lock booking for update
        const booking = await Booking.findById(bookingId)
            .session(session)
            .select('+payment +pricing +provider');

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Check if already settled
        if (booking.payment.settlementStatus === 'paid' && !forceSettle) {
            await session.abortTransaction();
            return {
                success: true,
                alreadySettled: true,
                message: 'Payment already settled'
            };
        }

        // Validate settlement eligibility
        if (!['completed', 'cancelled'].includes(booking.status)) {
            throw new Error(`Cannot settle payment for booking in ${booking.status} status`);
        }

        // Calculate settlement amounts
        const totalAmount = booking.pricing.finalAmount || booking.pricing.totalAmount;
        const platformCommission = booking.pricing.platformCommission || 0;
        const driverEarning = booking.pricing.driverEarning || (totalAmount - platformCommission);

        // Check if driver exists
        if (!booking.provider?.id) {
            throw new Error('No provider assigned to booking');
        }

        // Get driver model
        const DriverModel = booking.provider.type === 'sparedriver' ? SpareDriver : User;
        
        // Credit driver wallet with retry logic
        let creditSuccess = false;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await executeWalletTransaction(
                    booking.provider.id,
                    driverEarning,
                    'credit',
                    {
                        category: 'SERVICE_BOOKING',
                        description: `Earning from booking ${booking.bookingId}`,
                        referenceId: `SETTLE-${booking.bookingId}-${Date.now()}`,
                        referenceType: 'booking_settlement',
                        paymentMethod: 'settlement',
                        metaData: {
                            bookingId: booking._id.toString(),
                            bookingNumber: booking.bookingId,
                            totalAmount,
                            platformCommission,
                            driverEarning,
                            settlementAttempt: attempt
                        }
                    },
                    session,
                    DriverModel
                );

                creditSuccess = true;
                break;
            } catch (error) {
                lastError = error;
                console.error(`Settlement attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        if (!creditSuccess) {
            throw new Error(`Failed to credit driver after ${maxRetries} attempts: ${lastError.message}`);
        }

        // Update booking settlement status
        booking.payment.settlementStatus = 'paid';
        booking.payment.settlementCollectedAt = new Date();
        booking.payment.providerPayoutAmount = driverEarning;
        booking.payment.platformCommissionAmount = platformCommission;
        booking.payment.settlementTransactionId = `SETTLE-${booking.bookingId}-${Date.now()}`;

        await booking.save({ session });

        await session.commitTransaction();

        return {
            success: true,
            bookingId: booking.bookingId,
            driverEarning,
            platformCommission,
            settlementTime: new Date()
        };

    } catch (error) {
        await session.abortTransaction();
        console.error('[PaymentSettlement] Error:', error);
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Handle partial payment scenarios
 */
const handlePartialPayment = async (bookingId, paidAmount) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            throw new Error('Booking not found');
        }

        const totalAmount = booking.pricing.finalAmount || booking.pricing.totalAmount;
        const pendingAmount = totalAmount - paidAmount;

        // Update payment status
        booking.payment.settledAmount = paidAmount;
        booking.payment.pendingAmount = pendingAmount;
        booking.payment.status = pendingAmount > 0 ? 'settlement_pending' : 'paid';

        await booking.save({ session });

        await session.commitTransaction();

        return {
            success: true,
            paidAmount,
            pendingAmount,
            totalAmount
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * 2. STATUS UPDATE SYNCHRONIZATION IN POOR NETWORK
 * Handles offline status updates with conflict resolution
 */

/**
 * Queue status update for offline processing
 */
const queueStatusUpdate = async (bookingId, newStatus, metadata = {}) => {
    const StatusUpdateQueue = mongoose.model('StatusUpdateQueue', new mongoose.Schema({
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
        newStatus: { type: String, required: true },
        metadata: mongoose.Schema.Types.Mixed,
        attempts: { type: Number, default: 0 },
        maxAttempts: { type: Number, default: 5 },
        status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
        lastAttemptAt: Date,
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24 hours
    }, { collection: 'statusupdatequeue' }));

    const queueItem = await StatusUpdateQueue.create({
        bookingId,
        newStatus,
        metadata: {
            ...metadata,
            queuedAt: new Date(),
            source: 'offline_sync'
        }
    });

    return queueItem;
};

/**
 * Process queued status updates with conflict resolution
 */
const processQueuedStatusUpdates = async () => {
    const StatusUpdateQueue = mongoose.model('StatusUpdateQueue');
    
    const pendingUpdates = await StatusUpdateQueue.find({
        status: 'pending',
        attempts: { $lt: 5 },
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: 1 }).limit(50);

    const results = [];

    for (const update of pendingUpdates) {
        try {
            // Mark as processing
            update.status = 'processing';
            update.attempts += 1;
            update.lastAttemptAt = new Date();
            await update.save();

            // Get current booking state
            const booking = await Booking.findById(update.bookingId);

            if (!booking) {
                update.status = 'failed';
                update.metadata.error = 'Booking not found';
                await update.save();
                continue;
            }

            // Conflict resolution: Check if status is still valid
            const isValidTransition = validateStatusTransition(
                booking.status,
                update.newStatus
            );

            if (!isValidTransition) {
                update.status = 'failed';
                update.metadata.error = `Invalid transition from ${booking.status} to ${update.newStatus}`;
                await update.save();
                continue;
            }

            // Apply status update
            booking.status = update.newStatus;
            
            // Add to activity log
            booking.activityLog.push({
                status: update.newStatus,
                timestamp: new Date(),
                description: `Status updated from offline queue`,
                metadata: new Map(Object.entries(update.metadata || {}))
            });

            await booking.save();

            // Mark as completed
            update.status = 'completed';
            await update.save();

            results.push({
                bookingId: booking.bookingId,
                success: true,
                newStatus: update.newStatus
            });

        } catch (error) {
            console.error(`Failed to process queued update ${update._id}:`, error);
            
            update.metadata.lastError = error.message;
            
            if (update.attempts >= update.maxAttempts) {
                update.status = 'failed';
            } else {
                update.status = 'pending';
            }
            
            await update.save();

            results.push({
                bookingId: update.bookingId,
                success: false,
                error: error.message
            });
        }
    }

    return results;
};

/**
 * Validate status transition
 */
const validateStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['accepted', 'assigned', 'cancelled'],
        'accepted': ['assigned', 'cancelled'],
        'assigned': ['en_route', 'cancelled'],
        'en_route': ['arrived', 'cancelled'],
        'arrived': ['picked-up', 'active', 'cancelled'],
        'picked-up': ['at-studio', 'in_progress', 'cancelled'],
        'at-studio': ['in_progress', 'washing', 'cancelled'],
        'in_progress': ['quality-check', 'completed', 'cancelled'],
        'washing': ['quality-check', 'completed', 'cancelled'],
        'quality-check': ['ready-for-delivery', 'completed', 'cancelled'],
        'ready-for-delivery': ['delivery-assigned', 'out_for_delivery', 'completed'],
        'delivery-assigned': ['out_for_delivery', 'completed'],
        'out_for_delivery': ['at_delivery_address', 'completed'],
        'at_delivery_address': ['completed'],
        'completed': [],
        'cancelled': ['refunded'],
        'refunded': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * 3. WALLET BALANCE INCONSISTENCIES IN CONCURRENT TRANSACTIONS
 * Handles race conditions in wallet operations
 */

/**
 * Execute concurrent-safe wallet transaction with optimistic locking
 */
const safeConcurrentWalletTransaction = async (userId, amount, type, data = {}, modelOverride = null) => {
    const maxRetries = 5;
    const baseDelay = 100; // ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const Model = modelOverride || User;

            // Get current version
            const user = await Model.findById(userId).session(session).select('wallet __v');

            if (!user) {
                throw new Error('User not found');
            }

            const currentVersion = user.__v;
            const currentBalance = user.wallet?.balance || 0;

            // Calculate new balance
            const amountChange = type === 'credit' ? amount : -amount;
            const newBalance = currentBalance + amountChange;

            // Validate balance
            if (type === 'debit' && newBalance < (data.creditLimit || -500)) {
                throw new Error('Insufficient balance');
            }

            // Update with version check (optimistic locking)
            const updateResult = await Model.updateOne(
                {
                    _id: userId,
                    __v: currentVersion // Only update if version matches
                },
                {
                    $inc: {
                        'wallet.balance': amountChange,
                        __v: 1 // Increment version
                    },
                    $set: {
                        'wallet.lastUpdated': new Date()
                    }
                },
                { session }
            );

            // Check if update was successful
            if (updateResult.modifiedCount === 0) {
                throw new Error('VERSION_CONFLICT'); // Retry
            }

            // Create transaction log
            await WalletTransaction.create([{
                user: userId,
                amount,
                type,
                status: 'completed',
                category: data.category || 'OTHER',
                description: data.description || '',
                referenceId: data.referenceId || `TXN-${Date.now()}`,
                referenceType: data.referenceType || '',
                paymentMethod: data.paymentMethod || 'wallet',
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                metaData: {
                    ...data.metaData,
                    attempt,
                    version: currentVersion
                }
            }], { session });

            await session.commitTransaction();

            return {
                success: true,
                balance: newBalance,
                attempt
            };

        } catch (error) {
            await session.abortTransaction();

            // Retry on version conflict
            if (error.message === 'VERSION_CONFLICT' && attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw error;
        } finally {
            session.endSession();
        }
    }

    throw new Error(`Failed to complete transaction after ${maxRetries} attempts`);
};

/**
 * Reconcile wallet balance inconsistencies
 */
const reconcileWalletBalance = async (userId, modelOverride = null) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const Model = modelOverride || User;

        // Calculate balance from transaction log
        const transactions = await WalletTransaction.find({
            user: userId,
            status: 'completed'
        }).session(session);

        let calculatedBalance = 0;

        for (const txn of transactions) {
            if (txn.type === 'credit') {
                calculatedBalance += txn.amount;
            } else {
                calculatedBalance -= txn.amount;
            }
        }

        // Get current balance
        const user = await Model.findById(userId).session(session).select('wallet');
        const currentBalance = user.wallet?.balance || 0;

        const discrepancy = currentBalance - calculatedBalance;

        if (Math.abs(discrepancy) > 0.01) { // Allow 1 paisa tolerance
            // Create reconciliation transaction
            await WalletTransaction.create([{
                user: userId,
                amount: Math.abs(discrepancy),
                type: discrepancy > 0 ? 'debit' : 'credit',
                status: 'completed',
                category: 'OTHER',
                description: `Balance reconciliation: ${discrepancy > 0 ? 'excess' : 'deficit'} of ₹${Math.abs(discrepancy)}`,
                referenceId: `RECON-${Date.now()}`,
                referenceType: 'reconciliation',
                paymentMethod: 'system',
                balanceBefore: currentBalance,
                balanceAfter: calculatedBalance,
                metaData: {
                    reconciliationType: 'balance_correction',
                    discrepancy,
                    reconciledAt: new Date()
                }
            }], { session });

            // Update user balance
            await Model.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        'wallet.balance': calculatedBalance,
                        'wallet.lastUpdated': new Date()
                    }
                },
                { session }
            );
        }

        await session.commitTransaction();

        return {
            success: true,
            currentBalance,
            calculatedBalance,
            discrepancy,
            reconciled: Math.abs(discrepancy) > 0.01
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * 4. SCHEDULED BOOKING DISPATCH TIMING ISSUES
 * Handles timing conflicts and ensures accurate dispatch
 */

/**
 * Process scheduled bookings with timing precision
 */
const processScheduledBookings = async () => {
    const now = new Date();
    const dispatchWindow = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes ahead

    // Find bookings that need to be dispatched
    const scheduledBookings = await Booking.find({
        'schedule.type': 'scheduled',
        'schedule.date': {
            $gte: now,
            $lte: dispatchWindow
        },
        status: { $in: ['pending', 'confirmed'] },
        scheduledAlertSent: false
    }).sort({ 'schedule.date': 1 });

    const results = [];

    for (const booking of scheduledBookings) {
        try {
            const scheduleTime = new Date(booking.schedule.date);
            const timeUntilSchedule = scheduleTime - now;

            // Only dispatch if within 30 minutes
            if (timeUntilSchedule <= 30 * 60 * 1000 && timeUntilSchedule >= 0) {
                // Mark as dispatched
                booking.scheduledAlertSent = true;
                booking.status = 'confirmed';
                
                booking.activityLog.push({
                    status: 'confirmed',
                    timestamp: new Date(),
                    description: 'Scheduled booking dispatched',
                    metadata: new Map(Object.entries({
                        scheduledFor: scheduleTime,
                        dispatchedAt: now,
                        timeUntilSchedule: Math.floor(timeUntilSchedule / 1000 / 60) // minutes
                    }))
                });

                await booking.save();

                // TODO: Notify driver/vendor
                // TODO: Send customer reminder

                results.push({
                    bookingId: booking.bookingId,
                    success: true,
                    scheduledFor: scheduleTime,
                    dispatchedAt: now
                });
            }
        } catch (error) {
            console.error(`Failed to dispatch booking ${booking.bookingId}:`, error);
            results.push({
                bookingId: booking.bookingId,
                success: false,
                error: error.message
            });
        }
    }

    return results;
};

/**
 * Handle timezone conflicts in scheduled bookings
 */
const normalizeScheduleTimezone = async (bookingId, timezone = 'Asia/Kolkata') => {
    const booking = await Booking.findById(bookingId);

    if (!booking || !booking.schedule.date) {
        throw new Error('Invalid booking or schedule');
    }

    // Convert to UTC
    const scheduleDate = new Date(booking.schedule.date);
    
    // Store original timezone info
    booking.schedule.metadata = {
        ...booking.schedule.metadata,
        originalTimezone: timezone,
        utcTime: scheduleDate.toISOString(),
        localTime: scheduleDate.toLocaleString('en-IN', { timeZone: timezone })
    };

    await booking.save();

    return {
        success: true,
        utcTime: scheduleDate.toISOString(),
        localTime: scheduleDate.toLocaleString('en-IN', { timeZone: timezone })
    };
};

module.exports = {
    // Payment Settlement
    processPaymentSettlement,
    handlePartialPayment,
    
    // Status Synchronization
    queueStatusUpdate,
    processQueuedStatusUpdates,
    validateStatusTransition,
    
    // Wallet Concurrency
    safeConcurrentWalletTransaction,
    reconcileWalletBalance,
    
    // Scheduled Bookings
    processScheduledBookings,
    normalizeScheduleTimezone
};
