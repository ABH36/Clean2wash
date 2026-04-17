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
        enum: ['pending', 'active', 'expired', 'cancelled', 'paused', 'rejected'],
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
    applicableServices: {
        type: [String],
        default: []
    },
    moduleScope: {
        type: String,
        enum: ['general', 'spare-driver', 'apartment-wash', 'all'],
        default: 'general'
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
            enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'annual'],
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
    nextBillingDate: Date,
    lastPauseDate: Date,
    pauseHistory: [{
        pausedAt: { type: Date, required: true },
        resumedAt: { type: Date },
        durationMs: { type: Number, default: 0 }
    }],
    skipDates: [{
        type: Date
    }],
    review: {
        rejectionReason: {
            type: String,
            trim: true,
            default: ''
        },
        reviewedAt: Date,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ hub: 1, slot: 1, status: 1 });
subscriptionSchema.index({ 'service.key': 1, status: 1 });

// Static method to get active subscription (with Auto-Expiry check)
const normalizeApplicableValue = (value = '') => String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getBookingServiceAliases = (bookingData = {}) => {
    const { service = {} } = bookingData;
    const aliases = new Set();

    [
        service.id,
        service.key,
        service.name,
        service.title,
        service.path,
        service.category,
        service.metadata?.id,
        service.metadata?.path,
        service.metadata?.category
    ].forEach((value) => {
        const normalized = normalizeApplicableValue(value);
        if (normalized) aliases.add(normalized);
    });

    return aliases;
};

const deriveSubscriptionModuleScope = (subscription = {}) => {
    if (subscription.moduleScope) return subscription.moduleScope;

    const applicable = Array.isArray(subscription.applicableServices) ? subscription.applicableServices : [];
    const normalized = applicable.map(normalizeApplicableValue);
    if (normalized.includes('APARTMENT_WASH')) {
        return 'apartment-wash';
    }
    if (normalized.includes('SPARE_DRIVER') || normalized.includes('CHAUFFEUR')) {
        return 'spare-driver';
    }

    return 'general';
};

subscriptionSchema.statics.getActiveSubscription = async function (userId, bookingData = null, options = {}) {
    const now = new Date();

    const subscriptions = await this.find({
        user: userId,
        status: { $in: ['active', 'paused'] }
    })
        .sort({ createdAt: -1 })
        .populate('user', 'name email phone');

    if (!subscriptions.length) return null;

    const validSubscriptions = [];
    for (const subscription of subscriptions) {
        if (subscription.endDate < now) {
            subscription.status = 'expired';
            await subscription.save();
            continue;
        }

        validSubscriptions.push(subscription);
    }

    if (!validSubscriptions.length) return null;

    const requestedScope = options.moduleScope || bookingData?.moduleScope || null;

    if (requestedScope) {
        const scoped = validSubscriptions.find((subscription) => {
            const scope = deriveSubscriptionModuleScope(subscription);
            const scopeMatches = scope === requestedScope || scope === 'all';
            if (!scopeMatches) return false;
            if (!bookingData) return true;
            return subscription.isServiceEligible({ ...bookingData, moduleScope: requestedScope });
        });

        if (scoped) return scoped;
    }

    if (bookingData) {
        const eligible = validSubscriptions.find((subscription) => subscription.isServiceEligible(bookingData));
        if (eligible) return eligible;
    }

    return validSubscriptions[0];
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
subscriptionSchema.methods.useCredits = async function (amount, session = null) {
    if (this.getAvailableCredits() < amount) {
        throw new Error('Insufficient credits');
    }

    this.usedCredits += amount;
    return this.save({ session });
};

subscriptionSchema.methods.addCredits = async function (amount = 1, session = null) {
    this.usedCredits = Math.max(0, (this.usedCredits || 0) - amount);
    return this.save({ session });
};

// Instance method to check service eligibility (Resilient Logic)
subscriptionSchema.methods.isServiceEligible = function (bookingData) {
    // If no restrictions (Legacy/Global), everything is eligible
    const effectiveScope = deriveSubscriptionModuleScope(this);
    const hasExplicitRestrictions = Array.isArray(this.applicableServices) && this.applicableServices.length > 0;

    const { service = {}, hub = null, location = {} } = bookingData;
    const category = service.category || '';
    const serviceKey = (service.key || '').toUpperCase();
    
    const isInstant = (bookingData.schedule?.type || service.schedule?.type) === 'instant';
    const isApartment = !!hub || (location.type !== 'studio' && !!location.hubId) || serviceKey.includes('APARTMENT');
    const isChauffeur = category === 'Chauffeur' || serviceKey.includes('DRIVER');
    const serviceAliases = getBookingServiceAliases(bookingData);

    if (!hasExplicitRestrictions) {
        if (effectiveScope === 'spare-driver' || effectiveScope === 'apartment-wash') {
            return false;
        }
        if (isApartment || isChauffeur) {
            return false;
        }
        return true;
    }

    return this.applicableServices.some(serviceName => {
        const normalized = normalizeApplicableValue(serviceName);
        
        // Match by Key (Robust)
        if (normalized === 'INSTANT_WASH') {
            return category === 'Doorstep' && isInstant && !isApartment;
        }
        if (normalized === 'STUDIO_WASH' || normalized === 'STUDIO_DETAILING') {
            return category === 'Studio';
        }
        if (normalized === 'APARTMENT_WASH') {
            return isApartment;
        }
        if (normalized === 'SPARE_DRIVER' || normalized === 'CHAUFFEUR') {
            return isChauffeur;
        }

        if (serviceAliases.has(normalized)) {
            return true;
        }

        return [...serviceAliases].some((alias) => alias.includes(normalized) || normalized.includes(alias));
    });
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
