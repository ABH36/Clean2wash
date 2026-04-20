const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
    consumer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true // [longitude, latitude]
        },
        address: String
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'cancelled'],
        default: 'active'
    },
    description: String,
    photo: String,
    responders: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['captain', 'vendor', 'admin']
        },
        status: {
            type: String,
            enum: ['responding', 'arrived', 'completed'],
            default: 'responding'
        },
        respondedAt: {
            type: Date,
            default: Date.now
        }
    }],
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

sosAlertSchema.index({ location: '2dsphere' });
sosAlertSchema.index({ status: 1 });

const SOSAlert = mongoose.model('SOSAlert', sosAlertSchema);
module.exports = SOSAlert;
