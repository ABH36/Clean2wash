const ServiceConfig = require('../../../models/ServiceConfig');
const catchAsync = require('../../../utils/catchAsync');

// Get all services
exports.getAllServices = catchAsync(async (req, res) => {
    const services = await ServiceConfig.find().sort({ type: 1 });
    
    res.status(200).json({
        status: 'success',
        results: services.length,
        data: {
            services
        }
    });
});

// Get single service
exports.getService = catchAsync(async (req, res) => {
    const service = await ServiceConfig.findOne({ type: req.params.type });
    
    if (!service) {
        return res.status(404).json({
            status: 'error',
            message: 'Service not found'
        });
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            service
        }
    });
});

// Update service configuration
exports.updateService = catchAsync(async (req, res) => {
    const allowedFields = [
        'name',
        'description',
        'basePrice',
        'hourlyRate',
        'subscriberHourlyRate',
        'includedHours',
        'overtimeRate',
        'isActive',
        'icon',
        'features',
        'vehicleMultipliers'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updates[key] = req.body[key];
        }
    });
    
    const service = await ServiceConfig.findOneAndUpdate(
        { type: req.params.type },
        updates,
        { new: true, runValidators: true }
    );
    
    if (!service) {
        return res.status(404).json({
            status: 'error',
            message: 'Service not found'
        });
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Service updated successfully',
        data: {
            service
        }
    });
});

// Toggle service active status
exports.toggleServiceStatus = catchAsync(async (req, res) => {
    const service = await ServiceConfig.findOne({ type: req.params.type });
    
    if (!service) {
        return res.status(404).json({
            status: 'error',
            message: 'Service not found'
        });
    }
    
    service.isActive = !service.isActive;
    await service.save();
    
    res.status(200).json({
        status: 'success',
        message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
            service
        }
    });
});

// Initialize default services (run once)
exports.initializeServices = catchAsync(async (req, res) => {
    const defaultServices = [
        {
            type: 'point',
            name: 'Point-to-Point',
            description: 'Round-trip driver service from your location. Perfect for airport drops, hospital visits, and quick errands.',
            basePrice: 499,
            hourlyRate: 0,
            subscriberHourlyRate: 0,
            includedHours: 2,
            overtimeRate: 150,
            isActive: true,
            icon: 'map-pin',
            features: [
                'Round-trip service',
                'Fixed destination',
                '1-2 hours typical',
                'Lowest base price'
            ],
            vehicleMultipliers: {
                hatchback: 1.0,
                sedan: 1.2,
                suv: 1.5,
                luxury: 2.0
            }
        },
        {
            type: 'hourly',
            name: 'Hourly Booking',
            description: 'Flexible rental of driver for specified hours. Multiple stops allowed within time block.',
            basePrice: 799,
            hourlyRate: 180,
            subscriberHourlyRate: 150,
            includedHours: 4,
            overtimeRate: 200,
            isActive: true,
            icon: 'clock',
            features: [
                'Flexible duration',
                'Multiple destinations',
                'Driver waits between stops',
                'Subscriber discount available'
            ],
            vehicleMultipliers: {
                hatchback: 1.0,
                sedan: 1.2,
                suv: 1.5,
                luxury: 2.0
            }
        },
        {
            type: 'full_day',
            name: 'Full Day Service',
            description: 'Dedicated chauffeur for entire day (8 hours). Comprehensive city movement coverage.',
            basePrice: 999,
            hourlyRate: 0,
            subscriberHourlyRate: 0,
            includedHours: 8,
            overtimeRate: 200,
            isActive: true,
            icon: 'calendar',
            features: [
                'Fixed 8-hour block',
                'Package pricing',
                'Dedicated availability',
                'No destination restrictions'
            ],
            vehicleMultipliers: {
                hatchback: 1.0,
                sedan: 1.2,
                suv: 1.5,
                luxury: 2.0
            }
        },
        {
            type: 'outstation',
            name: 'Outstation Service',
            description: 'Inter-city travel with professional driver. 24-hour travel block for long-distance trips.',
            basePrice: 2499,
            hourlyRate: 0,
            subscriberHourlyRate: 0,
            includedHours: 24,
            overtimeRate: 250,
            isActive: true,
            icon: 'map',
            features: [
                '24 hours minimum',
                'Inter-city coverage',
                'Driver allowances included',
                'Long-distance travel'
            ],
            vehicleMultipliers: {
                hatchback: 1.0,
                sedan: 1.2,
                suv: 1.5,
                luxury: 2.0
            }
        }
    ];
    
    const results = [];
    
    for (const serviceData of defaultServices) {
        const existing = await ServiceConfig.findOne({ type: serviceData.type });
        
        if (!existing) {
            const service = await ServiceConfig.create(serviceData);
            results.push({ type: service.type, status: 'created' });
        } else {
            results.push({ type: serviceData.type, status: 'already exists' });
        }
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Services initialized',
        data: {
            results
        }
    });
});
