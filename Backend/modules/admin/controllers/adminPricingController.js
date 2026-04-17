const PricingConfig = require('../../../models/PricingConfig');
const pricingEngine = require('../../../services/pricingEngine');
const catchAsync = require('../../../utils/catchAsync');

// Get pricing configuration
exports.getPricingConfig = catchAsync(async (req, res) => {
    const config = await PricingConfig.getSingleton();
    
    res.status(200).json({
        status: 'success',
        data: {
            config
        }
    });
});

// Update pricing configuration
exports.updatePricingConfig = catchAsync(async (req, res) => {
    const allowedFields = [
        'gstPercent',
        'isGstEnabled',
        'platformCommissionPercent',
        'surgeMultiplier',
        'isSurgeEnabled',
        'surgePeakHours',
        'nightCharge',
        'isNightEnabled',
        'nightHours',
        'scheduledPremium',
        'isScheduledPremiumEnabled',
        'outstationAllowance',
        'cancellation',
        'walletHoldAmount'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updates[key] = req.body[key];
        }
    });
    
    const config = await PricingConfig.getSingleton();
    Object.assign(config, updates);
    await config.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Pricing configuration updated successfully',
        data: {
            config
        }
    });
});

// Calculate price (preview)
exports.calculatePrice = catchAsync(async (req, res) => {
    const {
        serviceType,
        duration,
        vehicleType,
        isScheduled,
        isSubscriber,
        scheduledTime,
        destination
    } = req.body;
    
    // Validate
    const validation = pricingEngine.validateParams(req.body);
    if (!validation.isValid) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: validation.errors
        });
    }
    
    // Calculate
    const pricing = await pricingEngine.calculatePrice({
        serviceType,
        duration: parseFloat(duration),
        vehicleType: vehicleType || 'hatchback',
        isScheduled: isScheduled === true || isScheduled === 'true',
        isSubscriber: isSubscriber === true || isSubscriber === 'true',
        scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
        destination
    });
    
    res.status(200).json({
        status: 'success',
        data: {
            pricing
        }
    });
});

// Get cancellation charges
exports.getCancellationCharges = catchAsync(async (req, res) => {
    const config = await PricingConfig.getSingleton();
    
    res.status(200).json({
        status: 'success',
        data: {
            cancellation: config.cancellation
        }
    });
});

// Update cancellation charges
exports.updateCancellationCharges = catchAsync(async (req, res) => {
    const config = await PricingConfig.getSingleton();
    
    if (req.body.cancellation) {
        config.cancellation = req.body.cancellation;
        await config.save();
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Cancellation charges updated successfully',
        data: {
            cancellation: config.cancellation
        }
    });
});

// Toggle surge pricing
exports.toggleSurge = catchAsync(async (req, res) => {
    const config = await PricingConfig.getSingleton();
    config.isSurgeEnabled = !config.isSurgeEnabled;
    await config.save();
    
    res.status(200).json({
        status: 'success',
        message: `Surge pricing ${config.isSurgeEnabled ? 'enabled' : 'disabled'}`,
        data: {
            isSurgeEnabled: config.isSurgeEnabled,
            surgeMultiplier: config.surgeMultiplier
        }
    });
});

// Toggle night charges
exports.toggleNightCharges = catchAsync(async (req, res) => {
    const config = await PricingConfig.getSingleton();
    config.isNightEnabled = !config.isNightEnabled;
    await config.save();
    
    res.status(200).json({
        status: 'success',
        message: `Night charges ${config.isNightEnabled ? 'enabled' : 'disabled'}`,
        data: {
            isNightEnabled: config.isNightEnabled,
            nightCharge: config.nightCharge
        }
    });
});

// Get pricing summary (for dashboard)
exports.getPricingSummary = catchAsync(async (req, res) => {
    const config = await PricingConfig.getSingleton();
    
    const summary = {
        gst: {
            enabled: config.isGstEnabled,
            percent: config.gstPercent
        },
        commission: {
            percent: config.platformCommissionPercent
        },
        surge: {
            enabled: config.isSurgeEnabled,
            multiplier: config.surgeMultiplier,
            isActive: config.isInSurgeHours()
        },
        nightCharges: {
            enabled: config.isNightEnabled,
            amount: config.nightCharge,
            isActive: config.isInNightHours()
        },
        scheduledPremium: {
            enabled: config.isScheduledPremiumEnabled,
            amount: config.scheduledPremium
        },
        walletHold: config.walletHoldAmount
    };
    
    res.status(200).json({
        status: 'success',
        data: {
            summary
        }
    });
});
