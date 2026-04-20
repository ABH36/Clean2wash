const ServiceZone = require('../models/ServiceZone');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * Zone Controller - Rapido-style Service Zone Management
 */

/**
 * Get all service zones
 */
exports.getAllZones = catchAsync(async (req, res) => {
    const { status, service } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const zones = await ServiceZone.find(filter)
        .sort({ priority: -1, displayOrder: 1 })
        .select('-__v');
    
    // Filter by service if specified
    let filteredZones = zones;
    if (service) {
        filteredZones = zones.filter(zone => zone.isServiceAvailable(service));
    }
    
    res.status(200).json({
        status: 'success',
        results: filteredZones.length,
        data: { zones: filteredZones }
    });
});

/**
 * Get single zone by ID
 */
exports.getZone = catchAsync(async (req, res, next) => {
    const zone = await ServiceZone.findById(req.params.id);
    
    if (!zone) {
        return next(new AppError('Zone not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { zone }
    });
});

/**
 * Create new service zone
 */
exports.createZone = catchAsync(async (req, res, next) => {
    const zoneData = {
        ...req.body,
        createdBy: req.user.id
    };
    
    const zone = await ServiceZone.create(zoneData);
    
    res.status(201).json({
        status: 'success',
        data: { zone }
    });
});

/**
 * Update service zone
 */
exports.updateZone = catchAsync(async (req, res, next) => {
    const updateData = {
        ...req.body,
        updatedBy: req.user.id
    };
    
    const zone = await ServiceZone.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );
    
    if (!zone) {
        return next(new AppError('Zone not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { zone }
    });
});

/**
 * Delete service zone
 */
exports.deleteZone = catchAsync(async (req, res, next) => {
    const zone = await ServiceZone.findByIdAndDelete(req.params.id);
    
    if (!zone) {
        return next(new AppError('Zone not found', 404));
    }
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * Check if location is within service area
 */
exports.checkLocation = catchAsync(async (req, res, next) => {
    const { latitude, longitude, service } = req.query;
    
    if (!latitude || !longitude) {
        return next(new AppError('Please provide latitude and longitude', 400));
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
        return next(new AppError('Invalid coordinates', 400));
    }
    
    const result = await ServiceZone.checkServiceAvailability(lng, lat, service || 'spareDriver');
    
    res.status(200).json({
        status: 'success',
        data: result
    });
});

/**
 * Get zones near a location
 */
exports.getNearbyZones = catchAsync(async (req, res, next) => {
    const { latitude, longitude, maxDistance } = req.query;
    
    if (!latitude || !longitude) {
        return next(new AppError('Please provide latitude and longitude', 400));
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const distance = maxDistance ? parseInt(maxDistance) : 50000;
    
    const zones = await ServiceZone.findNearbyZones(lng, lat, distance);
    
    res.status(200).json({
        status: 'success',
        results: zones.length,
        data: { zones }
    });
});

/**
 * Get zone by code
 */
exports.getZoneByCode = catchAsync(async (req, res, next) => {
    const zone = await ServiceZone.findOne({ code: req.params.code.toUpperCase() });
    
    if (!zone) {
        return next(new AppError('Zone not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { zone }
    });
});

/**
 * Get all zones as GeoJSON
 */
exports.getZonesGeoJSON = catchAsync(async (req, res) => {
    const zones = await ServiceZone.find({ status: 'active' });
    
    const geoJSON = {
        type: 'FeatureCollection',
        features: zones.map(zone => zone.toGeoJSON())
    };
    
    res.status(200).json({
        status: 'success',
        data: geoJSON
    });
});

/**
 * Update zone status
 */
exports.updateZoneStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    
    if (!['active', 'inactive', 'maintenance', 'coming_soon'].includes(status)) {
        return next(new AppError('Invalid status', 400));
    }
    
    const zone = await ServiceZone.findByIdAndUpdate(
        req.params.id,
        { status, updatedBy: req.user.id },
        { new: true }
    );
    
    if (!zone) {
        return next(new AppError('Zone not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { zone }
    });
});

/**
 * Update zone services
 */
exports.updateZoneServices = catchAsync(async (req, res, next) => {
    const { services } = req.body;
    
    const zone = await ServiceZone.findByIdAndUpdate(
        req.params.id,
        { services, updatedBy: req.user.id },
        { new: true }
    );
    
    if (!zone) {
        return next(new AppError('Zone not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { zone }
    });
});

/**
 * Get zone statistics
 */
exports.getZoneStats = catchAsync(async (req, res, next) => {
    const zone = await ServiceZone.findById(req.params.id);
    
    if (!zone) {
        return next(new AppError('Zone not found', 404));
    }
    
    // In production, calculate real stats from bookings, drivers, etc.
    const stats = {
        zone: {
            id: zone._id,
            name: zone.name,
            code: zone.code
        },
        bookings: {
            total: zone.stats.totalBookings || 0,
            today: 0, // Calculate from Booking model
            thisWeek: 0,
            thisMonth: 0
        },
        drivers: {
            total: zone.stats.activeDrivers || 0,
            online: 0, // Calculate from SpareDriver model
            busy: 0
        },
        revenue: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0
        }
    };
    
    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});

/**
 * Bulk update zones
 */
exports.bulkUpdateZones = catchAsync(async (req, res, next) => {
    const { zoneIds, updates } = req.body;
    
    if (!zoneIds || !Array.isArray(zoneIds) || zoneIds.length === 0) {
        return next(new AppError('Please provide zone IDs', 400));
    }
    
    const result = await ServiceZone.updateMany(
        { _id: { $in: zoneIds } },
        { ...updates, updatedBy: req.user.id }
    );
    
    res.status(200).json({
        status: 'success',
        data: {
            modifiedCount: result.modifiedCount
        }
    });
});

module.exports = exports;
