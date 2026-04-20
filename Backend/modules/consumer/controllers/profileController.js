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
const cloudinary = require('../../../utils/cloudinary');
const { logAction } = require('../../../utils/auditHelper');

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
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('Consumer not found', 404));

    // Update basic info
    if (name) user.name = name;
    if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: req.user.id } });
        if (existingEmail) return next(new AppError('Email is already taken', 400));
        user.email = email;
    }
    if (phone) {
        const existingPhone = await User.findOne({ phone, _id: { $ne: req.user.id } });
        if (existingPhone) return next(new AppError('Phone number is already taken', 400));
        user.phone = phone;
    }

    // Update profile address (Sync hook in User.js will handle propagation)
    if (profile && profile.address) {
        user.profile.address = {
            ...user.profile.address,
            ...profile.address
        };
    }

    // Update profile avatar
    if (profile && profile.avatar) {
        user.profile.avatar = profile.avatar;
    }

    await user.save();

    const updatedConsumer = await User.findById(req.user.id)
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

    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('Consumer not found', 404));

    user.profile.address = {
        street,
        city,
        state,
        pincode,
        coordinates,
        landmark
    };

    // ⚡ Trigger sync hook in User.js pre('save')
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Address updated successfully',
        data: {
            address: user.profile.address
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

// Submit KYC documents
exports.submitKYC = catchAsync(async (req, res, next) => {
    const { idType, documentId, documents } = req.body;

    if (!idType || !documents || !documents.front) {
        return next(new AppError('Please provide ID type and at least front image of the document', 400));
    }

    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('Consumer not found', 404));

    // Upload to Cloudinary if they are base64 strings
    let frontUrl = documents.front;
    let backUrl = documents.back;

    try {
        if (frontUrl && frontUrl.startsWith('data:image')) {
            const uploadRes = await cloudinary.uploadImage(frontUrl, `clean2wash/consumers/kyc/${user._id}`);
            frontUrl = uploadRes.secure_url;
        }

        if (backUrl && backUrl.startsWith('data:image')) {
            const uploadRes = await cloudinary.uploadImage(backUrl, `clean2wash/consumers/kyc/${user._id}`);
            backUrl = uploadRes.secure_url;
        }
    } catch (uploadError) {
        return next(new AppError('Failed to upload KYC documents securely. Please try again.', 500));
    }

    const previousKycStatus = user.kyc?.status || 'none';

    user.kyc = {
        status: 'pending',
        idType,
        documentId,
        documents: {
            front: frontUrl,
            back: backUrl
        },
        submittedAt: new Date()
    };

    await user.save();

    // Log the action for administrative security tracking
    await logAction({
        userId: user._id,
        action: 'SUBMIT_KYC',
        resource: 'User',
        resourceId: user._id,
        oldValue: { status: previousKycStatus },
        newValue: { status: 'pending', idType, documentId },
        req,
        metadata: { info: 'Consumer submitted KYC for identity verification' }
    });

    // Notify user
    await sendNotification(req.user.id, {
        title: 'KYC Submitted 🛡️',
        message: 'Your documents have been submitted for verification. We will review them within 24 hours.',
        type: 'verification',
        priority: 'medium'
    });

    // 🕊️ Production-Grade Guard: Alert Admin Verification Desk
    await sendAdminNotification({
        title: 'New KYC Verification Request 🛡️',
        message: `${user.name} has submitted documents (${idType}) for identity verification.`,
        type: 'verification',
        priority: 'high',
        actionUrl: `/admin/users`,
        metaData: { userId: user._id, idType }
    });

    res.status(200).json({
        status: 'success',
        message: 'KYC submitted successfully',
        data: { kyc: user.kyc }
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

