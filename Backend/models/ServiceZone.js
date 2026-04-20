const mongoose = require('mongoose');

/**
 * Service Zone Model - Rapido-style Geographic Service Area Management
 * 
 * Controls where the app is available and operational
 * Supports polygon-based zones with multiple features
 */

const serviceZoneSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    
    // Geographic Data
    geometry: {
        type: {
            type: String,
            enum: ['Polygon', 'MultiPolygon'],
            required: true,
            default: 'Polygon'
        },
        coordinates: {
            type: [[[Number]]], // Array of arrays of coordinate pairs [lng, lat]
            required: true
        }
    },
    
    // Center Point (for map display and calculations)
    center: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },
    
    // Zone Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance', 'coming_soon'],
        default: 'active',
        index: true
    },
    
    // Service Availability
    services: {
        spareDriver: {
            enabled: { type: Boolean, default: true },
            minDrivers: { type: Number, default: 5 },
            maxRadius: { type: Number, default: 15 } // km
        },
        carWash: {
            enabled: { type: Boolean, default: true },
            minCaptains: { type: Number, default: 3 }
        },
        apartmentWash: {
            enabled: { type: Boolean, default: true }
        }
    },
    
    // Operational Hours
    operationalHours: {
        enabled: { type: Boolean, default: false },
        schedule: [{
            day: {
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            },
            startTime: String, // "06:00"
            endTime: String,   // "23:00"
            is24Hours: { type: Boolean, default: false }
        }]
    },
    
    // Pricing Configuration
    pricing: {
        baseFareMultiplier: { type: Number, default: 1.0 },
        surgeEnabled: { type: Boolean, default: true },
        maxSurgeMultiplier: { type: Number, default: 3.0 }
    },
    
    // Zone Metadata
    metadata: {
        city: String,
        state: String,
        country: { type: String, default: 'India' },
        population: Number,
        area: Number, // in sq km
        timezone: { type: String, default: 'Asia/Kolkata' }
    },
    
    // Boundaries & Restrictions
    restrictions: {
        minBookingAmount: { type: Number, default: 0 },
        maxBookingAmount: { type: Number, default: 10000 },
        requiresKYC: { type: Boolean, default: false },
        allowCashPayment: { type: Boolean, default: true }
    },
    
    // Priority & Display
    priority: {
        type: Number,
        default: 0,
        index: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    
    // Features
    features: {
        realTimeTracking: { type: Boolean, default: true },
        scheduledBookings: { type: Boolean, default: true },
        instantBookings: { type: Boolean, default: true },
        multipleStops: { type: Boolean, default: false }
    },
    
    // Admin Notes
    notes: String,
    
    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    
    // Statistics (cached)
    stats: {
        totalBookings: { type: Number, default: 0 },
        activeDrivers: { type: Number, default: 0 },
        activeCaptains: { type: Number, default: 0 },
        lastUpdated: Date
    }
}, {
    timestamps: true
});

// Indexes for geospatial queries
serviceZoneSchema.index({ geometry: '2dsphere' });
serviceZoneSchema.index({ center: '2dsphere' });
serviceZoneSchema.index({ status: 1, priority: -1 });

// Methods

/**
 * Check if a point is within this zone
 */
serviceZoneSchema.methods.containsPoint = function(longitude, latitude) {
    const point = {
        type: 'Point',
        coordinates: [longitude, latitude]
    };
    
    // This would need a geospatial query in practice
    // For now, return a placeholder
    return true;
};

/**
 * Check if zone is currently operational
 */
serviceZoneSchema.methods.isOperational = function() {
    if (this.status !== 'active') return false;
    
    if (!this.operationalHours.enabled) return true;
    
    const now = new Date();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const todaySchedule = this.operationalHours.schedule.find(s => s.day === dayName);
    if (!todaySchedule) return false;
    
    if (todaySchedule.is24Hours) return true;
    
    return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
};

/**
 * Check if a specific service is available in this zone
 */
serviceZoneSchema.methods.isServiceAvailable = function(serviceType) {
    if (this.status !== 'active') return false;
    if (!this.isOperational()) return false;
    
    const service = this.services[serviceType];
    return service && service.enabled;
};

/**
 * Get zone boundary as GeoJSON
 */
serviceZoneSchema.methods.toGeoJSON = function() {
    return {
        type: 'Feature',
        properties: {
            id: this._id,
            name: this.name,
            displayName: this.displayName,
            code: this.code,
            status: this.status
        },
        geometry: this.geometry
    };
};

// Static Methods

/**
 * Find zone containing a specific point
 */
serviceZoneSchema.statics.findZoneByPoint = async function(longitude, latitude) {
    return this.findOne({
        status: 'active',
        geometry: {
            $geoIntersects: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            }
        }
    });
};

/**
 * Find all active zones
 */
serviceZoneSchema.statics.findActiveZones = async function() {
    return this.find({ status: 'active' })
        .sort({ priority: -1, displayOrder: 1 })
        .select('-stats -createdBy -updatedBy');
};

/**
 * Find zones near a point
 */
serviceZoneSchema.statics.findNearbyZones = async function(longitude, latitude, maxDistance = 50000) {
    return this.find({
        status: 'active',
        center: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        }
    }).limit(10);
};

/**
 * Check service availability at location
 */
serviceZoneSchema.statics.checkServiceAvailability = async function(longitude, latitude, serviceType) {
    const zone = await this.findZoneByPoint(longitude, latitude);
    
    if (!zone) {
        return {
            available: false,
            reason: 'Service not available in this area',
            zone: null
        };
    }
    
    if (!zone.isOperational()) {
        return {
            available: false,
            reason: 'Service is currently not operational in this zone',
            zone: zone.toObject()
        };
    }
    
    if (!zone.isServiceAvailable(serviceType)) {
        return {
            available: false,
            reason: `${serviceType} service is not available in this zone`,
            zone: zone.toObject()
        };
    }
    
    return {
        available: true,
        zone: zone.toObject()
    };
};

const ServiceZone = mongoose.model('ServiceZone', serviceZoneSchema);

module.exports = ServiceZone;
