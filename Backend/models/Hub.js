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
        type: String,
        trim: true,
        default: ''
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
        default: {}
    }
}, {
    timestamps: true
});

hubSchema.index({ city: 1, type: 1, isActive: 1 });
hubSchema.index({ name: 1 });

const Hub = mongoose.model('Hub', hubSchema);

module.exports = Hub;
