const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const PricingEngine = require('../../../services/pricingEngine');

/**
 * Calculate Spare Driver Service Pricing
 * Provides real-time fare estimation before booking
 */
exports.calculateSpareDriverPricing = catchAsync(async (req, res, next) => {
    const {
        serviceType,
        duration,
        vehicleType,
        isScheduled,
        scheduledTime,
        destination
    } = req.body;

    // Validate required fields
    if (!serviceType) {
        return next(new AppError('Service type is required', 400));
    }

    // Normalize service type
    const normalizedServiceType = serviceType.toLowerCase().replace(/[_\s-]+/g, '_');
    
    // Validate service type
    const validServiceTypes = ['point', 'hourly', 'full', 'full_day', 'outstation'];
    if (!validServiceTypes.includes(normalizedServiceType)) {
        return next(new AppError(`Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`, 400));
    }

    // Parse duration
    let durationHours = 4; // Default
    if (duration) {
        if (typeof duration === 'string') {
            // Parse "4 Hours" or "4" to number
            const match = duration.match(/(\d+(\.\d+)?)/);
            if (match) {
                durationHours = parseFloat(match[1]);
            }
        } else if (typeof duration === 'number') {
            durationHours = duration;
        }
    }

    // Set default duration based on service type if not provided
    if (!duration) {
        switch (normalizedServiceType) {
            case 'point':
                durationHours = 1;
                break;
            case 'hourly':
                durationHours = 4;
                break;
            case 'full':
            case 'full_day':
                durationHours = 8;
                break;
            case 'outstation':
                durationHours = 24;
                break;
        }
    }

    try {
        // Calculate pricing using pricing engine
        const pricing = await PricingEngine.calculatePrice({
            serviceType: normalizedServiceType,
            duration: durationHours,
            vehicleType: vehicleType || 'hatchback',
            isScheduled: isScheduled === true || isScheduled === 'true',
            isSubscriber: req.user?.subscription?.status === 'active' || false,
            scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
            destination
        });

        res.status(200).json({
            status: 'success',
            data: {
                pricing: {
                    ...pricing,
                    // Add user-friendly fields
                    currency: 'INR',
                    estimatedDuration: `${durationHours} Hours`,
                    serviceType: normalizedServiceType
                }
            }
        });
    } catch (error) {
        console.error('[PricingController] Calculation error:', error);
        return next(new AppError(error.message || 'Failed to calculate pricing', 400));
    }
});

/**
 * Get Pricing Breakdown
 * Returns detailed breakdown of pricing components
 */
exports.getPricingBreakdown = catchAsync(async (req, res, next) => {
    const { serviceType } = req.query;

    if (!serviceType) {
        return next(new AppError('Service type is required', 400));
    }

    const ServiceConfig = require('../../../models/ServiceConfig');
    const PricingConfig = require('../../../models/PricingConfig');

    // Get service configuration
    const serviceConfig = await ServiceConfig.findOne({ 
        type: serviceType.toLowerCase(), 
        isActive: true 
    });

    if (!serviceConfig) {
        return next(new AppError('Service configuration not found', 404));
    }

    // Get pricing configuration
    const pricingConfig = await PricingConfig.getSingleton();

    res.status(200).json({
        status: 'success',
        data: {
            service: {
                type: serviceConfig.type,
                name: serviceConfig.name,
                basePrice: serviceConfig.basePrice,
                minDuration: serviceConfig.minDuration,
                maxDuration: serviceConfig.maxDuration,
                pricePerHour: serviceConfig.pricePerHour
            },
            vehicleMultipliers: pricingConfig.vehicleMultipliers,
            surgeRules: {
                nightSurge: pricingConfig.nightSurge,
                peakHourSurge: pricingConfig.peakHourSurge
            },
            discounts: {
                scheduledDiscount: pricingConfig.scheduledDiscount,
                subscriberDiscount: pricingConfig.subscriberDiscount
            },
            gstRate: pricingConfig.gstRate
        }
    });
});

/**
 * Get Spare Driver Service Types from ServiceConfig
 * Returns admin-configured service types for consumer booking
 */
exports.getSpareDriverServiceTypes = catchAsync(async (req, res, next) => {
    const ServiceConfig = require('../../../models/ServiceConfig');
    
    // Fetch all active service configurations
    const serviceConfigs = await ServiceConfig.find({ isActive: true }).sort({ type: 1 });
    
    // Map to consumer-friendly format
    const services = serviceConfigs.map(config => ({
        id: config.type,
        key: config.type,
        kind: config.type,
        title: config.name,
        subtitle: config.description,
        basePrice: config.basePrice,
        hourlyRate: config.hourlyRate,
        subscriberHourlyRate: config.subscriberHourlyRate,
        includedHours: config.includedHours,
        overtimeRate: config.overtimeRate,
        features: config.features || [],
        vehicleMultipliers: config.vehicleMultipliers,
        icon: config.icon,
        isActive: config.isActive,
        metadata: {
            id: config.type,
            category: 'Chauffeur',
            provider: 'sparedriver',
            type: config.type
        }
    }));
    
    res.status(200).json({
        status: 'success',
        results: services.length,
        data: {
            services
        }
    });
});

module.exports = exports;

