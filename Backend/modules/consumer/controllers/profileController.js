const Consumer = require('../models/Consumer');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');

// Get consumer profile
exports.getProfile = async (req, res) => {
    try {
        const consumer = await Consumer.findById(req.consumer.id)
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
            const existingConsumer = await Consumer.findOne({ 
                email, 
                _id: { $ne: req.consumer.id } 
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
            const existingConsumer = await Consumer.findOne({ 
                phone, 
                _id: { $ne: req.consumer.id } 
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
                ...req.consumer.profile.address,
                ...profile.address
            };
        }

        // Update profile avatar
        if (profile && profile.avatar) {
            updateData['profile.avatar'] = profile.avatar;
        }

        const updatedConsumer = await Consumer.findByIdAndUpdate(
            req.consumer.id,
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

        const updatedConsumer = await Consumer.findByIdAndUpdate(
            req.consumer.id,
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

        const updatedConsumer = await Consumer.findByIdAndUpdate(
            req.consumer.id,
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
        const consumerId = req.consumer.id;

        // Get booking statistics
        const bookingStats = await Booking.getConsumerStats(consumerId);

        // Get vehicle count
        const vehicleCount = await Vehicle.countDocuments({
            owner: consumerId,
            isActive: true
        });

        // Get wallet balance
        const consumer = await Consumer.findById(consumerId).select('wallet');
        
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
            memberSince: req.consumer.createdAt,
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
        const consumer = await Consumer.findById(req.consumer.id)
            .select('wallet');

        if (!consumer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Consumer not found'
            });
        }

        // Get transaction history
        const transactionData = await WalletTransaction.getConsumerTransactions(
            req.consumer.id,
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
        const consumer = await Consumer.findById(req.consumer.id);
        if (!consumer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Consumer not found'
            });
        }

        const balanceBefore = consumer.wallet.balance;
        const balanceAfter = balanceBefore + amount;

        // Create wallet transaction
        const transaction = await WalletTransaction.createTransaction({
            consumer: req.consumer.id,
            type: 'credit',
            amount,
            description: `Wallet recharge of ₹${amount}`,
            category: 'wallet_recharge',
            paymentMethod,
            balanceBefore,
            balanceAfter,
            status: 'completed'
        });

        // TODO: Process payment with payment gateway
        // TODO: Send confirmation notification

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
            message: 'Failed to add money to wallet. Please try again.'
        });
    }
};

// Get consumer notifications
exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, isRead, priority } = req.query;
        
        const notificationData = await Notification.getConsumerNotifications(
            req.consumer.id,
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
            consumer: req.consumer.id
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
        await Notification.markAllAsRead(req.consumer.id);
        
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

// Get subscription details
exports.getSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.getActiveSubscription(req.consumer.id);
        
        if (!subscription) {
            return res.status(404).json({
                status: 'fail',
                message: 'No active subscription found'
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
        const { plan, paymentMethod, autoRenew = false } = req.body;

        if (!plan || !paymentMethod) {
            return res.status(400).json({
                status: 'fail',
                message: 'Plan and payment method are required'
            });
        }

        // Check if user already has active subscription
        const existingSubscription = await Subscription.getActiveSubscription(req.consumer.id);
        if (existingSubscription) {
            return res.status(400).json({
                status: 'fail',
                message: 'You already have an active subscription'
            });
        }

        // Plan configurations
        const planConfigs = {
            basic: {
                price: 299,
                duration: 1, // months
                benefits: ['discount_10_percent', 'priority_booking'],
                monthlyCredits: 2
            },
            premium: {
                price: 599,
                duration: 1,
                benefits: ['discount_20_percent', 'priority_booking', 'free_pickup_drop', 'bonus_credits'],
                monthlyCredits: 5
            },
            elite: {
                price: 999,
                duration: 1,
                benefits: ['free_wash_monthly', 'discount_30_percent', 'priority_booking', 'free_pickup_drop', 'vip_support', 'bonus_credits'],
                monthlyCredits: 10
            }
        };

        const config = planConfigs[plan];
        if (!config) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid subscription plan'
            });
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + config.duration);

        const subscription = await Subscription.createSubscription({
            consumer: req.consumer.id,
            plan,
            startDate,
            endDate,
            autoRenew,
            benefits: config.benefits,
            monthlyCredits: config.monthlyCredits,
            price: {
                amount: config.price,
                currency: 'INR',
                billingCycle: 'monthly'
            },
            paymentMethod,
            lastPaymentDate: new Date(),
            nextBillingDate: endDate
        });

        // TODO: Process payment
        // TODO: Send confirmation notification

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
        const subscription = await Subscription.getActiveSubscription(req.consumer.id);
        
        if (!subscription) {
            return res.status(404).json({
                status: 'fail',
                message: 'No active subscription found'
            });
        }

        subscription.status = 'cancelled';
        subscription.autoRenew = false;
        await subscription.save();

        // TODO: Send cancellation notification
        // TODO: Process refund if applicable

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
        const consumer = await Consumer.findById(req.consumer.id).select('+password');
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
                consumer: req.consumer.id,
                status: { $in: ['pending', 'confirmed', 'assigned'] }
            },
            { status: 'cancelled' }
        );

        // Deactivate vehicles
        await Vehicle.updateMany(
            { owner: req.consumer.id },
            { isActive: false }
        );

        // Deactivate consumer account
        await Consumer.findByIdAndUpdate(req.consumer.id, { isActive: false });

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
