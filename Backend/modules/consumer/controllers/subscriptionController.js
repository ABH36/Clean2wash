const Subscription = require('../../../models/Subscription');
const SubscriptionPlan = require('../../../models/SubscriptionPlan');
const Hub = require('../../../models/Hub');
const MasterData = require('../../../models/MasterData');
const Vehicle = require('../../../models/Vehicle');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const { sendAdminNotification, sendNotification } = require('../../../utils/notificationService');
const crypto = require('crypto');

const APARTMENT_SLOT_CAPACITY = 10;
const APARTMENT_DEFAULT_SLOTS = ['morning', 'evening'];

const normalizeApplicableValue = (value = '') => String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const deriveRequestedScope = (serviceKey = '', moduleScope = '') => {
    if (moduleScope) return moduleScope;

    const normalizedServiceKey = normalizeApplicableValue(serviceKey);
    if (normalizedServiceKey === 'APARTMENT_WASH') return 'apartment-wash';
    if (normalizedServiceKey === 'SPARE_DRIVER' || normalizedServiceKey === 'CHAUFFEUR') return 'spare-driver';
    return null;
};

const isStrictServiceSubscription = (subscription, serviceKey = '') => {
    const normalizedServiceKey = normalizeApplicableValue(serviceKey);
    if (!normalizedServiceKey) return false;

    const subscriptionServiceKey = normalizeApplicableValue(subscription?.service?.key || '');
    if (subscriptionServiceKey === normalizedServiceKey) return true;

    const applicableServices = Array.isArray(subscription?.applicableServices) ? subscription.applicableServices : [];
    return applicableServices.some((entry) => normalizeApplicableValue(entry) === normalizedServiceKey);
};

const getScopedSubscription = async (userId, { moduleScope, serviceKey, includePaused = true, includePending = false } = {}) => {
    const requestedScope = deriveRequestedScope(serviceKey, moduleScope);
    const bookingData = serviceKey
        ? {
            service: {
                key: serviceKey,
                category: serviceKey === 'APARTMENT_WASH' ? 'Apartment' : ''
            },
            hub: serviceKey === 'APARTMENT_WASH' ? {} : null,
            location: serviceKey === 'APARTMENT_WASH' ? { type: 'Apartment', hubId: 'apartment' } : {}
        }
        : null;

    if (serviceKey) {
        const eligibleStatuses = ['active'];
        if (includePaused) eligibleStatuses.push('paused');
        if (includePending) eligibleStatuses.push('pending');

        const subscriptions = await Subscription.find({
            user: userId,
            status: { $in: eligibleStatuses }
        }).sort({ createdAt: -1 });

        const now = new Date();
        for (const subscription of subscriptions) {
            if (subscription.endDate < now) {
                subscription.status = 'expired';
                await subscription.save();
            }
        }

        const strictMatches = subscriptions.filter((subscription) => (
            subscription.endDate >= now && isStrictServiceSubscription(subscription, serviceKey)
        ));
        const activeMatch = strictMatches.find((subscription) => subscription.status === 'active');
        if (activeMatch) return activeMatch;
        const pausedMatch = strictMatches.find((subscription) => subscription.status === 'paused');
        if (pausedMatch) return pausedMatch;
        const pendingMatch = strictMatches.find((subscription) => subscription.status === 'pending');
        if (pendingMatch) return pendingMatch;
        return null;
    }

    return Subscription.getActiveSubscription(userId, bookingData, { moduleScope: requestedScope });
};

const getApartmentServiceConfig = async () => MasterData.findOne({
    type: 'SERVICE',
    isActive: true,
    $or: [
        { key: 'APARTMENT_WASH' },
        { 'metadata.id': 'apartment-wash' },
        { 'metadata.path': '/apartments' }
    ]
}).lean();

const getAllowedApartmentSlots = (serviceDoc = null) => {
    const configuredSlots = Array.isArray(serviceDoc?.metadata?.slots)
        ? serviceDoc.metadata.slots
            .map((slot) => normalizeApplicableValue(slot?.id || slot?.label || ''))
            .filter(Boolean)
        : [];

    return configuredSlots.length > 0 ? configuredSlots : APARTMENT_DEFAULT_SLOTS.map(normalizeApplicableValue);
};

const ensureApartmentSlotCapacity = async ({ hubId, slot, excludeSubscriptionId = null }) => {
    const normalizedSlot = String(slot || '').toLowerCase();
    if (!hubId || !normalizedSlot) return;

    const query = {
        hub: hubId,
        slot: normalizedSlot,
        status: 'active',
        endDate: { $gte: new Date() },
        $or: [
            { 'service.key': 'APARTMENT_WASH' },
            { applicableServices: 'APARTMENT_WASH' }
        ]
    };

    if (excludeSubscriptionId) {
        query._id = { $ne: excludeSubscriptionId };
    }

    const activeCount = await Subscription.countDocuments(query);
    if (activeCount >= APARTMENT_SLOT_CAPACITY) {
        throw new AppError('Selected apartment slot is full. Please choose another slot.', 400);
    }
};

/**
 * 🔐 Subscription Controller (Hardened)
 * Includes Razorpay Signature Verification & Wallet Support.
 */

// 1. Create/Buy Subscription
exports.createSubscription = catchAsync(async (req, res, next) => {
    const { 
        planId, 
        plan, 
        paymentMethod, 
        vehicleId, 
        vehicleIds,
        hubId,
        slot,
        autoRenew,
        serviceId,
        serviceKey,
        paymentId, 
        orderId, 
        signature,
        parkingDetails 
    } = req.body;

    const finalVehicleIds = vehicleIds || (vehicleId ? [vehicleId] : []);

    // Security: Online payments MUST have a signature
    if (paymentMethod === 'razorpay') {
        if (!paymentId || !orderId || !signature) {
            return next(new AppError('Payment verification details missing', 400));
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(orderId + "|" + paymentId)
            .digest('hex');

        if (generated_signature !== signature) {
            console.error(`🚨 FRAUD ATTEMPT: Invalid Signature from user ${req.user._id}`);
            return next(new AppError('Invalid payment signature. Verification failed.', 400));
        }
    }

    // Identify Plan
    let selectedPlan;
    if (planId) {
        selectedPlan = await SubscriptionPlan.findById(planId);
    } else {
        selectedPlan = await SubscriptionPlan.findOne({ 
            $or: [
                { planKey: plan },
                { name: new RegExp(plan, 'i') }
            ]
        });
    }

    if (!selectedPlan) return next(new AppError('Subscription plan not found', 404));

    const normalizedApplicableServices = Array.isArray(selectedPlan.applicableServices)
        ? selectedPlan.applicableServices
        : [];
    const normalizedServiceKey = normalizeApplicableValue(serviceKey || normalizedApplicableServices[0] || '');
    const inferredModuleScope = normalizedApplicableServices.some((entry) => /apartment[_\s-]*wash/i.test(String(entry)))
        ? 'apartment-wash'
        : normalizedApplicableServices.some((entry) => /spare[_\s-]*driver|chauffeur/i.test(String(entry)))
            ? 'spare-driver'
            : 'general';
    const moduleScope = selectedPlan.moduleScope && selectedPlan.moduleScope !== 'general'
        ? selectedPlan.moduleScope
        : inferredModuleScope;

    if (normalizedServiceKey === 'APARTMENT_WASH') {
        const applicablePlan = normalizedApplicableServices.some((entry) => normalizeApplicableValue(entry) === 'APARTMENT_WASH');
        if (!applicablePlan) {
            return next(new AppError('Selected plan is not valid for apartment wash', 400));
        }

        if (!hubId || !slot || !finalVehicleIds.length) {
            return next(new AppError('Apartment, vehicle and slot are required for apartment wash subscription', 400));
        }

        const requiredParkingFields = ['basement', 'block', 'pillar', 'carNumber', 'carModel'];
        const missingParkingField = requiredParkingFields.find((field) => !String(parkingDetails?.[field] || '').trim());
        if (missingParkingField) {
            return next(new AppError('Complete parking details are required for apartment wash subscription', 400));
        }

        const [hub, serviceDoc, vehicle] = await Promise.all([
            Hub.findOne({ _id: hubId, isActive: true }),
            getApartmentServiceConfig(),
            Vehicle.findOne({ _id: finalVehicleIds[0], owner: req.user._id, isActive: true })
        ]);

        if (!hub) {
            return next(new AppError('Selected apartment is not available', 404));
        }

        if (!vehicle) {
            return next(new AppError('Selected vehicle is not available for your account', 400));
        }

        const allowedSlots = getAllowedApartmentSlots(serviceDoc);
        if (!allowedSlots.includes(normalizeApplicableValue(slot))) {
            return next(new AppError('Selected apartment slot is invalid', 400));
        }

        await ensureApartmentSlotCapacity({ hubId, slot });
    }

    // Calculate Dates
    const startDate = new Date();
    const endDate = new Date();
    const interval = selectedPlan.interval.toLowerCase();
    
    if (interval === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
    else if (interval === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
    else if (interval === 'annual' || interval === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1); // Default

    const isApartmentSubscriptionRequest = normalizedServiceKey === 'APARTMENT_WASH';

    if (!isApartmentSubscriptionRequest) {
        await Subscription.updateMany(
            { user: req.user._id, status: 'active', moduleScope },
            { status: 'expired' }
        );
    }

    // Create New
    const newSubscription = await Subscription.create({
        user: req.user._id,
        planId: selectedPlan._id,
        plan: selectedPlan.name,
        hub: hubId || undefined,
        price: {
            amount: selectedPlan.price,
            billingCycle: interval === 'yearly' ? 'annual' : interval
        },
        vehicleIds: finalVehicleIds,
        vehicle: finalVehicleIds[0], // Primary for backward compatibility
        slot: slot || undefined,
        status: isApartmentSubscriptionRequest ? 'pending' : 'active',
        startDate,
        endDate,
        autoRenew: Boolean(autoRenew),
        paymentMethod,
        paymentId: paymentId || `wallet_${Date.now()}`,
        orderId,
        paymentGateway: {
            paymentId,
            orderId,
            signature
        },
        applicableServices: normalizedApplicableServices,
        moduleScope,
        monthlyCredits: selectedPlan.credits || 4,
        parkingDetails,
        service: {
            id: serviceId || '',
            key: serviceKey || normalizedApplicableServices[0] || '',
            title: selectedPlan.name,
            path: serviceKey === 'APARTMENT_WASH' ? '/apartments' : ''
        }
    });

    if (isApartmentSubscriptionRequest) {
        await sendNotification(req.user._id, {
            title: 'Apartment Request Received',
            message: `Your apartment wash request for ${selectedPlan.name} has been sent for admin verification and captain mapping.`,
            type: 'subscription',
            priority: 'high',
            actionUrl: '/apartment-wash',
            metaData: {
                subscriptionId: newSubscription._id.toString(),
                status: 'pending',
                serviceKey: 'APARTMENT_WASH'
            }
        });

        await sendAdminNotification({
            title: 'New Apartment Subscription Request',
            message: `${req.user?.name || 'A user'} requested apartment wash for ${slot || 'pending slot'} at ${hubId || 'an apartment'}. Review captain mapping before approval.`,
            type: 'apartment_subscription_request',
            priority: 'high',
            actionUrl: '/admin/apartment-wash',
            metaData: {
                subscriptionId: newSubscription._id.toString(),
                userId: req.user._id.toString(),
                hubId: String(hubId || ''),
                slot: String(slot || '')
            }
        });
    }

    res.status(201).json({
        status: 'success',
        data: { subscription: newSubscription }
    });
});

// 2. Get User's Active Subscription (With Auto-Expiry)
exports.getSubscription = catchAsync(async (req, res, next) => {
    const { moduleScope, serviceKey } = req.query;
    const subscription = await getScopedSubscription(req.user._id, { moduleScope, serviceKey, includePending: true });

    if (!subscription) {
        return res.status(200).json({
            status: 'success',
            data: { subscription: null }
        });
    }

    await subscription.populate('hub', 'name city location metadata');
    await subscription.populate('vehicle', 'brand model plate plateNumber type');

    res.status(200).json({
        status: 'success',
        data: { subscription }
    });
});

exports.updateSubscriptionSettings = catchAsync(async (req, res, next) => {
    const { moduleScope, serviceKey } = req.query;
    const subscription = await getScopedSubscription(req.user._id, {
        moduleScope,
        serviceKey,
        includePending: serviceKey === 'APARTMENT_WASH'
    });
    if (!subscription) return next(new AppError('No active subscription found', 404));

    const { hubId, vehicleId, slot, parkingDetails, autoRenew } = req.body;

    if (serviceKey === 'APARTMENT_WASH') {
        const serviceDoc = await getApartmentServiceConfig();
        const nextHubId = hubId || subscription.hub;
        const nextVehicleId = vehicleId || subscription.vehicle;
        const nextSlot = slot || subscription.slot;
        const mergedParkingDetails = {
            ...(subscription.parkingDetails || {}),
            ...(parkingDetails && typeof parkingDetails === 'object' ? parkingDetails : {})
        };

        if (!nextHubId || !nextVehicleId || !nextSlot) {
            return next(new AppError('Apartment, vehicle and slot are required for apartment wash updates', 400));
        }

        const requiredParkingFields = ['basement', 'block', 'pillar', 'carNumber', 'carModel'];
        const missingParkingField = requiredParkingFields.find((field) => !String(mergedParkingDetails?.[field] || '').trim());
        if (missingParkingField) {
            return next(new AppError('Complete parking details are required for apartment wash updates', 400));
        }

        const [hub, vehicle] = await Promise.all([
            Hub.findOne({ _id: nextHubId, isActive: true }),
            Vehicle.findOne({ _id: nextVehicleId, owner: req.user._id, isActive: true })
        ]);

        if (!hub) {
            return next(new AppError('Selected apartment is not available', 404));
        }

        if (!vehicle) {
            return next(new AppError('Selected vehicle is not available for your account', 400));
        }

        const allowedSlots = getAllowedApartmentSlots(serviceDoc);
        if (!allowedSlots.includes(normalizeApplicableValue(nextSlot))) {
            return next(new AppError('Selected apartment slot is invalid', 400));
        }

        if (String(nextHubId) !== String(subscription.hub || '') || String(nextSlot).toLowerCase() !== String(subscription.slot || '').toLowerCase()) {
            await ensureApartmentSlotCapacity({ hubId: nextHubId, slot: nextSlot, excludeSubscriptionId: subscription._id });
        }
    }

    if (hubId !== undefined) subscription.hub = hubId || undefined;
    if (vehicleId !== undefined) subscription.vehicle = vehicleId || undefined;
    if (slot !== undefined) subscription.slot = slot || undefined;
    if (autoRenew !== undefined) subscription.autoRenew = Boolean(autoRenew);
    if (parkingDetails && typeof parkingDetails === 'object') {
        subscription.parkingDetails = {
            ...(subscription.parkingDetails || {}),
            ...parkingDetails
        };
    }

    await subscription.save();
    await subscription.populate('hub', 'name city location metadata');
    await subscription.populate('vehicle', 'brand model plate plateNumber type');

    res.status(200).json({
        status: 'success',
        data: { subscription }
    });
});

exports.skipSubscriptionServiceDate = catchAsync(async (req, res, next) => {
    const { moduleScope, serviceKey } = req.query;
    const subscription = await getScopedSubscription(req.user._id, { moduleScope, serviceKey });
    if (!subscription) return next(new AppError('No active subscription found', 404));

    const requestedDate = req.body?.date ? new Date(req.body.date) : new Date();
    if (Number.isNaN(requestedDate.getTime())) {
        return next(new AppError('Invalid skip date', 400));
    }

    requestedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
        return next(new AppError('Skip date cannot be in the past', 400));
    }

    const alreadySkipped = Array.isArray(subscription.skipDates) && subscription.skipDates.some((skipDate) => {
        const current = new Date(skipDate);
        current.setHours(0, 0, 0, 0);
        return current.getTime() === requestedDate.getTime();
    });

    if (!alreadySkipped) {
        subscription.skipDates = [...(subscription.skipDates || []), requestedDate];
        await subscription.save();
    }

    await subscription.populate('hub', 'name city location metadata');
    await subscription.populate('vehicle', 'brand model plate plateNumber type');

    res.status(200).json({
        status: 'success',
        data: { subscription }
    });
});

// 3. Pause Subscription
exports.pauseSubscription = catchAsync(async (req, res, next) => {
    const { moduleScope, serviceKey } = req.query;
    const subscription = await getScopedSubscription(req.user._id, { moduleScope, serviceKey, includePaused: false });
    if (!subscription) return next(new AppError('No active subscription found', 404));

    subscription.status = 'paused';
    await subscription.save();

    res.status(200).json({
        status: 'success',
        data: { subscription }
    });
});

// 4. Resume Subscription
exports.resumeSubscription = catchAsync(async (req, res, next) => {
    const { moduleScope, serviceKey } = req.query;
    const requestedScope = deriveRequestedScope(serviceKey, moduleScope);
    let subscription = null;

    if (serviceKey) {
        subscription = await Subscription.find({
            user: req.user._id,
            status: 'paused'
        }).sort({ createdAt: -1 }).then((subscriptions) => (
            subscriptions.find((entry) => isStrictServiceSubscription(entry, serviceKey)) || null
        ));
    } else {
        const resumeQuery = { user: req.user._id, status: 'paused' };
        if (requestedScope) {
            resumeQuery.moduleScope = requestedScope;
        }
        subscription = await Subscription.findOne(resumeQuery).sort({ createdAt: -1 });
    }
    if (!subscription) return next(new AppError('No paused subscription found', 404));

    // Check if original end date has already passed while paused
    if (new Date() > new Date(subscription.endDate)) {
        subscription.status = 'expired';
        await subscription.save();
        return next(new AppError('Subscription has already expired during pause period', 400));
    }

    subscription.status = 'active';
    await subscription.save();

    res.status(200).json({
        status: 'success',
        data: { subscription }
    });
});

// 5. Cancel Subscription (Legacy/Immediate)
exports.cancelSubscription = catchAsync(async (req, res, next) => {
    const { moduleScope, serviceKey } = req.query;
    const subscription = await getScopedSubscription(req.user._id, { moduleScope, serviceKey, includePaused: false });
    if (!subscription) return next(new AppError('No active subscription found', 404));

    subscription.status = 'cancelled';
    await subscription.save();

    res.status(200).json({
        status: 'success',
        message: 'Subscription cancelled successfully'
    });
});

// 6. Use Credit
exports.useSubscriptionCredit = catchAsync(async (req, res, next) => {
    const { moduleScope, serviceKey } = req.query;
    const subscription = await getScopedSubscription(req.user._id, { moduleScope, serviceKey, includePaused: false });
    if (!subscription) return next(new AppError('No active subscription found', 404));

    if (subscription.usedCredits >= subscription.monthlyCredits) {
        return next(new AppError('Monthly wash credits exhausted', 400));
    }

    subscription.usedCredits += 1;
    await subscription.save();

    res.status(200).json({
        status: 'success',
        data: { subscription }
    });
});
