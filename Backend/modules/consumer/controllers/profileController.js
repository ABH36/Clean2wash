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

// Create subscription
exports.createSubscription = async (req, res) => {
    try {
        const { 
            plan: planId, 
            paymentMethod, 
            autoRenew = false,
            vehicleId,
            hubId,
            parkingDetails,
            slot,
            paymentId,
            orderId
        } = req.body;

        if (!planId || !paymentMethod) {
            return res.status(400).json({
                status: 'fail',
                message: 'Plan and payment method are required'
            });
        }

        // Check if user already has active subscription
        const existingSubscription = await Subscription.getActiveSubscription(req.user.id);
        if (existingSubscription) {
            return res.status(400).json({
                status: 'fail',
                message: 'You already have an active subscription'
            });
        }

        // Fetch plan data dynamically
        const SubscriptionPlan = require('../../../models/SubscriptionPlan');
        const planObj = await SubscriptionPlan.findById(planId);
        
        if (!planObj) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid subscription plan'
            });
        }

        let durationMonths = 1;
        if (planObj.interval === 'Annual') durationMonths = 12;
        else if (planObj.interval === 'Quarterly') durationMonths = 3;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Map benefits from plan features
        const benefits = planObj.features || [];

        const subscription = await Subscription.createSubscription({
            user: req.user.id,
            plan: planObj.name,
            vehicle: vehicleId,
            hub: hubId,
            parkingDetails,
            slot,
            startDate,
            endDate,
            autoRenew,
            benefits: benefits.filter(b => [
                'free_wash_monthly', 'discount_20_percent', 'discount_30_percent',
                'priority_booking', 'free_pickup_drop', 'vip_support', 'bonus_credits'
            ].includes(b)),
            monthlyCredits: planObj.credits || 0,
            price: {
                amount: planObj.price,
                currency: 'INR',
                billingCycle: planObj.interval?.toLowerCase() || 'monthly'
            },
            paymentMethod,
            lastPaymentDate: new Date(),
            nextBillingDate: endDate,
            paymentId,
            orderId
        });

        // Update user stats
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'stats.totalSubscriptions': 1 }
        });

        res.status(201).json({
            status: 'success',
            message: 'Subscription created successfully',
            data: { subscription }
        });

    } catch (error) {
        console.error('Error in createSubscription:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create subscription. Please try again.'
        });
    }
};

// --- Trusted Contacts ---

// Get trusted contacts
exports.getTrustedContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('profile.trustedContacts');
        res.status(200).json({
            status: 'success',
            data: {
                contacts: user.profile.trustedContacts || []
            }
        });
    } catch (error) {
        console.error('Error in getTrustedContacts:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get trusted contacts' });
    }
};

// Add trusted contact
exports.addTrustedContact = async (req, res) => {
    try {
        const { name, phone, relation } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ status: 'fail', message: 'Name and phone are required' });
        }

        const user = await User.findById(req.user.id);

        // Limit to 5 contacts
        if (user.profile.trustedContacts.length >= 5) {
            return res.status(400).json({ status: 'fail', message: 'Maximum 5 trusted contacts allowed' });
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
    } catch (error) {
        console.error('Error in addTrustedContact:', error);
        res.status(500).json({ status: 'error', message: 'Failed to add trusted contact' });
    }
};

// Remove trusted contact
exports.removeTrustedContact = async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error in removeTrustedContact:', error);
        res.status(500).json({ status: 'error', message: 'Failed to remove trusted contact' });
    }
};

// Get consumer profile
exports.getProfile = async (req, res) => {
    try {
        const consumer = await User.findById(req.user.id)
            .populate('vehicles', 'brand model type plate image isPrimary')
            .populate('primaryVehicle', 'brand model type plate image')
            .populate('subscription');

        if (!consumer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Consumer not found'
            });
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

    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get profile. Please try again.'
        });
    }
};

// Update consumer profile
exports.updateProfile = async (req, res) => {
    try {
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
                return res.status(400).json({
                    status: 'fail',
                    message: 'Email is already taken by another user'
                });
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
                return res.status(400).json({
                    status: 'fail',
                    message: 'Phone number is already taken by another user'
                });
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

    } catch (error) {
        console.error('Error in updateProfile:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'fail',
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile. Please try again.'
        });
    }
};

// Update consumer address
exports.updateAddress = async (req, res) => {
    try {
        const { street, city, state, pincode, coordinates, landmark } = req.body;

        if (!street || !city || !state || !pincode) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide all required address fields'
            });
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

    } catch (error) {
        console.error('Error in updateAddress:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update address. Please try again.'
        });
    }
};

// Update consumer avatar
exports.updateAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({
                status: 'fail',
                message: 'Avatar URL is required'
            });
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

    } catch (error) {
        console.error('Error in updateAvatar:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update avatar. Please try again.'
        });
    }
};

// Get consumer statistics
exports.getStats = async (req, res) => {
    try {
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

    } catch (error) {
        console.error('Error in getStats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get statistics. Please try again.'
        });
    }
};

// Get consumer wallet
exports.getWallet = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;

        // Get consumer with wallet info
        const consumer = await User.findById(req.user.id)
            .select('wallet');

        if (!consumer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Consumer not found'
            });
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

    } catch (error) {
        console.error('Error in getWallet:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get wallet information. Please try again.'
        });
    }
};

// Add money to wallet
exports.addToWallet = async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid amount'
            });
        }

        // Get current consumer
        const consumer = await User.findById(req.user.id);
        if (!consumer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Consumer not found'
            });
        }

        if (!consumer.wallet) {
            consumer.wallet = { balance: 0, lastUpdated: new Date() };
        }

        const balanceBefore = consumer.wallet.balance || 0;
        const balanceAfter = balanceBefore + amount;
        consumer.wallet.balance = balanceAfter;
        consumer.wallet.lastUpdated = new Date();
        await consumer.save({ validateBeforeSave: false });

        // Create wallet transaction
        const transaction = await WalletTransaction.createTransaction({
            user: req.user.id,
            type: 'credit',
            amount,
            description: `Wallet recharge of ₹${amount}`,
            category: 'WALLET_RECHARGE',
            paymentMethod,
            balanceBefore,
            balanceAfter,
            status: 'completed'
        });

        // TODO: Process payment with payment gateway
        // TODO: Send confirmation notification

        // Send notification
        await sendNotification(req.user.id, {
            title: 'Money Added to Wallet 💰',
            message: `₹${amount} has been successfully credited to your wallet.`,
            type: 'payment',
            priority: 'medium',
            metaData: { amount, transactionId: transaction._id }
        });

        res.status(200).json({
            status: 'success',
            message: `₹${amount} added to wallet successfully`,
            data: {
                transaction,
                newBalance: balanceAfter
            }
        });

    } catch (error) {
        console.error('Error in addToWallet:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add money to wallet. Please try again.'
        });
    }
};

// Get consumer notifications
exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, isRead, priority } = req.query;

        const notificationData = await Notification.getConsumerNotifications(
            req.user.id,
            { page, limit, type, isRead, priority }
        );

        res.status(200).json({
            status: 'success',
            data: notificationData
        });

    } catch (error) {
        console.error('Error in getNotifications:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get notifications. Please try again.'
        });
    }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            _id: notificationId,
            consumer: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                status: 'fail',
                message: 'Notification not found'
            });
        }

        await notification.markAsRead();

        res.status(200).json({
            status: 'success',
            message: 'Notification marked as read',
            data: { notification }
        });

    } catch (error) {
        console.error('Error in markNotificationRead:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to mark notification as read. Please try again.'
        });
    }
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Error in markAllNotificationsRead:', error);
        res.status(500).json({
            status: 'fail',
            message: 'Failed to mark all notifications as read. Please try again.'
        });
    }
};

// Clear all notifications
exports.clearNotifications = async (req, res) => {
    try {
        await Notification.clearAll(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'All notifications cleared successfully'
        });

    } catch (error) {
        console.error('Error in clearNotifications:', error);
        res.status(500).json({
            status: 'fail',
            message: 'Failed to clear notifications. Please try again.'
        });
    }
};

// Get subscription details
exports.getSubscription = async (req, res) => {
    try {
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

    } catch (error) {
        console.error('Error in getSubscription:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get subscription details. Please try again.'
        });
    }
};

// Create subscription
exports.createSubscription = async (req, res) => {
    try {
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
            return res.status(400).json({
                status: 'fail',
                message: 'Plan and payment method are required'
            });
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

        // Check if user already has active subscription
        const existingSubscription = await Subscription.getActiveSubscription(req.user.id);
        if (existingSubscription) {
            return res.status(400).json({
                status: 'fail',
                message: 'You already have an active subscription'
            });
        }

        const allPlans = await SubscriptionPlan.find({ isActive: true, status: 'Live' });
        const normalizedRequestedPlan = normalize(planId || planRaw);
        const planObj = allPlans.find((p) => {
            const byId = normalize(p._id) === normalizedRequestedPlan;
            const byName = normalize(p.name) === normalizedRequestedPlan;
            return byId || byName;
        });

        if (!planObj) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid subscription plan'
            });
        }

        let hub = null;
        if (hubId) {
            hub = await Hub.findOne({ _id: hubId, isActive: true });
            if (!hub) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Selected apartment society is not available'
                });
            }
        }

        if (resolvedVehicleId) {
            const vehicle = await Vehicle.findOne({
                _id: resolvedVehicleId,
                owner: req.user.id,
                isActive: true
            });

            if (!vehicle) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Selected vehicle is invalid'
                });
            }
        }

        if (isApartmentFlow) {
            if (!hubId) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Apartment society selection is required'
                });
            }

            if (!parkingDetails?.basement || !parkingDetails?.block || !parkingDetails?.pillar) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Basement, block and pillar details are required for Apartment Wash'
                });
            }

            if (!slot || !['morning', 'afternoon', 'evening', 'night'].includes(slot)) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Valid apartment slot is required'
                });
            }
        }

        const allowedPaymentMethods = ['card', 'upi', 'wallet', 'netbanking', 'razorpay'];
        const normalizedPaymentMethod = String(paymentMethod).toLowerCase();
        if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid payment method'
            });
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

        const subscription = await Subscription.createSubscription(subscriptionPayload);

        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'stats.totalSubscriptions': 1 }
        });

        await sendNotification(req.user.id, {
            title: 'Subscription Activated',
            message: `${planObj.name} activated successfully.`,
            type: 'subscription',
            priority: 'medium'
        });

        res.status(201).json({
            status: 'success',
            message: 'Subscription created successfully',
            data: { subscription }
        });

    } catch (error) {
        console.error('Error in createSubscription:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create subscription. Please try again.'
        });
    }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.getActiveSubscription(req.user.id);

        if (!subscription) {
            return res.status(404).json({
                status: 'fail',
                message: 'No active subscription found'
            });
        }

        subscription.status = 'cancelled';
        subscription.autoRenew = false;
        await subscription.save();

        const { sendNotification } = require('../../../utils/notificationService');
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

    } catch (error) {
        console.error('Error in cancelSubscription:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to cancel subscription. Please try again.'
        });
    }
};

// Pause subscription
exports.pauseSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.getActiveSubscription(req.user.id);

        if (!subscription) {
            return res.status(404).json({
                status: 'fail',
                message: 'No active subscription found'
            });
        }

        if (subscription.status !== 'active') {
            return res.status(400).json({
                status: 'fail',
                message: 'Only active subscriptions can be paused'
            });
        }

        subscription.status = 'paused';
        await subscription.save();

        res.status(200).json({
            status: 'success',
            message: 'Subscription paused successfully',
            data: { subscription }
        });

    } catch (error) {
        console.error('Error in pauseSubscription:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to pause subscription. Please try again.'
        });
    }
};

// Resume subscription
exports.resumeSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            user: req.user.id,
            status: 'paused',
            endDate: { $gte: new Date() } // Not yet expired
        });

        if (!subscription) {
            return res.status(404).json({
                status: 'fail',
                message: 'No paused subscription found or subscription has expired'
            });
        }

        subscription.status = 'active';
        await subscription.save();

        res.status(200).json({
            status: 'success',
            message: 'Subscription resumed successfully',
            data: { subscription }
        });

    } catch (error) {
        console.error('Error in resumeSubscription:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to resume subscription. Please try again.'
        });
    }
};

// Delete consumer account
exports.deleteAccount = async (req, res) => {
    try {
        const { password, confirmation } = req.body;

        if (!password || confirmation !== 'DELETE') {
            return res.status(400).json({
                status: 'fail',
                message: 'Password and confirmation text are required'
            });
        }

        // Verify password
        const consumer = await User.findById(req.user.id).select('+password');
        const isPasswordCorrect = await consumer.correctPassword(password, consumer.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect password'
            });
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

    } catch (error) {
        console.error('Error in deleteAccount:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete account. Please try again.'
        });
    }
};

