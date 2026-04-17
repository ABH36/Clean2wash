const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
    // GST Configuration
    gstPercent: {
        type: Number,
        required: true,
        default: 18,
        min: 0,
        max: 100
    },
    isGstEnabled: {
        type: Boolean,
        default: true
    },
    
    // Platform Commission
    platformCommissionPercent: {
        type: Number,
        required: true,
        default: 20,
        min: 0,
        max: 100
    },
    
    // Surge Pricing
    surgeMultiplier: {
        type: Number,
        default: 1.5,
        min: 1.0,
        max: 3.0
    },
    isSurgeEnabled: {
        type: Boolean,
        default: false
    },
    surgePeakHours: [{
        start: String, // "08:00"
        end: String    // "10:00"
    }],
    
    // Night Charges
    nightCharge: {
        type: Number,
        default: 300,
        min: 0
    },
    isNightEnabled: {
        type: Boolean,
        default: true
    },
    nightHours: {
        start: {
            type: String,
            default: '23:00'
        },
        end: {
            type: String,
            default: '05:00'
        }
    },
    
    // Scheduled Booking Premium
    scheduledPremium: {
        type: Number,
        default: 100,
        min: 0
    },
    isScheduledPremiumEnabled: {
        type: Boolean,
        default: true
    },
    
    // Outstation Allowance
    outstationAllowance: {
        type: Number,
        default: 500,
        min: 0
    },
    
    // Cancellation Charges
    cancellation: {
        customer: {
            beforeTrip: {
                type: Number,
                default: 50,
                min: 0
            },
            afterTripStart: {
                type: Number,
                default: 100,
                min: 0
            }
        },
        driver: {
            beforeTrip: {
                type: Number,
                default: 100,
                min: 0
            },
            afterTripStart: {
                type: Number,
                default: 200,
                min: 0
            },
            noShow: {
                type: Number,
                default: 300,
                min: 0
            }
        }
    },
    
    // Wallet Hold
    walletHoldAmount: {
        type: Number,
        default: 500,
        min: 0
    },
    
    // Active status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Singleton pattern - only one pricing config should exist
pricingConfigSchema.statics.getSingleton = async function() {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
    }
    return config;
};

// Method to check if current time is in surge hours
pricingConfigSchema.methods.isInSurgeHours = function() {
    if (!this.isSurgeEnabled || !this.surgePeakHours.length) {
        return false;
    }
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    return this.surgePeakHours.some(period => {
        return currentTime >= period.start && currentTime <= period.end;
    });
};

// Method to check if current time is in night hours
pricingConfigSchema.methods.isInNightHours = function() {
    if (!this.isNightEnabled) {
        return false;
    }
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Handle overnight periods (e.g., 23:00 to 05:00)
    if (this.nightHours.start > this.nightHours.end) {
        return currentTime >= this.nightHours.start || currentTime <= this.nightHours.end;
    }
    
    return currentTime >= this.nightHours.start && currentTime <= this.nightHours.end;
};

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);
