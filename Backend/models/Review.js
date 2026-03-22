const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    },
    // Dynamic Reference to the Transaction (Booking or ProductOrder)
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Review must be linked to a transaction'],
        refPath: 'refModel'
    },
    refModel: {
        type: String,
        required: [true, 'Reference model is required'],
        enum: ['ProductOrder', 'Booking']
    },
    // Dynamic Reference to the Entity being reviewed (Product or AdminService)
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Target entity is required'],
        refPath: 'targetModel'
    },
    targetModel: {
        type: String,
        required: [true, 'Target model is required'],
        enum: ['Product', 'AdminService']
    },
    // Optional Provider Reference (Captain or Vendor)
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'providerModel'
    },
    providerModel: {
        type: String,
        enum: ['Captain', 'User']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please provide a rating between 1 and 5']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    images: [String],
    isVerifiedPurchase: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Prevent duplicate reviews from the same user for the same transaction+target
reviewSchema.index({ user: 1, refId: 1, targetId: 1 }, { unique: true });

// Optimize real-time target rating calculations
reviewSchema.index({ targetId: 1, rating: 1 });

// Static method to calculate average ratings
reviewSchema.statics.calcAverageRatings = async function (targetId, targetModel) {
    const stats = await this.aggregate([
        { $match: { targetId: new mongoose.Types.ObjectId(targetId) } },
        {
            $group: {
                _id: '$targetId',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model(targetModel).findByIdAndUpdate(targetId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].nRating,
            rating: stats[0].avgRating // For providers
        });
    } else {
        await mongoose.model(targetModel).findByIdAndUpdate(targetId, {
            ratingsAverage: 0,
            ratingsQuantity: 0,
            rating: 5 // Default for providers
        });
    }
};

// Update target ratings after save
reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.targetId, this.targetModel);
    if (this.providerId && this.providerModel) {
        this.constructor.calcAverageRatings(this.providerId, this.providerModel);
    }
});

// Update target ratings after findOneAndUpdate/Delete
reviewSchema.post(/^findOneAnd/, async function (doc) {
    if (doc) {
        await doc.constructor.calcAverageRatings(doc.targetId, doc.targetModel);
        if (doc.providerId && doc.providerModel) {
            await doc.constructor.calcAverageRatings(doc.providerId, doc.providerModel);
        }
    }
});

module.exports = mongoose.model('Review', reviewSchema);
