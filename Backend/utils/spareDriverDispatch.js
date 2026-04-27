const SpareDriver = require('../models/SpareDriver');
const { getIO } = require('../services/enhancedSocketService');
const { sendSpareDriverNotification } = require('./notificationService');

const REJECTION_STATUS = 'sparedriver_rejected';
const BROADCAST_STATUS = 'sparedriver_broadcast';
const EARTH_RADIUS_METERS = 6371000;

const getSafeIO = () => {
    try {
        return getIO();
    } catch (error) {
        return null;
    }
};

const normalizeId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toString === 'function') return value.toString();
    return String(value);
};

const readMetadataValue = (metadata, key) => {
    if (!metadata) return undefined;
    if (typeof metadata.get === 'function') return metadata.get(key);
    return metadata[key];
};

const appendBookingActivityLog = (booking, status, description, metadata = {}) => {
    booking.activityLog = booking.activityLog || [];
    booking.activityLog.push({
        status,
        description,
        metadata
    });
};

const getRejectedDriverIds = (booking) => (
    (booking.activityLog || [])
        .filter((entry) => entry.status === REJECTION_STATUS)
        .map((entry) => readMetadataValue(entry.metadata, 'driverId'))
        .filter(Boolean)
        .map(normalizeId)
);

const hasDriverRejectedBooking = (booking, driverId) => {
    const normalizedDriverId = normalizeId(driverId);
    return getRejectedDriverIds(booking).includes(normalizedDriverId);
};

const getBroadcastRadius = (booking, overrideRadius) => {
    if (overrideRadius) return overrideRadius;
    const priorBroadcasts = (booking.activityLog || []).filter((entry) => entry.status === BROADCAST_STATUS).length;
    return Math.min(15000, 7000 + (priorBroadcasts * 2000));
};

const hasValidLngLatArray = (coordinates) => (
    Array.isArray(coordinates)
    && coordinates.length === 2
    && Number.isFinite(Number(coordinates[0]))
    && Number.isFinite(Number(coordinates[1]))
    && Number(coordinates[0]) !== 0
    && Number(coordinates[1]) !== 0
);

const hasValidLatLngObject = (coordinates = {}) => (
    Number.isFinite(Number(coordinates?.lat))
    && Number.isFinite(Number(coordinates?.lng))
    && Number(coordinates.lat) !== 0
    && Number(coordinates.lng) !== 0
);

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceMeters = (fromLat, fromLng, toLat, toLng) => {
    const dLat = toRadians(toLat - fromLat);
    const dLng = toRadians(toLng - fromLng);
    const lat1 = toRadians(fromLat);
    const lat2 = toRadians(toLat);

    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLng / 2) ** 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
};

const getDriverSearchPoint = (driver = {}) => {
    if (hasValidLngLatArray(driver?.currentLocation?.coordinates)) {
        return {
            lat: Number(driver.currentLocation.coordinates[1]),
            lng: Number(driver.currentLocation.coordinates[0]),
            source: 'currentLocation'
        };
    }

    if (hasValidLatLngObject(driver?.address?.coordinates)) {
        return {
            lat: Number(driver.address.coordinates.lat),
            lng: Number(driver.address.coordinates.lng),
            source: 'address'
        };
    }

    return null;
};

const buildVehicleSnapshot = (booking, fallbackVehicle = {}) => {
    const populatedVehicle = booking.vehicle && typeof booking.vehicle === 'object' && !Array.isArray(booking.vehicle)
        ? booking.vehicle
        : {};

    return {
        brand: populatedVehicle.brand || fallbackVehicle.brand || '',
        model: populatedVehicle.model || fallbackVehicle.model || '',
        plate: populatedVehicle.plate || fallbackVehicle.plate || ''
    };
};

const buildBroadcastPayload = (booking, options = {}) => ({
    bookingId: booking._id,
    serviceName: options.serviceName || booking.service?.name || 'Spare Driver service',
    location: booking.location,
    vehicle: buildVehicleSnapshot(booking, options.vehicle),
    pricing: { total: booking.pricing?.totalAmount || 0 },
    bookingCode: booking.bookingId,
    timestamp: new Date()
});

const fetchNearbyDrivers = async (booking, excludeDriverIds = [], maxDistance = 7000) => {
    const normalizedExclusions = [...new Set(excludeDriverIds.map(normalizeId).filter(Boolean))];
    
    // Determine the service type required (e.g., 'outstation', 'hourly', 'sparedriver')
    const requiredServiceType = booking.service?.type || booking.serviceType || 'sparedriver';

    const query = {
        isOnline: true,
        status: { $in: ['ACTIVE', 'active'] },
        verificationStatus: { $in: ['APPROVED', 'approved'] },
        // ✅ FIXED: Kit payment can be 'completed' or 'verified' (both are valid)
        $or: [
            { kitStatus: 'COMPLETED' },
            { 'kit.paymentStatus': 'completed' },
            { 'kit.paymentStatus': 'verified' },
            { 'kit.paymentStatus': { $exists: false } }  // Allow drivers without kit requirement
        ],
        'dutyHours.status.canAcceptBookings': { $ne: false }  // Allow if field doesn't exist or is true
    };

    const zoneCode = String(booking?.zone?.code || '').trim().toUpperCase();

    if (normalizedExclusions.length > 0) {
        query._id = { $nin: normalizedExclusions };
    }

    const coordinates = booking?.location?.address?.coordinates;
    if (hasValidLatLngObject(coordinates)) {
        const targetLat = Number(coordinates.lat);
        const targetLng = Number(coordinates.lng);
        const nearSphereFilter = {
            currentLocation: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [targetLng, targetLat]
                    },
                    $maxDistance: maxDistance
                }
            }
        };

        const strictZoneQuery = zoneCode ? { ...query, 'currentLocation.zone': zoneCode, ...nearSphereFilter } : { ...query, ...nearSphereFilter };
        let drivers = await SpareDriver.find(strictZoneQuery).select('_id name allowedServices preferredServices currentLocation address status isOnline');

        // If zone pinning gives zero results, relax zone but keep geo-near.
        if (drivers.length === 0 && zoneCode) {
            drivers = await SpareDriver.find({ ...query, ...nearSphereFilter }).select('_id name allowedServices preferredServices currentLocation address status isOnline');
        }

        // Fallback for drivers without live GPS zone/point but with saved address coordinates.
        if (drivers.length === 0) {
            const fallbackZoneQuery = zoneCode
                ? {
                    ...query,
                    $or: [
                        { 'currentLocation.zone': zoneCode },
                        { 'currentLocation.zone': { $exists: false } },
                        { 'currentLocation.zone': null },
                        { 'currentLocation.zone': '' }
                    ]
                }
                : { ...query };

            const candidates = await SpareDriver.find(fallbackZoneQuery)
                .limit(300)
                .select('_id name allowedServices preferredServices currentLocation address status isOnline');

            drivers = candidates.filter((driver) => {
                const point = getDriverSearchPoint(driver);
                if (!point) return false;
                const distance = getDistanceMeters(targetLat, targetLng, point.lat, point.lng);
                return distance <= maxDistance;
            });
        }

        console.log(`📡 Broadcast Query Results: Found ${drivers.length} eligible drivers`);
        console.log(`📍 Search Location: ${coordinates.lat}, ${coordinates.lng}`);
        console.log(`📏 Search Radius: ${maxDistance}m`);
        console.log(`🗺️ Zone Code: ${zoneCode || 'none'}`);
        console.log('🔍 Query Conditions:', JSON.stringify(query, null, 2));

        return drivers.sort((a, b) => {
            const aPrefers = (a.preferredServices || []).includes(requiredServiceType);
            const bPrefers = (b.preferredServices || []).includes(requiredServiceType);
            if (aPrefers && !bPrefers) return -1;
            if (!aPrefers && bPrefers) return 1;

            const aPoint = getDriverSearchPoint(a);
            const bPoint = getDriverSearchPoint(b);
            const aDistance = aPoint ? getDistanceMeters(targetLat, targetLng, aPoint.lat, aPoint.lng) : Number.MAX_SAFE_INTEGER;
            const bDistance = bPoint ? getDistanceMeters(targetLat, targetLng, bPoint.lat, bPoint.lng) : Number.MAX_SAFE_INTEGER;
            return aDistance - bDistance;
        });
    }

    // Fallback: No coordinates, just find nearby active drivers
    const drivers = await SpareDriver.find(query)
        .sort({ updatedAt: -1 })
        .limit(20)
        .select('_id name allowedServices preferredServices currentLocation status isOnline');
    
    console.log(`📡 Fallback Query: Found ${drivers.length} drivers (no location filter)`);
    
    return drivers;
};

const broadcastBookingToDrivers = async (booking, options = {}) => {
    const excludedDriverIds = [
        ...getRejectedDriverIds(booking),
        ...(options.excludeDriverIds || []).map(normalizeId)
    ];
    const uniqueExcludedDriverIds = [...new Set(excludedDriverIds.filter(Boolean))];
    const radiusMeters = getBroadcastRadius(booking, options.maxDistance);
    const drivers = await fetchNearbyDrivers(booking, uniqueExcludedDriverIds, radiusMeters);
    const payload = buildBroadcastPayload(booking, options);
    const io = getSafeIO();

    for (const driver of drivers) {
        if (io) {
            io.to(driver._id.toString()).emit('new_booking_broadcast', payload);
        }

        await sendSpareDriverNotification(driver._id, {
            title: options.notificationTitle || 'New Chauffeur Booking',
            message: options.notificationMessage || `${payload.serviceName} is available near your location.`,
            type: 'booking',
            priority: 'high',
            actionUrl: '/spare-driver/bookings',
            actionText: 'Open Jobs',
            metaData: {
                bookingId: booking._id.toString(),
                serviceName: payload.serviceName,
                vehicle: `${payload.vehicle.brand || ''} ${payload.vehicle.model || ''}`.trim(),
                reason: options.reason || 'booking_created'
            }
        });
    }

    appendBookingActivityLog(
        booking,
        BROADCAST_STATUS,
        drivers.length > 0
            ? `Broadcast shared with ${drivers.length} spare drivers.`
            : 'Broadcast attempted but no eligible spare drivers were found.',
        {
            driverCount: drivers.length,
            radiusMeters,
            excludedDriverIds: uniqueExcludedDriverIds,
            reason: options.reason || 'booking_created'
        }
    );

    if (options.persist !== false) {
        await booking.save({ validateBeforeSave: false });
    }

    return {
        driverCount: drivers.length,
        radiusMeters,
        excludedDriverIds: uniqueExcludedDriverIds,
        driverIds: drivers.map((driver) => driver._id.toString())
    };
};

module.exports = {
    appendBookingActivityLog,
    broadcastBookingToDrivers,
    getRejectedDriverIds,
    hasDriverRejectedBooking
};
