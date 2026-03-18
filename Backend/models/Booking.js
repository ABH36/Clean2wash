const mongoose = require('mongoose');

const PROVIDER_TYPE_TO_MODEL = {
    captain: 'Captain',
    vendor: 'User',
    sparedriver: 'SpareDriver'
};

const resolveProviderModel = (providerType) => PROVIDER_TYPE_TO_MODEL[providerType];

const bookingSchema = new mongoose.Schema({
    consumer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a user']
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Booking must have a vehicle']
    },
    service: {
        id: {
            type: String,
            required: [true, 'Service ID is required']
        },
        name: {
            type: String,
            required: [true, 'Service name is required']
        },
        category: {
            type: String,
            required: [true, 'Service category is required'],
            enum: ['Doorstep', 'Studio', 'Studio Detailing', 'Add-ons', 'Prestige', 'Chauffeur']
        },
        type: {
            type: String,
            required: [true, 'Service type is required'],
            enum: ['captain', 'vendor', 'sparedriver']
        },
        duration: String,
        basePrice: Number,
        features: [String]
    },
    pricing: {
        baseAmount: {
            type: Number,
            required: [true, 'Base amount is required']
        },
        vehicleMultiplier: {
            type: Number,
            default: 1.0
        },
        addonAmount: {
            type: Number,
            default: 0
        },
        discountAmount: {
            type: Number,
            default: 0
        },
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required']
        },
        currency: {
            type: String,
            default: 'INR'
        }
    },
    addons: [{
        id: String,
        name: String,
        price: Number,
        included: {
            type: Boolean,
            default: false
        }
    }],
    schedule: {
        type: {
            type: String,
            enum: ['instant', 'scheduled'],
            default: 'instant'
        },
        date: Date,
        timeSlot: {
            start: String,
            end: String
        },
        estimatedDuration: String
    },
    location: {
        type: {
            type: String,
            enum: ['home', 'office', 'other', 'studio'],
            default: 'home'
        },
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            coordinates: {
                lat: Number,
                lng: Number
            },
            geoPoint: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
            }
        },
        landmark: String,
        instructions: String
    },
    status: {
        type: String,
        enum: [
            'pending', 'confirmed', 'accepted', 'assigned', 'pickup-assigned', 
            'en_route', 'arrived', 'before_photo', 'at-studio', 'washing', 
            'in_progress', 'after_photo', 'quality-check', 'ready-for-delivery', 
            'delivery-assigned', 'completed', 'cancelled', 'refunded'
        ],
        default: 'pending'
    },
    payment: {
        method: {
            type: String,
            enum: ['cash', 'online', 'wallet', 'subscription'],
            default: 'online'
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded', 'refund_pending'],
            default: 'pending'
        },
        transactionId: String,
        paidAt: Date,
        refundAmount: Number,
        refundedAt: Date
    },
    provider: {
        type: {
            type: String,
            enum: ['captain', 'vendor', 'sparedriver'],
            required: true
        },
        model: {
            type: String,
            enum: ['Captain', 'User', 'SpareDriver']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'provider.model'
        },
        name: String,
        phone: String,
        rating: Number,
        photo: String
    },
    pickupStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deliveryStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tracking: {
        assignedAt: Date,
        startedAt: Date,
        arrivedAt: Date,
        completedAt: Date,
        washStartedAt: Date,
        washCompletedAt: Date,
        readyForPickupAt: Date,
        currentLocation: {
            lat: Number,
            lng: Number,
            updatedAt: Date
        }
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String,
        photos: [String],
        submittedAt: Date
    },
    serviceImages: {
        before: [String],
        after: [String],
        capturedAt: Date
    },
    issues: [{
        type: {
            type: String,
            enum: ['damage', 'delay', 'quality', 'behavior', 'other', 'SOS']
        },
        description: String,
        photo: String,
        reportedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['open', 'investigating', 'resolved', 'dismissed'],
            default: 'open'
        }
    }],
    subscription: {
        used: {
            type: Boolean,
            default: false
        },
        planId: mongoose.Schema.Types.ObjectId,
        washesRemaining: Number
    },
    notes: {
        consumer: String,
        provider: String,
        internal: String
    },
    bookingId: {
        type: String,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    securityPin: {
        type: String,
        default: () => Math.floor(1000 + Math.random() * 9000).toString()
    },
    // Prevents booking monitor from sending duplicate scheduled time alerts
    scheduledAlertSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
bookingSchema.index({ consumer: 1, createdAt: -1 });
bookingSchema.index({ vehicle: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'schedule.date': 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ 'provider.id': 1 });
bookingSchema.index({ 'location.address.geoPoint': '2dsphere' });

// Virtual for booking timeline status
bookingSchema.virtual('timelineStatus').get(function () {
    const status = this.status;
    const timeline = {
        'pending': { label: 'Booking Pending', color: 'orange', step: 1 },
        'confirmed': { label: 'Booking Confirmed', color: 'blue', step: 2 },
        'accepted': { label: 'Studio Accepted', color: 'blue', step: 2 },
        'assigned': { label: 'Provider Assigned', color: 'blue', step: 3 },
        'pickup-assigned': { label: 'Pickup Assigned', color: 'blue', step: 3 },
        'en_route': { label: 'On the Way', color: 'blue', step: 3.5 },
        'at-studio': { label: 'At Studio', color: 'purple', step: 4 },
        'in_progress': { label: 'Washing', color: 'purple', step: 4 },
        'washing': { label: 'Washing', color: 'purple', step: 4 },
        'quality-check': { label: 'Quality Check', color: 'purple', step: 4.5 },
        'ready-for-delivery': { label: 'Ready for Home', color: 'green', step: 5 },
        'delivery-assigned': { label: 'Out for Delivery', color: 'green', step: 5 },
        'completed': { label: 'Service Completed', color: 'green', step: 6 },
        'cancelled': { label: 'Booking Cancelled', color: 'red', step: 0 },
        'refunded': { label: 'Refunded', color: 'gray', step: 0 }
    };
    return timeline[status] || timeline['pending'];
});

// Virtual for estimated completion time
bookingSchema.virtual('estimatedCompletion').get(function () {
    if (this.schedule.type === 'instant') {
        const now = new Date();
        const estimatedMinutes = 45; // Default instant service time
        return new Date(now.getTime() + estimatedMinutes * 60 * 1000);
    }

    if (this.schedule.date && this.schedule.timeSlot) {
        const [hours, minutes] = this.schedule.timeSlot.start.split(':');
        const scheduleDate = new Date(this.schedule.date);
        scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Add service duration (convert duration string to minutes)
        const durationMatch = (this.service.duration || '').match(/(\d+)/);
        const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;

        return new Date(scheduleDate.getTime() + durationMinutes * 60 * 1000);
    }

    return null;
});

// Pre-save middleware to generate booking ID and sync geoPoint
bookingSchema.pre('save', async function () {
    if (this.isNew || !this.bookingId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.bookingId = `CW${timestamp}${random}`;
    }

    // Sync geoPoint
    if (this.location && this.location.address && this.location.address.coordinates) {
        const { lat, lng } = this.location.address.coordinates;
        if (lat && lng) {
            this.location.address.geoPoint = {
                type: 'Point',
                coordinates: [lng, lat]
            };
        }
    }
});

bookingSchema.pre('validate', async function () {
    if (this.provider?.type) {
        const model = resolveProviderModel(this.provider.type);
        if (model) {
            this.provider.model = model;
        }
    }
});

const syncProviderModelOnUpdate = (update = {}) => {
    const updateDoc = { ...update };
    const setDoc = updateDoc.$set || {};

    const explicitType = setDoc['provider.type'] || updateDoc['provider.type'] || updateDoc.provider?.type;
    const resolvedModel = resolveProviderModel(explicitType);
    if (!resolvedModel) {
        return updateDoc;
    }

    if (updateDoc.$set) {
        updateDoc.$set = {
            ...setDoc,
            'provider.model': resolvedModel
        };
        return updateDoc;
    }

    if (updateDoc.provider && typeof updateDoc.provider === 'object') {
        updateDoc.provider = {
            ...updateDoc.provider,
            model: resolvedModel
        };
        return updateDoc;
    }

    updateDoc['provider.model'] = resolvedModel;
    return updateDoc;
};

bookingSchema.pre('findOneAndUpdate', async function () {
    const updated = syncProviderModelOnUpdate(this.getUpdate() || {});
    this.setUpdate(updated);
});

bookingSchema.pre('updateOne', async function () {
    const updated = syncProviderModelOnUpdate(this.getUpdate() || {});
    this.setUpdate(updated);
});

bookingSchema.pre('updateMany', async function () {
    const updated = syncProviderModelOnUpdate(this.getUpdate() || {});
    this.setUpdate(updated);
});

// Static method to get booking statistics for a user
bookingSchema.statics.getConsumerStats = async function (userId) {
    const stats = await this.aggregate([
        { $match: { consumer: new mongoose.Types.ObjectId(userId), isActive: true } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$pricing.totalAmount' }
            }
        }
    ]);

    const result = {
        total: 0,
        pending: 0,
        confirmed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        totalSpent: 0
    };

    stats.forEach(stat => {
        result.total += stat.count;
        result[stat._id] = stat.count;
        if (stat._id === 'completed') {
            result.totalSpent = stat.totalAmount;
        }
    });

    return result;
};

// Static method to get upcoming bookings
bookingSchema.statics.getUpcomingBookings = function (userId, limit = 5) {
    return this.find({
        consumer: userId,
        status: { $in: ['pending', 'confirmed', 'assigned'] },
        isActive: true
    })
        .populate('vehicle', 'brand model type plate image')
        .populate('provider.id', 'name phone rating photo')
        .sort({ 'schedule.date': 1, createdAt: 1 })
        .limit(limit);
};

// Static method to get booking history
bookingSchema.statics.getBookingHistory = function (userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return this.find({
        consumer: userId,
        status: { $in: ['completed', 'cancelled', 'refunded'] },
        isActive: true
    })
        .populate('vehicle', 'brand model type plate image')
        .populate('provider.id', 'name phone rating photo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
