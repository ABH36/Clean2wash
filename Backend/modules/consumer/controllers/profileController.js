const User = require('../../../models/User');
const Vehicle = require('../../../models/Vehicle');
const Booking = require('../../../models/Booking');
const WalletTransaction = require('../../../models/WalletTransaction');
const Notification = require('../../../models/Notification');
const Subscription = require('../../../models/Subscription');
const SubscriptionPlan = require('../../../models/SubscriptionPlan');
const Hub = require('../../../models/Hub');
const MasterData = require('../../../models/MasterData');
const { sendNotification } = require('../../../utils/notificationService');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');



// --- Payment Methods ---

// Get saved payment methods
exports.getPaymentMethods = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('profile.paymentMethods');
    res.status(200).json({
        status: 'success',
        data: {
            methods: user.profile.paymentMethods || []
        }
    });
});

// Add payment method
exports.addPaymentMethod = catchAsync(async (req, res, next) => {
    const { type, brand, last4, expiry, handle, isDefault } = req.body;

    if (!type || (!last4 && !handle)) {
        return next(new AppError('Payment method details are incomplete', 400));
    }

    const user = await User.findById(req.user.id);

    // If this is the first method or marked as default, unset others as default
    if (isDefault || user.profile.paymentMethods.length === 0) {
        user.profile.paymentMethods.forEach(m => m.isDefault = false);
    }

    user.profile.paymentMethods.push({
        type,
        brand,
        last4,
        expiry,
        handle,
        isDefault: isDefault || user.profile.paymentMethods.length === 0
    });

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Payment method added successfully',
        data: {
            methods: user.profile.paymentMethods
        }
    });
});

// Set default payment method
exports.setDefaultPaymentMethod = catchAsync(async (req, res, next) => {
    const { methodId } = req.params;
    const user = await User.findById(req.user.id);

    let methodFound = false;
    user.profile.paymentMethods.forEach(m => {
        if (m._id.toString() === methodId) {
            m.isDefault = true;
            methodFound = true;
        } else {
            m.isDefault = false;
        }
    });

    if (!methodFound) {
        return next(new AppError('Payment method not found', 404));
    }

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Default payment method updated',
        data: {
            methods: user.profile.paymentMethods
        }
    });
});

// Remove payment method
exports.removePaymentMethod = catchAsync(async (req, res, next) => {
    const { methodId } = req.params;
    const user = await User.findById(req.user.id);

    const methodToRemove = user.profile.paymentMethods.find(m => m._id.toString() === methodId);
    if (!methodToRemove) {
        return next(new AppError('Payment method not found', 404));
    }

    const wasDefault = methodToRemove.isDefault;

    user.profile.paymentMethods = user.profile.paymentMethods.filter(
        m => m._id.toString() !== methodId
    );

    // If we removed the default, set a new one if available
    if (wasDefault && user.profile.paymentMethods.length > 0) {
        user.profile.paymentMethods[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Payment method removed successfully',
        data: {
            methods: user.profile.paymentMethods
        }
    });
});

// --- Trusted Contacts ---

// Get trusted contacts
exports.getTrustedContacts = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('profile.trustedContacts');
    res.status(200).json({
        status: 'success',
        data: {
            contacts: user.profile.trustedContacts || []
        }
    });
});

// Add trusted contact
exports.addTrustedContact = catchAsync(async (req, res, next) => {
    const { name, phone, relation } = req.body;
    if (!name || !phone) {
        return next(new AppError('Name and phone are required', 400));
    }

    const user = await User.findById(req.user.id);

    // Limit to 5 contacts
    if (user.profile.trustedContacts.length >= 5) {
        return next(new AppError('Maximum 5 trusted contacts allowed', 400));
    }

    user.profile.trustedContacts.push({ name, phone, relation });
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Contact added successfully',
        data: {
            contacts: user.profile.trustedContacts
        }
    });
});

// Remove trusted contact
exports.removeTrustedContact = catchAsync(async (req, res, next) => {
    const { contactId } = req.params;
    const user = await User.findById(req.user.id);

    user.profile.trustedContacts = user.profile.trustedContacts.filter(
        c => c._id.toString() !== contactId
    );

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Contact removed successfully',
        data: {
            contacts: user.profile.trustedContacts
        }
    });
});

// Get consumer profile
exports.getProfile = catchAsync(async (req, res, next) => {
    const consumer = await User.findById(req.user.id)
        .populate('vehicles', 'brand model type plate image isPrimary')
        .populate('primaryVehicle', 'brand model type plate image')
        .populate('subscription');

    if (!consumer) {
        return next(new AppError('Consumer not found', 404));
    }

    // Remove sensitive data
    consumer.password = undefined;
    consumer.otp = undefined;

    res.status(200).json({
        status: 'success',
        data: {
            consumer
        }
    });
});

// Update consumer profile
exports.updateProfile = catchAsync(async (req, res, next) => {
    const { name, email, phone, profile } = req.body;
    const updateData = {};

    // Update basic info
    if (name) updateData.name = name;
    if (email) {
        // Check if email is already taken by another user
        const existingConsumer = await User.findOne({
            email,
            _id: { $ne: req.user.id }
        });

        if (existingConsumer) {
            return next(new AppError('Email is already taken by another user', 400));
        }
        updateData.email = email;
    }

    if (phone) {
        // Check if phone is already taken by another user
        const existingConsumer = await User.findOne({
            phone,
            _id: { $ne: req.user.id }
        });

        if (existingConsumer) {
            return next(new AppError('Phone number is already taken by another user', 400));
        }
        updateData.phone = phone;
    }

    // Update profile address
    if (profile && profile.address) {
        updateData['profile.address'] = {
            ...req.user.profile.address,
            ...profile.address
        };
    }

    // Update profile avatar
    if (profile && profile.avatar) {
        updateData['profile.avatar'] = profile.avatar;
    }

    const updatedConsumer = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
    )
        .populate('vehicles', 'brand model type plate image isPrimary')
        .populate('primaryVehicle', 'brand model type plate image')
        .populate('subscription');

    // Remove sensitive data
    updatedConsumer.password = undefined;
    updatedConsumer.otp = undefined;

    res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
            consumer: updatedConsumer
        }
    });
});

// Update consumer address
exports.updateAddress = catchAsync(async (req, res, next) => {
    const { street, city, state, pincode, coordinates, landmark } = req.body;

    if (!street || !city || !state || !pincode) {
        return next(new AppError('Please provide all required address fields', 400));
    }

    const updatedConsumer = await User.findByIdAndUpdate(
        req.user.id,
        {
            'profile.address': {
                street,
                city,
                state,
                pincode,
                coordinates,
                landmark
            }
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Address updated successfully',
        data: {
            address: updatedConsumer.profile.address
        }
    });
});

// Update consumer avatar
exports.updateAvatar = catchAsync(async (req, res, next) => {
    const { avatar } = req.body;

    if (!avatar) {
        return next(new AppError('Avatar URL is required', 400));
    }

    const updatedConsumer = await User.findByIdAndUpdate(
        req.user.id,
        { 'profile.avatar': avatar },
        { new: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Avatar updated successfully',
        data: {
            avatar: updatedConsumer.profile.avatar
        }
    });
});

// Get consumer statistics
exports.getStats = catchAsync(async (req, res, next) => {
    const consumerId = req.user.id;

    // Get booking statistics
    const bookingStats = await Booking.getConsumerStats(consumerId);

    // Get vehicle count
    const vehicleCount = await Vehicle.countDocuments({
        owner: consumerId,
        isActive: true
    });

    // Get wallet balance
    const consumer = await User.findById(consumerId).select('wallet');

    // Get upcoming bookings count
    const upcomingBookings = await Booking.countDocuments({
        consumer: consumerId,
        status: { $in: ['pending', 'confirmed', 'assigned'] },
        isActive: true
    });

    // Get completed services this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthServices = await Booking.countDocuments({
        consumer: consumerId,
        status: 'completed',
        createdAt: { $gte: currentMonth },
        isActive: true
    });

    const stats = {
        ...bookingStats,
        vehicles: vehicleCount,
        walletBalance: consumer.wallet.balance,
        upcomingBookings,
        thisMonthServices,
        memberSince: req.user.createdAt,
        totalSavings: bookingStats.totalSpent * 0.1 // Mock calculation
    };

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

// Get consumer wallet
exports.getWallet = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;

    // Get consumer with wallet info
    const consumer = await User.findById(req.user.id)
        .select('wallet');

    if (!consumer) {
        return next(new AppError('Consumer not found', 404));
    }

    // Get transaction history
    const transactionData = await WalletTransaction.getUserTransactions(
        req.user.id,
        { page, limit, type, category, startDate, endDate }
    );

    res.status(200).json({
        status: 'success',
        data: {
            wallet: consumer.wallet,
            transactions: transactionData.transactions,
            pagination: transactionData.pagination
        }
    });
});

// Add money to wallet
exports.addToWallet = catchAsync(async (req, res, next) => {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
        return next(new AppError('Please provide a valid amount', 400));
    }

    // Get current consumer
    const consumer = await User.findById(req.user.id);
    if (!consumer) {
        return next(new AppError('Consumer not found', 404));
    }

    if (!consumer.wallet) {
        consumer.wallet = { balance: 0, lastUpdated: new Date() };
    }

    const { executeWalletTransaction } = require('../../../utils/walletHelper');

    const txn = await executeWalletTransaction(
        req.user.id,
        amount,
        'credit',
        {
            description: `Wallet recharge of ₹${amount}`,
            category: 'WALLET_RECHARGE',
            paymentMethod,
            status: 'completed'
        }
    );

    // Send notification
    await sendNotification(req.user.id, {
        title: 'Money Added to Wallet 💰',
        message: `₹${amount} has been successfully credited to your wallet.`,
        type: 'payment',
        priority: 'medium',
        metaData: { amount, transactionId: txn.transaction._id }
    });

    res.status(200).json({
        status: 'success',
        message: `₹${amount} added to wallet successfully`,
        data: {
            transaction: txn.transaction,
            newBalance: txn.balance
        }
    });
});

// Get consumer notifications
exports.getNotifications = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 20, type, isRead, priority } = req.query;

    const notificationData = await Notification.getConsumerNotifications(
        req.user.id,
        { page, limit, type, isRead, priority }
    );

    res.status(200).json({
        status: 'success',
        data: notificationData
    });
});

// Mark notification as read
exports.markNotificationRead = catchAsync(async (req, res, next) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
        _id: notificationId,
        consumer: req.user.id
    });

    if (!notification) {
        return next(new AppError('Notification not found', 404));
    }

    await notification.markAsRead();

    res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
        data: { notification }
    });
});

// Mark all notifications as read
exports.markAllNotificationsRead = catchAsync(async (req, res, next) => {
    await Notification.markAllAsRead(req.user.id);

    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
    });
});

// Clear all notifications
exports.clearNotifications = catchAsync(async (req, res, next) => {
    await Notification.clearAll(req.user.id);

    res.status(200).json({
        status: 'success',
        message: 'All notifications cleared successfully'
    });
});

// Get subscription details
exports.getSubscription = catchAsync(async (req, res, next) => {
    const subscription = await Subscription.getActiveSubscription(req.user.id);

    if (!subscription) {
        return res.status(200).json({
            status: 'success',
            data: { subscription: null }
        });
    }

    res.status(200).json({
        status: 'success',
        data: { subscription }
    });
});

// Create subscription
exports.createSubscription = catchAsync(async (req, res, next) => {
    const {
        plan: planRaw,
        planId,
        paymentMethod,
        autoRenew = false,
        vehicleId,
        vehicleIds,
        hubId,
        parkingDetails = {},
        slot,
        paymentId,
        orderId,
        serviceId,
        serviceKey
    } = req.body;

    if (!(planRaw || planId) || !paymentMethod) {
        return next(new AppError('Plan and payment method are required', 400));
    }

    const normalize = (value = '') => String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const resolvedVehicleId = vehicleId || (Array.isArray(vehicleIds) && vehicleIds.length > 0 ? vehicleIds[0] : null);
    const normalizedServiceHint = normalize(serviceKey || serviceId);
    const parkingProvided = Boolean(parkingDetails?.basement || parkingDetails?.block || parkingDetails?.pillar);
    const isApartmentFlow = Boolean(
        hubId ||
        slot ||
        parkingProvided ||
        normalizedServiceHint.includes('apartment')
    );

    const existingSubscription = await Subscription.getActiveSubscription(req.user.id);

    const allPlans = await SubscriptionPlan.find({ isActive: true, status: 'Live' });
    const normalizedRequestedPlan = normalize(planId || planRaw);
    const planObj = allPlans.find((p) => {
        const byId = normalize(p._id) === normalizedRequestedPlan;
        const byName = normalize(p.name) === normalizedRequestedPlan;
        return byId || byName;
    });

    if (!planObj) {
        return next(new AppError('Invalid subscription plan', 400));
    }

    if (hubId) {
        const hub = await Hub.findOne({ _id: hubId, isActive: true });
        if (!hub) {
            return next(new AppError('Selected apartment society is not available', 400));
        }
    }

    if (resolvedVehicleId) {
        const vehicle = await Vehicle.findOne({
            _id: resolvedVehicleId,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return next(new AppError('Selected vehicle is invalid', 400));
        }
    }

    if (isApartmentFlow) {
        if (!hubId) {
            return next(new AppError('Apartment society selection is required', 400));
        }

        if (!parkingDetails?.basement || !parkingDetails?.block || !parkingDetails?.pillar) {
            return next(new AppError('Basement, block and pillar details are required for Apartment Wash', 400));
        }

        if (!slot || !['morning', 'afternoon', 'evening', 'night'].includes(slot)) {
            return next(new AppError('Valid apartment slot is required', 400));
        }
    }

    const allowedPaymentMethods = ['card', 'upi', 'wallet', 'netbanking', 'razorpay'];
    const normalizedPaymentMethod = String(paymentMethod).toLowerCase();
    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
        return next(new AppError('Invalid payment method', 400));
    }

    const interval = String(planObj.interval || 'Monthly').toLowerCase();
    const durationMonths = interval === 'annual' ? 12 : interval === 'quarterly' ? 3 : 1;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const monthlyCredits = planObj.credits || 0;
    const maxVehicles = planObj.maxVehicles || 1;
    const rollover = planObj.rollover || 0;

    const planBenefits = [];
    (planObj.features || []).forEach((feature) => {
        const lower = String(feature).toLowerCase();
        if (/free wash|complimentary wash/.test(lower)) planBenefits.push('free_wash_monthly');
        if (/20%/.test(lower)) planBenefits.push('discount_20_percent');
        if (/30%|40%/.test(lower)) planBenefits.push('discount_30_percent');
        if (/priority/.test(lower)) planBenefits.push('priority_booking');
        if (/pickup|drop/.test(lower)) planBenefits.push('free_pickup_drop');
        if (/vip|support/.test(lower)) planBenefits.push('vip_support');
        if (/bonus|credit/.test(lower)) planBenefits.push('bonus_credits');
    });

    const apartmentService = await MasterData.findOne({
        type: 'SERVICE',
        isActive: true,
        $or: [
            { key: 'APARTMENT_WASH' },
            { 'metadata.path': '/apartments' },
            { 'metadata.id': 'apartment-wash' }
        ]
    }).lean();

    const servicePayload = isApartmentFlow ? {
        id: apartmentService?.metadata?.id || serviceId || 'apartment-wash',
        key: apartmentService?.key || serviceKey || 'APARTMENT_WASH',
        title: apartmentService?.title || 'Apartment Car Wash',
        path: apartmentService?.metadata?.path || '/apartments'
    } : undefined;

    const subscriptionPayload = {
        user: req.user.id,
        plan: planObj.name,
        startDate,
        endDate,
        autoRenew,
        benefits: [...new Set(planBenefits)],
        monthlyCredits,
        maxVehicles,
        rollover,
        price: {
            amount: planObj.price,
            currency: 'INR',
            billingCycle: interval === 'annual' ? 'yearly' : interval === 'quarterly' ? 'quarterly' : 'monthly'
        },
        paymentMethod: normalizedPaymentMethod,
        lastPaymentDate: new Date(),
        nextBillingDate: endDate,
        orderId: orderId || undefined,
        paymentId: paymentId || undefined
    };

    if (resolvedVehicleId) {
        subscriptionPayload.vehicle = resolvedVehicleId;
    }
    if (hubId) {
        subscriptionPayload.hub = hubId;
    }
    if (parkingProvided) {
        subscriptionPayload.parkingDetails = {
            basement: parkingDetails.basement,
            block: parkingDetails.block,
            pillar: parkingDetails.pillar,
            carModel: parkingDetails.carModel || undefined,
            carNumber: parkingDetails.carNumber || undefined
        };
    }
    if (slot) {
        subscriptionPayload.slot = slot;
    }
    if (servicePayload) {
        subscriptionPayload.service = servicePayload;
    }
    if (orderId || paymentId) {
        subscriptionPayload.paymentGateway = {
            provider: 'razorpay',
            orderId: orderId || undefined,
            paymentId: paymentId || undefined
        };
    }

    let subscription;
    let isRenewal = false;

    if (existingSubscription && normalize(existingSubscription.plan) === normalizedRequestedPlan) {
        // RENEWAL: Extend the existing subscription
        const currentEndDate = new Date(existingSubscription.endDate);
        currentEndDate.setMonth(currentEndDate.getMonth() + durationMonths);

        existingSubscription.endDate = currentEndDate;
        existingSubscription.paymentId = paymentId;
        existingSubscription.orderId = orderId;
        existingSubscription.lastPaymentDate = new Date();
        existingSubscription.status = 'active';

        if (subscriptionPayload.paymentGateway) {
            existingSubscription.paymentGateway = subscriptionPayload.paymentGateway;
        }

        subscription = await existingSubscription.save();
        isRenewal = true;
    } else {
        // NEW: Create a new subscription
        if (existingSubscription) {
            // Expire the previous one to avoid confusion
            existingSubscription.status = 'expired';
            await existingSubscription.save();
        }
        subscription = await Subscription.createSubscription(subscriptionPayload);
    }

    if (!isRenewal) {
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'stats.totalSubscriptions': 1 }
        });
    }

    await sendNotification(req.user.id, {
        title: isRenewal ? 'Subscription Renewed 🔄' : 'Subscription Activated ✨',
        message: `${planObj.name} ${isRenewal ? 'extended' : 'activated'} successfully.`,
        type: 'subscription',
        priority: 'medium'
    });

    res.status(201).json({
        status: 'success',
        message: 'Subscription created successfully',
        data: { subscription }
    });
});

// Cancel subscription
exports.cancelSubscription = catchAsync(async (req, res, next) => {
    const subscription = await Subscription.getActiveSubscription(req.user.id);

    if (!subscription) {
        return next(new AppError('No active subscription found', 404));
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    await sendNotification(req.user.id, {
        title: 'Subscription Cancelled',
        message: 'Your Clean2Wash Pass has been cancelled. You can resubscribe anytime.',
        type: 'subscription',
        priority: 'medium'
    });

    res.status(200).json({
        status: 'success',
        message: 'Subscription cancelled successfully',
        data: { subscription }
    });
});

// Pause subscription
exports.pauseSubscription = catchAsync(async (req, res, next) => {
    const subscription = await Subscription.getActiveSubscription(req.user.id);

    if (!subscription) {
        return next(new AppError('No active subscription found', 404));
    }

    if (subscription.status !== 'active') {
        return next(new AppError('Only active subscriptions can be paused', 400));
    }

    subscription.status = 'paused';
    await subscription.save();

    res.status(200).json({
        status: 'success',
        message: 'Subscription paused successfully',
        data: { subscription }
    });
});

// Resume subscription
exports.resumeSubscription = catchAsync(async (req, res, next) => {
    const subscription = await Subscription.findOne({
        user: req.user.id,
        status: 'paused',
        endDate: { $gte: new Date() } // Not yet expired
    });

    if (!subscription) {
        return next(new AppError('No paused subscription found or subscription has expired', 404));
    }

    subscription.status = 'active';
    await subscription.save();

    res.status(200).json({
        status: 'success',
        message: 'Subscription resumed successfully',
        data: { subscription }
    });
});

// Delete consumer account
exports.deleteAccount = catchAsync(async (req, res, next) => {
    const { password, confirmation } = req.body;

    if (!password || confirmation !== 'DELETE') {
        return next(new AppError('Password and confirmation text are required', 400));
    }

    // Verify password
    const consumer = await User.findById(req.user.id).select('+password');
    const isPasswordCorrect = await consumer.correctPassword(password, consumer.password);

    if (!isPasswordCorrect) {
        return next(new AppError('Incorrect password', 401));
    }

    // Cancel all active bookings
    await Booking.updateMany(
        {
            consumer: req.user.id,
            status: { $in: ['pending', 'confirmed', 'assigned'] }
        },
        { status: 'cancelled' }
    );

    // Deactivate vehicles
    await Vehicle.updateMany(
        { owner: req.user.id },
        { isActive: false }
    );

    // Deactivate consumer account
    await User.findByIdAndUpdate(req.user.id, { isActive: false });

    res.status(200).json({
        status: 'success',
        message: 'Account deleted successfully'
    });
});

