const mongoose = require('mongoose');
const User = require('../models/User');
const Captain = require('../models/Captain');
const SpareDriver = require('../models/SpareDriver');
const WalletTransaction = require('../models/WalletTransaction');

const getWalletSnapshot = (wallet = {}) => {
    const availableBalance = Number(wallet?.balance || 0);
    const heldBalance = Number(wallet?.heldBalance || 0);
    return {
        availableBalance,
        heldBalance,
        totalBalance: availableBalance + heldBalance
    };
};

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

        const { availableBalance: balanceBefore, heldBalance } = getWalletSnapshot(userBefore.wallet);
        const balanceAfter = balanceBefore + amountChange;

        // 2. Safety: Deny debit beyond credit limit (Arrears Protocol)
        const creditLimit = data.creditLimit || -500; // Allow up to ₹500 debt
        if (type === 'debit' && balanceAfter < creditLimit) {
            throw new Error(`Insufficient wallet credit. Maximum debt limit is ₹${Math.abs(creditLimit)}.`);
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
            heldBalance,
            totalBalance: balanceAfter + heldBalance,
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

const adjustWalletHold = async (
    userId,
    amount,
    direction,
    data = {},
    externalSession = null,
    modelOverride = null
) => {
    const Model = modelOverride || User;
    const {
        category = 'SERVICE_BOOKING',
        description = '',
        referenceId = `HOLD-${Date.now()}`,
        referenceType = 'wallet_hold',
        paymentMethod = 'wallet',
        status = 'completed',
        metaData = {}
    } = data;

    if (amount <= 0) {
        return { success: true, amount: 0, skipped: true };
    }

    if (!['hold', 'release', 'consume'].includes(direction)) {
        throw new Error('Invalid wallet hold direction');
    }

    const session = externalSession || await mongoose.startSession();
    if (!externalSession) session.startTransaction();

    try {
        const userBefore = await Model.findById(userId).session(session).select('wallet');
        if (!userBefore) throw new Error('Account not found');

        const { availableBalance, heldBalance, totalBalance } = getWalletSnapshot(userBefore.wallet);

        if (direction === 'hold' && availableBalance < amount) {
            throw new Error(`Insufficient wallet balance to hold ₹${amount}.`);
        }

        if ((direction === 'release' || direction === 'consume') && heldBalance < amount) {
            throw new Error(`Only ₹${heldBalance} is currently held in wallet.`);
        }

        const walletUpdate = {
            $set: { 'wallet.lastUpdated': new Date() }
        };

        let nextAvailableBalance = availableBalance;
        let nextHeldBalance = heldBalance;
        let txnType = 'debit';

        if (direction === 'hold') {
            walletUpdate.$inc = { 'wallet.balance': -amount, 'wallet.heldBalance': amount };
            nextAvailableBalance -= amount;
            nextHeldBalance += amount;
            txnType = 'debit';
        } else if (direction === 'release') {
            walletUpdate.$inc = { 'wallet.balance': amount, 'wallet.heldBalance': -amount };
            nextAvailableBalance += amount;
            nextHeldBalance -= amount;
            txnType = 'credit';
        } else {
            walletUpdate.$inc = { 'wallet.heldBalance': -amount };
            nextHeldBalance -= amount;
            txnType = 'debit';
        }

        await Model.findByIdAndUpdate(userId, walletUpdate, {
            session,
            runValidators: true
        });

        const transaction = await WalletTransaction.create([{
            user: userId,
            amount,
            type: txnType,
            status,
            category,
            description,
            referenceId,
            referenceType,
            paymentMethod,
            balanceBefore: availableBalance,
            balanceAfter: nextAvailableBalance,
            metaData: {
                ...metaData,
                holdDirection: direction,
                heldBefore: heldBalance,
                heldAfter: nextHeldBalance,
                totalBalanceBefore: totalBalance,
                totalBalanceAfter: nextAvailableBalance + nextHeldBalance
            }
        }], { session });

        if (!externalSession) await session.commitTransaction();

        return {
            success: true,
            balance: nextAvailableBalance,
            heldBalance: nextHeldBalance,
            totalBalance: nextAvailableBalance + nextHeldBalance,
            transaction: transaction[0]
        };
    } catch (error) {
        if (!externalSession) await session.abortTransaction();
        console.error('[WalletHelper] Hold Adjustment Failed:', error.message);
        throw error;
    } finally {
        if (!externalSession) session.endSession();
    }
};

module.exports = {
    executeWalletTransaction,
    adjustWalletHold,
    getWalletSnapshot
};
