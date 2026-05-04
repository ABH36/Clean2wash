const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Campaign name is required'],
        trim: true
    },
    platform: {
        type: String,
        enum: ['Instagram', 'Facebook', 'Twitter', 'Google', 'Other'],
        default: 'Instagram'
    },
    status: {
        type: String,
        enum: ['Active', 'Paused', 'Completed', 'Draft'],
        default: 'Draft'
    },
    budget: {
        amount: Number,
        currency: { type: String, default: 'INR' }
    },
    metrics: {
        clicks: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        spend: { type: Number, default: 0 }
    },
    startDate: Date,
    endDate: Date,
    trackingUrl: String,
    metadata: {
        type: Map,
        of: String
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for ROI
campaignSchema.virtual('ctr').get(function() {
    if (!this.metrics.impressions) return 0;
    return ((this.metrics.clicks / this.metrics.impressions) * 100).toFixed(2);
});

module.exports = mongoose.model('Campaign', campaignSchema);
