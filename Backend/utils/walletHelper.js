const mongoose = require('mongoose');
const User = require('../models/User');
const Captain = require('../models/Captain');
const SpareDriver = require('../models/SpareDriver');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Execute a wallet transaction with ACID properties (Atomicity, Consistency, Isolation, Durability).
 * Uses MongoDB sessions to ensure balance and logs are updated as a single unit.
 * 
 * @param {string} userId - ID of the user (Consumer, Captain, SpareDriver, etc.)
 * @param {number} amount - Positive number indicating the amount
 * @param {string} type - 'credit' (add) or 'debit' (remove)
 * @param {Object} data - Metadata (category, description, referenceId, paymentMethod)
 * @param {session} [externalSession] - Optional existing MongoDB session for nested transactions
 * @param {mongoose.Model} [modelOverride] - Optional model to use (Defaults to User)
 */
const executeWalletTransaction = async (userId, amount, type, data = {}, externalSession = null, modelOverride = null) => {
    const Model = modelOverride || User;
    const {
        category = 'OTHER',
        description = '',
        referenceId = `TXN-${Date.now()}`,
        referenceType = '',
        paymentMethod = 'wallet',
        status = 'completed',
        metaData = {}
    } = data;

    if (amount <= 0) throw new Error('Transaction amount must be positive');
    if (!['credit', 'debit'].includes(type)) throw new Error('Invalid transaction type');

    const amountChange = type === 'credit' ? amount : -amount;
    const session = externalSession || await mongoose.startSession();

    // If we started our own session, start a transaction
    if (!externalSession) session.startTransaction();

    try {
        // 1. Update Balance & Get previous state Atomically ($inc)
        // Note: we use { new: false } to get the state BEFORE the change
        const userBefore = await Model.findByIdAndUpdate(
            userId,
            {
                $inc: { 'wallet.balance': amountChange },
                $set: { 'wallet.lastUpdated': new Date() }
            },
            {
                session,
                new: false, // returns old document
                runValidators: true
            }
        ).select('wallet');

        if (!userBefore) throw new Error('Account not found');

        const balanceBefore = userBefore.wallet?.balance || 0;
        const balanceAfter = balanceBefore + amountChange;

        // 2. Safety: Deny negative balance for debits (extra layer)
        if (type === 'debit' && balanceAfter < 0) {
            throw new Error('Insufficient wallet balance');
        }

        // 3. Create Audit Log
        const transaction = await WalletTransaction.create([{
            user: userId,
            amount,
            type,
            status,
            category,
            description,
            referenceId,
            referenceType,
            paymentMethod,
            balanceBefore,
            balanceAfter,
            metaData
        }], { session });

        // If we started our own session, commit it
        if (!externalSession) await session.commitTransaction();

        return {
            success: true,
            balance: balanceAfter,
            transaction: transaction[0]
        };

    } catch (error) {
        // If we started our own session, abort it
        if (!externalSession) await session.abortTransaction();
        console.error('[WalletHelper] Transaction Failed:', error.message);
        throw error;
    } finally {
        if (!externalSession) session.endSession();
    }
};

module.exports = { executeWalletTransaction };
