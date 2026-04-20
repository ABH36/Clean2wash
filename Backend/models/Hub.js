/**
 * APARTMENT WASH / HUB MODEL
 * Manages Apartment Hubs for subscription-based cleaning.
 * (Not associated with the Chauffeur/Spare Driver flow)
 */
const mongoose = require('mongoose');

const hubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A hub must have a name'],
        trim: true,
        unique: true
    },
    city: {
        type: String,
        required: [true, 'A hub must belong to a city'],
        trim: true
    },
    location: {
        address: { type: String, trim: true, default: '' },
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [77.1025, 28.7041] } // [lng, lat] - Default to Delhi for new seeds
        }
    },
    type: {
        type: String,
        enum: ['Studio', 'Hub', 'Node'],
        default: 'Studio'
    },
    status: {
        type: String,
        enum: ['Online', 'Offline'],
        default: 'Online'
    },
    manager: {
        type: String,
        required: [true, 'A hub must have a lead manager']
    },
    captains: {
        type: Number,
        default: 0
    },
    efficiency: {
        type: String,
        default: '0%'
    },
    load: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Peak'],
        default: 'Moderate'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    iconUrl: {
        type: String,
        trim: true,
        default: ''
    },
    serviceTags: [{
        type: String,
        trim: true
    }],
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            isSociety: false,
            blocks: [], // ['Block A', 'Block B', ...]
            parkingLevels: [], // ['B1', 'B2', 'Ground']
            pillarRange: { min: 1, max: 100 }
        }
    }
}, {
    timestamps: true
});

hubSchema.index({ city: 1, type: 1, isActive: 1 });
hubSchema.index({ 'location.coordinates': '2dsphere' });

const Hub = mongoose.model('Hub', hubSchema);

module.exports = Hub;
