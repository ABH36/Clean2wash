const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    consumer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consumer',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['booking_payment', 'refund', 'wallet_recharge', 'reward', 'penalty', 'other'],
        default: 'other'
    },
    referenceId: {
        type: String,
        trim: true
    },
    referenceType: {
        type: String,
        enum: ['booking', 'refund', 'recharge'],
        trim: true
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'cash', 'card', 'upi', 'netbanking'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'completed'
    },
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
walletTransactionSchema.index({ consumer: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });
walletTransactionSchema.index({ referenceId: 1, referenceType: 1 });

// Static method to get transaction history
walletTransactionSchema.statics.getConsumerTransactions = async function(consumerId, options = {}) {
    const { page = 1, limit = 20, type, category, startDate, endDate } = options;
    const skip = (page - 1) * limit;
    
    const query = { consumer: consumerId };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const transactions = await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');
    
    const total = await this.countDocuments(query);
    
    return {
        transactions,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Static method to create transaction
walletTransactionSchema.statics.createTransaction = async function(transactionData) {
    const transaction = await this.create(transactionData);
    
    // Update consumer wallet balance
    await mongoose.model('Consumer').findByIdAndUpdate(
        transactionData.consumer,
        { 
            'wallet.balance': transactionData.balanceAfter,
            'wallet.lastUpdated': new Date()
        }
    );
    
    return transaction;
};

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;
