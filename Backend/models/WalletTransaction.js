const mongoose = require('mongoose');

const CATEGORY_ENUM = [
    'WALLET_RECHARGE',
    'SERVICE_BOOKING',
    'SUBSCRIPTION',
    'REFUND',
    'REWARD',
    'WITHDRAWAL'
];

const LEGACY_CATEGORY_MAP = {
    wallet_recharge: 'WALLET_RECHARGE',
    WALLET_RECHARGE: 'WALLET_RECHARGE',
    booking_payment: 'SERVICE_BOOKING',
    BOOKING_PAYMENT: 'SERVICE_BOOKING',
    service_booking: 'SERVICE_BOOKING',
    SERVICE_BOOKING: 'SERVICE_BOOKING',
    subscription: 'SUBSCRIPTION',
    SUBSCRIPTION: 'SUBSCRIPTION',
    refund: 'REFUND',
    REFUND: 'REFUND',
    reward: 'REWARD',
    REWARD: 'REWARD',
    referral_reward: 'REWARD',
    REFERRAL_REWARD: 'REWARD',
    withdrawal: 'WITHDRAWAL',
    WITHDRAWAL: 'WITHDRAWAL',
    other: 'WITHDRAWAL',
    OTHER: 'WITHDRAWAL'
};

const normalizeCategory = (category) => {
    if (!category) return category;
    if (LEGACY_CATEGORY_MAP[category]) {
        return LEGACY_CATEGORY_MAP[category];
    }

    const normalized = String(category).trim().toUpperCase();
    if (LEGACY_CATEGORY_MAP[normalized]) {
        return LEGACY_CATEGORY_MAP[normalized];
    }

    return normalized;
};

const walletTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    category: {
        type: String,
        enum: CATEGORY_ENUM,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    referenceId: {
        type: String
    },
    referenceType: {
        type: String,
        default: ''
    },
    paymentMethod: {
        type: String,
        default: ''
    },
    balanceBefore: {
        type: Number
    },
    balanceAfter: {
        type: Number
    },
    metaData: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

walletTransactionSchema.pre('validate', async function () {
    if (this.category) {
        this.category = normalizeCategory(this.category);
    }

    // IMMUTABILITY: Prevent modification of finalized transactions
    if (!this.isNew) {
        const original = await this.constructor.findById(this._id);
        if (original && (original.status === 'completed' || original.status === 'rejected')) {
            throw new Error(`CRITICAL: Attempted to modify finalized transaction #${this._id} (${original.status})`);
        }
    }
});

// Index for getting user's transactions quickly
walletTransactionSchema.index({ user: 1, createdAt: -1 });

// CRITICAL: Block duplicate credits from same source
walletTransactionSchema.index({ referenceId: 1, category: 1 }, { unique: true, sparse: true });

walletTransactionSchema.statics.createTransaction = function (payload = {}) {
    const transactionPayload = { ...payload };
    if (transactionPayload.category) {
        transactionPayload.category = normalizeCategory(transactionPayload.category);
    }
    return this.create(transactionPayload);
};

walletTransactionSchema.statics.getUserTransactions = async function (userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        type,
        category,
        startDate,
        endDate
    } = options;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = { user: userId };

    if (type) {
        query.type = type;
    }

    if (category) {
        query.category = normalizeCategory(category);
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
        this.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit),
        this.countDocuments(query)
    ]);

    return {
        transactions,
        pagination: {
            total,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(total / parsedLimit)
        }
    };
};

walletTransactionSchema.statics.normalizeCategory = normalizeCategory;

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
