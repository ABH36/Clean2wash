const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['SERVICE', 'OFFER', 'BANNER', 'CONFIG', 'CATEGORY']
    },
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        default: 0
    },
    comparePrice: Number, // For discounts (e.g. Strike-through price)
    estimatedTime: {
        type: Number, // In minutes
        default: 30
    },
    iconUrl: String,
    bannerUrl: String,
    metadata: {
        type: mongoose.Schema.Types.Mixed, // For any extra dynamic keys needed by frontend
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

masterDataSchema.index({ type: 1, isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('MasterData', masterDataSchema);
