const mongoose = require('mongoose');

const serviceConfigSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['point', 'hourly', 'full_day', 'outstation'],
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    hourlyRate: {
        type: Number,
        default: 0,
        min: 0
    },
    subscriberHourlyRate: {
        type: Number,
        default: 0,
        min: 0
    },
    includedHours: {
        type: Number,
        default: 0,
        min: 0
    },
    overtimeRate: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    icon: {
        type: String,
        default: 'car'
    },
    features: [{
        type: String
    }],
    vehicleMultipliers: {
        hatchback: { type: Number, default: 1.0 },
        sedan: { type: Number, default: 1.2 },
        suv: { type: Number, default: 1.5 },
        luxury: { type: Number, default: 2.0 }
    }
}, {
    timestamps: true
});

// Method to calculate base amount for service
serviceConfigSchema.methods.calculateBaseAmount = function(duration, vehicleType = 'hatchback', isSubscriber = false) {
    const multiplier = this.vehicleMultipliers[vehicleType] || 1.0;
    
    switch(this.type) {
        case 'point':
            // Point-to-point: Fixed base price
            return this.basePrice * multiplier;
            
        case 'hourly':
            // Hourly: Rate × Duration
            const rate = isSubscriber ? this.subscriberHourlyRate : this.hourlyRate;
            return rate * duration * multiplier;
            
        case 'full_day':
            // Full day: Fixed package price (8 hours)
            return this.basePrice * multiplier;
            
        case 'outstation':
            // Outstation: Base price per day
            const days = Math.ceil(duration / 24);
            return this.basePrice * days * multiplier;
            
        default:
            return this.basePrice * multiplier;
    }
};

// Method to calculate overtime
serviceConfigSchema.methods.calculateOvertime = function(duration, vehicleType = 'hatchback') {
    if (duration <= this.includedHours) {
        return 0;
    }
    
    const extraHours = duration - this.includedHours;
    const multiplier = this.vehicleMultipliers[vehicleType] || 1.0;
    return extraHours * this.overtimeRate * multiplier;
};

module.exports = mongoose.model('ServiceConfig', serviceConfigSchema);
