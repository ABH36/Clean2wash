const SurgePricingRule = require('../../../models/SurgePricingRule');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * 🚀 ADMIN SURGE PRICING CONTROLLER
 * Manage dynamic pricing rules (Rapido/Uber style)
 */

// Get all surge pricing rules
exports.getAllRules = catchAsync(async (req, res) => {
    const { type, isActive, sortBy = 'priority' } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const rules = await SurgePricingRule.find(filter)
        .sort({ [sortBy]: -1, createdAt: -1 });
    
    res.status(200).json({
        status: 'success',
        results: rules.length,
        data: {
            rules
        }
    });
});

// Get single rule
exports.getRule = catchAsync(async (req, res, next) => {
    const rule = await SurgePricingRule.findById(req.params.id);
    
    if (!rule) {
        return next(new AppError('Surge pricing rule not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            rule
        }
    });
});

// Create new rule
exports.createRule = catchAsync(async (req, res) => {
    const rule = await SurgePricingRule.create(req.body);
    
    res.status(201).json({
        status: 'success',
        message: 'Surge pricing rule created successfully',
        data: {
            rule
        }
    });
});

// Update rule
exports.updateRule = catchAsync(async (req, res, next) => {
    const rule = await SurgePricingRule.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    
    if (!rule) {
        return next(new AppError('Surge pricing rule not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Surge pricing rule updated successfully',
        data: {
            rule
        }
    });
});

// Delete rule
exports.deleteRule = catchAsync(async (req, res, next) => {
    const rule = await SurgePricingRule.findByIdAndDelete(req.params.id);
    
    if (!rule) {
        return next(new AppError('Surge pricing rule not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Surge pricing rule deleted successfully'
    });
});

// Toggle rule status
exports.toggleRule = catchAsync(async (req, res, next) => {
    const rule = await SurgePricingRule.findById(req.params.id);
    
    if (!rule) {
        return next(new AppError('Surge pricing rule not found', 404));
    }
    
    rule.isActive = !rule.isActive;
    await rule.save();
    
    res.status(200).json({
        status: 'success',
        message: `Rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
            rule
        }
    });
});

// Test rule (preview surge calculation)
exports.testRule = catchAsync(async (req, res) => {
    const {
        baseAmount = 1000,
        dateTime,
        location = {},
        serviceType = 'hourly',
        vehicleType = 'sedan'
    } = req.body;
    
    const criteria = {
        dateTime: dateTime ? new Date(dateTime) : new Date(),
        location,
        serviceType,
        vehicleType
    };
    
    const surgeResult = await SurgePricingRule.calculateTotalSurge(baseAmount, criteria);
    
    res.status(200).json({
        status: 'success',
        data: {
            baseAmount,
            surgeAmount: surgeResult.surgeAmount,
            totalAmount: baseAmount + surgeResult.surgeAmount,
            multiplier: surgeResult.totalMultiplier,
            appliedRules: surgeResult.appliedRules,
            criteria
        }
    });
});

// Get rule statistics
exports.getRuleStats = catchAsync(async (req, res) => {
    const rules = await SurgePricingRule.find({ isActive: true });
    
    const stats = {
        totalRules: rules.length,
        activeRules: rules.filter(r => r.isActive).length,
        byType: {},
        totalRevenue: 0,
        totalApplications: 0
    };
    
    rules.forEach(rule => {
        // Count by type
        stats.byType[rule.type] = (stats.byType[rule.type] || 0) + 1;
        
        // Aggregate stats
        stats.totalRevenue += rule.stats.totalRevenue || 0;
        stats.totalApplications += rule.stats.timesApplied || 0;
    });
    
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

// Initialize default rules
exports.initializeDefaultRules = catchAsync(async (req, res) => {
    const defaultRules = [
        {
            name: 'Peak Morning Hours',
            description: 'Surge pricing during morning rush (7 AM - 10 AM)',
            type: 'time_based',
            multiplier: 1.3,
            timeRules: {
                daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
                timeSlots: [
                    { startTime: '07:00', endTime: '10:00' }
                ]
            },
            applicableServices: ['all'],
            applicableVehicles: ['all'],
            priority: 50,
            display: {
                showToUser: true,
                userMessage: 'Peak hours - High demand',
                badgeColor: '#FF9900'
            }
        },
        {
            name: 'Peak Evening Hours',
            description: 'Surge pricing during evening rush (5 PM - 9 PM)',
            type: 'time_based',
            multiplier: 1.4,
            timeRules: {
                daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
                timeSlots: [
                    { startTime: '17:00', endTime: '21:00' }
                ]
            },
            applicableServices: ['all'],
            applicableVehicles: ['all'],
            priority: 50,
            display: {
                showToUser: true,
                userMessage: 'Evening rush - High demand',
                badgeColor: '#FF9900'
            }
        },
        {
            name: 'Late Night Premium',
            description: 'Premium pricing for late night trips (12 AM - 5 AM)',
            type: 'time_based',
            multiplier: 1.5,
            timeRules: {
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
                timeSlots: [
                    { startTime: '00:00', endTime: '05:00' }
                ]
            },
            applicableServices: ['all'],
            applicableVehicles: ['all'],
            priority: 60,
            display: {
                showToUser: true,
                userMessage: 'Late night premium',
                badgeColor: '#8B5CF6'
            }
        },
        {
            name: 'Weekend Surge',
            description: 'Weekend surge pricing',
            type: 'time_based',
            multiplier: 1.2,
            timeRules: {
                daysOfWeek: [0, 6], // Saturday and Sunday
                timeSlots: [
                    { startTime: '00:00', endTime: '23:59' }
                ]
            },
            applicableServices: ['all'],
            applicableVehicles: ['all'],
            priority: 40,
            display: {
                showToUser: true,
                userMessage: 'Weekend demand',
                badgeColor: '#10B981'
            }
        }
    ];
    
    const results = [];
    
    for (const ruleData of defaultRules) {
        const existing = await SurgePricingRule.findOne({ name: ruleData.name });
        
        if (!existing) {
            const rule = await SurgePricingRule.create(ruleData);
            results.push({ name: rule.name, status: 'created' });
        } else {
            results.push({ name: ruleData.name, status: 'already exists' });
        }
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Default surge pricing rules initialized',
        data: {
            results
        }
    });
});

// Bulk update rules
exports.bulkUpdateRules = catchAsync(async (req, res) => {
    const { ruleIds, updates } = req.body;
    
    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
        return next(new AppError('Please provide rule IDs', 400));
    }
    
    const result = await SurgePricingRule.updateMany(
        { _id: { $in: ruleIds } },
        updates
    );
    
    res.status(200).json({
        status: 'success',
        message: `${result.modifiedCount} rules updated successfully`,
        data: {
            modifiedCount: result.modifiedCount
        }
    });
});
