const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plan: {
        type: String,
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    hub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hub'
    },
    parkingDetails: {
        basement: String,
        block: String,
        pillar: String,
        carModel: String,
        carNumber: String
    },
    slot: {
        type: String,
        enum: ['morning', 'evening']
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'paused'],
        default: 'active'
    },
    startDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    autoRenew: {
        type: Boolean,
        default: false
    },
    benefits: [{
        type: String,
        enum: [
            'free_wash_monthly',
            'discount_20_percent',
            'discount_30_percent',
            'priority_booking',
            'free_pickup_drop',
            'vip_support',
            'bonus_credits'
        ]
    }],
    monthlyCredits: {
        type: Number,
        default: 0
    },
    usedCredits: {
        type: Number,
        default: 0
    },
    maxVehicles: {
        type: Number,
        default: 1
    },
    rollover: {
        type: Number,
        default: 0
    },
    price: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'INR'
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly'],
            default: 'monthly'
        }
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'wallet', 'netbanking', 'razorpay'],
        required: true
    },
    paymentGateway: {
        provider: {
            type: String,
            default: 'razorpay'
        },
        orderId: String,
        paymentId: String,
        signature: String
    },
    service: {
        id: String,
        key: String,
        title: String,
        path: String
    },
    orderId: String,
    paymentId: String,
    lastPaymentDate: Date,
    nextBillingDate: Date
}, {
    timestamps: true
});

// Indexes for better performance
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ hub: 1, slot: 1, status: 1 });
subscriptionSchema.index({ 'service.key': 1, status: 1 });

// Static method to get active subscription
subscriptionSchema.statics.getActiveSubscription = async function (userId) {
    return this.findOne({
        user: userId,
        status: 'active',
        endDate: { $gt: new Date() }
    }).populate('user', 'name email phone');
};

// Static method to create subscription
subscriptionSchema.statics.createSubscription = async function (subscriptionData) {
    const subscription = await this.create(subscriptionData);

    // Update user with subscription reference
    await mongoose.model('User').findByIdAndUpdate(
        subscriptionData.user,
        { subscription: subscription._id }
    );

    return subscription;
};

// Instance method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
    return this.status === 'active' && this.endDate > new Date();
};

// Instance method to get available credits
subscriptionSchema.methods.getAvailableCredits = function () {
    return this.monthlyCredits - this.usedCredits;
};

// Instance method to use credits
subscriptionSchema.methods.useCredits = async function (amount) {
    if (this.getAvailableCredits() < amount) {
        throw new Error('Insufficient credits');
    }

    this.usedCredits += amount;
    return this.save();
};

// Instance method to renew subscription
subscriptionSchema.methods.renew = async function (durationMonths = 1) {
    const now = new Date();
    this.endDate = new Date(now.setMonth(now.getMonth() + durationMonths));
    this.status = 'active';
    this.lastPaymentDate = new Date();
    this.nextBillingDate = this.endDate;
    this.usedCredits = 0; // Reset credits on renewal

    return this.save();
};

// Static method to expire subscriptions
subscriptionSchema.statics.expireSubscriptions = async function () {
    return this.updateMany(
        {
            status: 'active',
            endDate: { $lt: new Date() }
        },
        { status: 'expired' }
    );
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
