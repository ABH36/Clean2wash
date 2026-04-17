const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpareDriver',
        required: true,
        index: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    type: {
        type: String,
        enum: [
            'CANCELLATION_BEFORE_TRIP',
            'CANCELLATION_AFTER_START',
            'NO_SHOW',
            'LATE_ARRIVAL',
            'CUSTOMER_COMPLAINT',
            'DOCUMENT_VIOLATION',
            'BEHAVIOR_VIOLATION',
            'SAFETY_VIOLATION',
            'OTHER'
        ],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPLIED', 'WAIVED', 'DISPUTED'],
        default: 'PENDING'
    },
    appliedAt: {
        type: Date
    },
    appliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waivedAt: {
        type: Date
    },
    waivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waiverReason: {
        type: String
    },
    deductionSource: {
        type: String,
        enum: ['WALLET', 'PAYOUT', 'PENDING'],
        default: 'WALLET'
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletTransaction'
    }
}, {
    timestamps: true
});

// Indexes
penaltySchema.index({ driver: 1, status: 1 });
penaltySchema.index({ booking: 1 });
penaltySchema.index({ createdAt: -1 });

// Method to apply penalty
penaltySchema.methods.apply = async function(appliedBy) {
    this.status = 'APPLIED';
    this.appliedAt = new Date();
    this.appliedBy = appliedBy;
    await this.save();
    
    // Deduct from driver wallet or mark for payout deduction
    const SpareDriver = mongoose.model('SpareDriver');
    const driver = await SpareDriver.findById(this.driver);
    
    if (driver && driver.wallet && driver.wallet.balance >= this.amount) {
        // Deduct from wallet
        driver.wallet.balance -= this.amount;
        this.deductionSource = 'WALLET';
        
        // Create wallet transaction
        const WalletTransaction = mongoose.model('WalletTransaction');
        const transaction = await WalletTransaction.create({
            user: this.driver,
            userType: 'sparedriver',
            type: 'DEBIT',
            amount: this.amount,
            category: 'PENALTY',
            description: `Penalty: ${this.reason}`,
            reference: {
                model: 'Penalty',
                id: this._id
            },
            status: 'COMPLETED'
        });
        
        this.transactionId = transaction._id;
        await driver.save();
    } else {
        // Mark for payout deduction
        this.deductionSource = 'PAYOUT';
    }
    
    await this.save();
    return this;
};

// Method to waive penalty
penaltySchema.methods.waive = async function(waivedBy, reason) {
    this.status = 'WAIVED';
    this.waivedAt = new Date();
    this.waivedBy = waivedBy;
    this.waiverReason = reason;
    
    // If already deducted from wallet, refund
    if (this.deductionSource === 'WALLET' && this.transactionId) {
        const SpareDriver = mongoose.model('SpareDriver');
        const driver = await SpareDriver.findById(this.driver);
        
        if (driver) {
            driver.wallet.balance += this.amount;
            await driver.save();
            
            // Create refund transaction
            const WalletTransaction = mongoose.model('WalletTransaction');
            await WalletTransaction.create({
                user: this.driver,
                userType: 'sparedriver',
                type: 'CREDIT',
                amount: this.amount,
                category: 'REFUND',
                description: `Penalty waived: ${reason}`,
                reference: {
                    model: 'Penalty',
                    id: this._id
                },
                status: 'COMPLETED'
            });
        }
    }
    
    await this.save();
    return this;
};

module.exports = mongoose.model('Penalty', penaltySchema);
