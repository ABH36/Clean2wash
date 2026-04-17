const SubscriptionPlan = require('../../../models/SubscriptionPlan');
const Subscription = require('../../../models/Subscription');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

const normalizeApplicableValue = (value = '') => String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const derivePlanScope = (plan = {}) => {
    if (plan.moduleScope) return plan.moduleScope;

    const applicableServices = Array.isArray(plan.applicableServices) ? plan.applicableServices : [];
    if (applicableServices.some((entry) => /spare[_\s-]*driver|chauffeur/i.test(String(entry)))) {
        return 'spare-driver';
    }

    return 'general';
};

const normalizeChauffeurPlanPayload = (payload = {}) => {
    const normalizedApplicableServices = Array.isArray(payload.applicableServices)
        ? payload.applicableServices
            .map((entry) => normalizeApplicableValue(entry))
            .filter(Boolean)
        : [];

    return {
        ...payload,
        moduleScope: 'spare-driver',
        applicableServices: normalizedApplicableServices.length > 0
            ? [...new Set(normalizedApplicableServices)]
            : ['SPARE_DRIVER']
    };
};

/**
 * 🛠️ Admin Subscription Controller
 * Hardened with global error handling and visibility logic.
 */

// Get all subscription plans
exports.getPlans = catchAsync(async (req, res, next) => {
    const filter = { isActive: true };

    if (req.query.moduleScope) {
        filter.moduleScope = req.query.moduleScope;
    } else {
        filter.moduleScope = { $ne: 'spare-driver' };
    }

    const plans = await SubscriptionPlan.find(filter).sort({ price: 1 });
    res.status(200).json({
        status: 'success',
        results: plans.length,
        data: { plans }
    });
});

// Get all user subscriptions (Active/Expired/Paused)
exports.getAllSubscriptions = catchAsync(async (req, res, next) => {
    const { status, hubId, userId, moduleScope } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (hubId) query.hub = hubId;
    if (userId) query.user = userId;
    if (moduleScope) query.moduleScope = moduleScope;
    else query.moduleScope = { $ne: 'spare-driver' };

    const subscriptions = await Subscription.find(query)
        .populate('user', 'name email phone profile')
        .populate('vehicle', 'brand model plate type')
        .populate('hub', 'name city location')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: subscriptions.length,
        data: { subscriptions }
    });
});

// Create a new subscription plan
exports.createPlan = catchAsync(async (req, res, next) => {
    const newPlan = await SubscriptionPlan.create({
        ...req.body,
        moduleScope: req.body.moduleScope || derivePlanScope(req.body)
    });
    res.status(201).json({
        status: 'success',
        data: { plan: newPlan }
    });
});

// Update an existing plan
exports.updatePlan = catchAsync(async (req, res, next) => {
    const nextPayload = {
        ...req.body
    };
    if (!nextPayload.moduleScope) {
        nextPayload.moduleScope = derivePlanScope(req.body);
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, nextPayload, {
        new: true,
        runValidators: true
    });

    if (!plan) {
        return next(new AppError('No plan found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { plan }
    });
});

// Delete a plan (Soft delete)
exports.deletePlan = catchAsync(async (req, res, next) => {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { isActive: false });

    if (!plan) {
        return next(new AppError('No plan found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Manual Subscription Override (Admin Tool)
exports.forceExpireSubscription = catchAsync(async (req, res, next) => {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return next(new AppError('Subscription not found', 404));

    subscription.status = 'expired';
    subscription.endDate = new Date();
    await subscription.save();

    res.status(200).json({
        status: 'success',
        message: 'Subscription forcefully expired'
    });
});

exports.getChauffeurPlans = catchAsync(async (req, res, next) => {
    const plans = await SubscriptionPlan.find({
        isActive: true,
        moduleScope: 'spare-driver'
    }).sort({ price: 1 });

    res.status(200).json({
        status: 'success',
        results: plans.length,
        data: { plans }
    });
});

exports.createChauffeurPlan = catchAsync(async (req, res, next) => {
    const newPlan = await SubscriptionPlan.create(normalizeChauffeurPlanPayload(req.body));

    res.status(201).json({
        status: 'success',
        data: { plan: newPlan }
    });
});

exports.updateChauffeurPlan = catchAsync(async (req, res, next) => {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan || derivePlanScope(plan) !== 'spare-driver') {
        return next(new AppError('No spare driver plan found with that ID', 404));
    }

    Object.assign(plan, normalizeChauffeurPlanPayload(req.body));
    await plan.save();

    res.status(200).json({
        status: 'success',
        data: { plan }
    });
});

exports.deleteChauffeurPlan = catchAsync(async (req, res, next) => {
    const plan = await SubscriptionPlan.findOneAndUpdate(
        { _id: req.params.id, moduleScope: 'spare-driver' },
        { isActive: false },
        { new: true }
    );

    if (!plan) {
        return next(new AppError('No spare driver plan found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
