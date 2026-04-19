const mongoose = require('mongoose');

/**
 * 🚀 SURGE PRICING RULE MODEL
 * Rapido/Uber-style dynamic pricing based on:
 * - Time of day (peak hours)
 * - Location/Area (high demand zones)
 * - Day of week (weekends)
 * - Weather conditions (optional)
 * - Special events (optional)
 */

const surgePricingRuleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Rule name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    
    // Rule Type
    type: {
        type: String,
        enum: ['time_based', 'location_based', 'demand_based', 'event_based', 'weather_based'],
        required: true
    },
    
    // Surge Multiplier (e.g., 1.5x, 2.0x)
    multiplier: {
        type: Number,
        required: [true, 'Multiplier is required'],
        min: [1.0, 'Multiplier must be at least 1.0'],
        max: [5.0, 'Multiplier cannot exceed 5.0'],
        default: 1.0
    },
    
    // Fixed Amount (alternative to multiplier)
    fixedAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    
    // Time-Based Rules
    timeRules: {
        // Days of week (0 = Sunday, 6 = Saturday)
        daysOfWeek: {
            type: [Number],
            default: [0, 1, 2, 3, 4, 5, 6] // All days
        },
        // Time slots (24-hour format)
        timeSlots: [{
            startTime: {
                type: String, // "HH:MM" format
                required: true
            },
            endTime: {
                type: String, // "HH:MM" format
                required: true
            }
        }],
        // Specific dates (for events)
        specificDates: [{
            date: Date,
            label: String // e.g., "New Year", "Diwali"
        }]
    },
    
    // Location-Based Rules
    locationRules: {
        // Geofence areas
        areas: [{
            name: {
                type: String,
                required: true
            },
            // Polygon coordinates
            coordinates: [{
                lat: Number,
                lng: Number
            }],
            // Or radius-based
            center: {
                lat: Number,
                lng: Number
            },
            radiusKm: {
                type: Number,
                min: 0
            }
        }],
        // City-wide rules
        cities: [{
            type: String,
            trim: true
        }],
        // Pincode-based
        pincodes: [{
            type: String,
            trim: true
        }]
    },
    
    // Demand-Based Rules (Real-time)
    demandRules: {
        enabled: {
            type: Boolean,
            default: false
        },
        // Trigger when active bookings exceed threshold
        activeBookingsThreshold: {
            type: Number,
            min: 0
        },
        // Trigger when driver availability is low
        driverAvailabilityThreshold: {
            type: Number,
            min: 0,
            max: 100 // Percentage
        }
    },
    
    // Service-Specific Rules
    applicableServices: [{
        type: String,
        enum: ['point', 'hourly', 'full_day', 'outstation', 'all'],
        default: 'all'
    }],
    
    // Vehicle-Specific Rules
    applicableVehicles: [{
        type: String,
        enum: ['hatchback', 'sedan', 'suv', 'luxury', 'all'],
        default: 'all'
    }],
    
    // Priority (higher priority rules apply first)
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Validity Period
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date
    },
    
    // Usage Statistics
    stats: {
        timesApplied: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        },
        lastApplied: Date
    },
    
    // Display Settings
    display: {
        showToUser: {
            type: Boolean,
            default: true
        },
        userMessage: {
            type: String,
            default: 'High demand in your area'
        },
        badgeColor: {
            type: String,
            default: '#FF9900'
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
surgePricingRuleSchema.index({ isActive: 1, priority: -1 });
surgePricingRuleSchema.index({ type: 1, isActive: 1 });
surgePricingRuleSchema.index({ 'timeRules.daysOfWeek': 1 });
surgePricingRuleSchema.index({ 'locationRules.cities': 1 });
surgePricingRuleSchema.index({ 'locationRules.pincodes': 1 });

/**
 * Check if rule is currently valid
 */
surgePricingRuleSchema.methods.isCurrentlyValid = function() {
    const now = new Date();
    
    if (!this.isActive) return false;
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validUntil && now > this.validUntil) return false;
    
    return true;
};

/**
 * Check if rule applies to given time
 */
surgePricingRuleSchema.methods.appliesToTime = function(dateTime = new Date()) {
    if (!this.timeRules || this.timeRules.timeSlots.length === 0) return true;
    
    const dayOfWeek = dateTime.getDay();
    const currentTime = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
    
    // Check day of week
    if (!this.timeRules.daysOfWeek.includes(dayOfWeek)) return false;
    
    // Check time slots
    return this.timeRules.timeSlots.some(slot => {
        return currentTime >= slot.startTime && currentTime <= slot.endTime;
    });
};

/**
 * Check if rule applies to given location
 */
surgePricingRuleSchema.methods.appliesToLocation = function(location = {}) {
    if (!this.locationRules) return true;
    
    const { lat, lng, city, pincode } = location;
    
    // Check city
    if (this.locationRules.cities && this.locationRules.cities.length > 0) {
        if (city && this.locationRules.cities.includes(city)) return true;
    }
    
    // Check pincode
    if (this.locationRules.pincodes && this.locationRules.pincodes.length > 0) {
        if (pincode && this.locationRules.pincodes.includes(pincode)) return true;
    }
    
    // Check geofence areas
    if (this.locationRules.areas && this.locationRules.areas.length > 0 && lat && lng) {
        for (const area of this.locationRules.areas) {
            // Radius-based check
            if (area.center && area.radiusKm) {
                const distance = calculateDistance(
                    lat, lng,
                    area.center.lat, area.center.lng
                );
                if (distance <= area.radiusKm) return true;
            }
            
            // Polygon-based check (simplified)
            if (area.coordinates && area.coordinates.length > 0) {
                if (isPointInPolygon({ lat, lng }, area.coordinates)) return true;
            }
        }
    }
    
    return false;
};

/**
 * Check if rule applies to given service
 */
surgePricingRuleSchema.methods.appliesToService = function(serviceType) {
    if (!this.applicableServices || this.applicableServices.length === 0) return true;
    if (this.applicableServices.includes('all')) return true;
    return this.applicableServices.includes(serviceType);
};

/**
 * Check if rule applies to given vehicle
 */
surgePricingRuleSchema.methods.appliesToVehicle = function(vehicleType) {
    if (!this.applicableVehicles || this.applicableVehicles.length === 0) return true;
    if (this.applicableVehicles.includes('all')) return true;
    return this.applicableVehicles.includes(vehicleType);
};

/**
 * Calculate surge amount
 */
surgePricingRuleSchema.methods.calculateSurge = function(baseAmount) {
    if (this.fixedAmount > 0) {
        return {
            surgeAmount: this.fixedAmount,
            surgeType: 'fixed',
            multiplier: 1.0
        };
    }
    
    const surgeAmount = Math.round(baseAmount * (this.multiplier - 1));
    return {
        surgeAmount,
        surgeType: 'multiplier',
        multiplier: this.multiplier
    };
};

/**
 * Record usage
 */
surgePricingRuleSchema.methods.recordUsage = async function(revenueAmount = 0) {
    this.stats.timesApplied += 1;
    this.stats.totalRevenue += revenueAmount;
    this.stats.lastApplied = new Date();
    await this.save();
};

/**
 * Static method: Find applicable rules
 */
surgePricingRuleSchema.statics.findApplicableRules = async function(criteria = {}) {
    const {
        dateTime = new Date(),
        location = {},
        serviceType = 'all',
        vehicleType = 'all'
    } = criteria;
    
    // Get all active rules sorted by priority
    const rules = await this.find({
        isActive: true,
        validFrom: { $lte: dateTime },
        $or: [
            { validUntil: { $exists: false } },
            { validUntil: { $gte: dateTime } }
        ]
    }).sort({ priority: -1 });
    
    // Filter rules that apply to current context
    const applicableRules = rules.filter(rule => {
        if (!rule.appliesToTime(dateTime)) return false;
        if (!rule.appliesToLocation(location)) return false;
        if (!rule.appliesToService(serviceType)) return false;
        if (!rule.appliesToVehicle(vehicleType)) return false;
        return true;
    });
    
    return applicableRules;
};

/**
 * Static method: Calculate total surge
 */
surgePricingRuleSchema.statics.calculateTotalSurge = async function(baseAmount, criteria = {}) {
    const applicableRules = await this.findApplicableRules(criteria);
    
    if (applicableRules.length === 0) {
        return {
            surgeAmount: 0,
            totalMultiplier: 1.0,
            appliedRules: []
        };
    }
    
    // Apply highest priority rule (or combine multiple rules)
    const primaryRule = applicableRules[0];
    const surge = primaryRule.calculateSurge(baseAmount);
    
    return {
        surgeAmount: surge.surgeAmount,
        totalMultiplier: surge.multiplier,
        appliedRules: [{
            ruleId: primaryRule._id,
            name: primaryRule.name,
            type: primaryRule.type,
            multiplier: surge.multiplier,
            amount: surge.surgeAmount,
            message: primaryRule.display.userMessage
        }]
    };
};

// Helper functions
function calculateDistance(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;
        
        const intersect = ((yi > point.lat) !== (yj > point.lat))
            && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

const SurgePricingRule = mongoose.model('SurgePricingRule', surgePricingRuleSchema);

module.exports = SurgePricingRule;
