const mongoose = require('mongoose');

const driverPayoutSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpareDriver',
        required: true,
        index: true
    },
    payoutPeriod: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    trips: [{
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        },
        amount: Number,
        commission: Number,
        earning: Number,
        completedAt: Date
    }],
    totalTrips: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    totalCommission: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    penalties: [{
        penalty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Penalty'
        },
        amount: Number,
        reason: String
    }],
    totalPenalties: {
        type: Number,
        default: 0
    },
    adjustments: [{
        type: {
            type: String,
            enum: ['BONUS', 'DEDUCTION', 'CORRECTION']
        },
        amount: Number,
        reason: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: Date
    }],
    totalAdjustments: {
        type: Number,
        default: 0
    },
    payoutAmount: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['BANK_TRANSFER', 'UPI', 'WALLET'],
        default: 'BANK_TRANSFER'
    },
    bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
        bankName: String
    },
    upiId: String,
    transactionId: String,
    transactionDate: Date,
    failureReason: String,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: Date,
    notes: String
}, {
    timestamps: true
});

// Indexes
driverPayoutSchema.index({ driver: 1, 'payoutPeriod.start': -1 });
driverPayoutSchema.index({ status: 1 });
driverPayoutSchema.index({ createdAt: -1 });

// 🛡️ CRITICAL: Prevent duplicate payouts for same period
driverPayoutSchema.index(
    { driver: 1, 'payoutPeriod.start': 1, 'payoutPeriod.end': 1 }, 
    { unique: true, name: 'unique_driver_payout_period' }
);

// Method to calculate payout
driverPayoutSchema.methods.calculatePayout = function() {
    this.totalTrips = this.trips.length;
    this.totalAmount = this.trips.reduce((sum, trip) => sum + trip.amount, 0);
    this.totalCommission = this.trips.reduce((sum, trip) => sum + trip.commission, 0);
    this.totalEarnings = this.trips.reduce((sum, trip) => sum + trip.earning, 0);
    this.totalPenalties = this.penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
    this.totalAdjustments = this.adjustments.reduce((sum, adj) => {
        return sum + (adj.type === 'BONUS' || adj.type === 'CORRECTION' ? adj.amount : -adj.amount);
    }, 0);
    
    this.payoutAmount = this.totalEarnings - this.totalPenalties + this.totalAdjustments;
    
    // Ensure payout is not negative
    if (this.payoutAmount < 0) {
        this.payoutAmount = 0;
    }
    
    return this.payoutAmount;
};

// Method to add adjustment
driverPayoutSchema.methods.addAdjustment = function(type, amount, reason, addedBy) {
    this.adjustments.push({
        type,
        amount,
        reason,
        addedBy,
        addedAt: new Date()
    });
    this.calculatePayout();
    return this;
};

// Method to process payout
driverPayoutSchema.methods.process = async function(processedBy, transactionId) {
    this.status = 'PROCESSING';
    this.processedBy = processedBy;
    this.processedAt = new Date();
    this.transactionId = transactionId;
    await this.save();
    
    // Here you would integrate with payment gateway
    // For now, we'll mark as completed
    this.status = 'COMPLETED';
    this.transactionDate = new Date();
    await this.save();
    
    return this;
};

// Static method to generate weekly payout
driverPayoutSchema.statics.generateWeeklyPayout = async function(driverId, startDate, endDate) {
    const Booking = mongoose.model('Booking');
    const Penalty = mongoose.model('Penalty');
    const SpareDriver = mongoose.model('SpareDriver');
    
    const driver = await SpareDriver.findById(driverId);
    if (!driver) {
        throw new Error('Driver not found');
    }
    
    // Get completed bookings in period
    const bookings = await Booking.find({
        'provider.id': driverId,
        'service.type': 'sparedriver',
        status: 'completed',
        completedAt: {
            $gte: startDate,
            $lte: endDate
        }
    });
    
    // Get pending penalties
    const penalties = await Penalty.find({
        driver: driverId,
        status: 'APPLIED',
        deductionSource: 'PAYOUT',
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    });
    
    // Create payout record
    const payout = new this({
        driver: driverId,
        payoutPeriod: {
            start: startDate,
            end: endDate
        },
        trips: bookings.map(booking => ({
            booking: booking._id,
            amount: booking.pricing?.finalAmount || 0,
            commission: booking.pricing?.platformCommission || 0,
            earning: booking.pricing?.driverEarning || 0,
            completedAt: booking.completedAt
        })),
        penalties: penalties.map(penalty => ({
            penalty: penalty._id,
            amount: penalty.amount,
            reason: penalty.reason
        })),
        bankDetails: driver.bankDetails,
        upiId: driver.upiId
    });
    
    payout.calculatePayout();
    await payout.save();
    
    return payout;
};

module.exports = mongoose.model('DriverPayout', driverPayoutSchema);
