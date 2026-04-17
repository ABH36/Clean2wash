const SpareDriver = require('../models/SpareDriver');
const { getIO } = require('../socketService');
const { sendSpareDriverNotification } = require('./notificationService');

const REJECTION_STATUS = 'sparedriver_rejected';
const BROADCAST_STATUS = 'sparedriver_broadcast';

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
    const query = {
        isOnline: true,
        status: 'ACTIVE',
        verificationStatus: 'APPROVED',
        'kit.paymentStatus': 'verified',  // ✅ Kit validation
        'dutyHours.status.canAcceptBookings': true  // ✅ Duty hours check
    };

    if (normalizedExclusions.length > 0) {
        query._id = {
            $nin: normalizedExclusions
        };
    }

    const coordinates = booking.location?.address?.coordinates;
    if (coordinates?.lat && coordinates?.lng) {
        query.currentLocation = {
            $nearSphere: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(coordinates.lng), parseFloat(coordinates.lat)]
                },
                $maxDistance: maxDistance
            }
        };

        return SpareDriver.find(query).select('_id name allowedServices');
    }

    return SpareDriver.find(query)
        .sort({ updatedAt: -1 })
        .limit(20)
        .select('_id name allowedServices');
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
