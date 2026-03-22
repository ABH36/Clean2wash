const Booking = require('../../../models/Booking');
const ProductOrder = require('../../../models/ProductOrder');
const User = require('../../../models/User');
const walletHelper = require('../../../utils/walletHelper');
const referralService = require('../../../utils/referralService');
const { sendNotification } = require('../../../utils/notificationService');

// Get Staff tasks (assigned to them via vendor)
exports.getTasks = async (req, res) => {
    try {
        const staffId = req.user.id;

        // 1. Service Bookings
        const bookings = await Booking.find({
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ]
        })
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .sort({ createdAt: -1 });

        // 2. Product Orders (Items assigned to this staff)
        const productOrders = await ProductOrder.find({
            'items.fulfillment.agentId': staffId,
            isActive: true
        })
            .populate('consumer', 'name phone profile')
            .sort({ createdAt: -1 });

        // Merge and flatten product items for the staff
        const productTasks = [];
        productOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.fulfillment?.agentId?.toString() === staffId.toString()) {
                    productTasks.push({
                        _id: item._id, // item id
                        orderId: order._id,
                        orderNumber: order.orderId,
                        consumer: order.consumer,
                        product: item.product,
                        quantity: item.quantity,
                        price: item.price,
                        status: item.status,
                        fulfillment: item.fulfillment,
                        shippingAddress: order.shippingAddress,
                        isProduct: true,
                        createdAt: order.createdAt,
                        updatedAt: item.updatedAt || order.updatedAt
                    });
                }
            });
        });

        res.status(200).json({
            status: 'success',
            data: {
                tasks: bookings,
                productTasks: productTasks
            }
        });
    } catch (error) {
        console.error('Error fetching staff tasks:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch staff tasks' });
    }
};

// Get Dashboard Stats
exports.getDashboard = async (req, res) => {
    try {
        const staffId = req.user.id;
        // Service stats
        const bookings = await Booking.find({
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ]
        });

        // Product stats
        const productOrders = await ProductOrder.find({
            'items.fulfillment.agentId': staffId,
            isActive: true
        });

        let activeProductCount = 0;
        let completedProductCount = 0;

        productOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.fulfillment?.agentId?.toString() === staffId.toString()) {
                    if (['shipped', 'packing', 'processing'].includes(item.status)) activeProductCount++;
                    if (item.status === 'delivered') completedProductCount++;
                }
            });
        });

        const activeCount = bookings.filter(t => !['completed', 'cancelled'].includes(t.status)).length + activeProductCount;
        const completedCount = bookings.filter(t => t.status === 'completed').length + completedProductCount;
        const recentActivity = bookings.slice(0, 5); // Combined activity could be better but keeping simple for now

        res.status(200).json({
            status: 'success',
            data: {
                stats: {
                    activeTasks: activeCount,
                    completedTasks: completedCount,
                    rating: req.user.rating || 5.0,
                    recentActivity
                }
            }
        });
    } catch (error) {
        console.error('Error fetching staff dashboard:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch staff dashboard' });
    }
};

// Get Single Task Detail
exports.getTaskById = async (req, res) => {
    try {
        const staffId = req.user.id;
        const taskId = req.params.id;
        const booking = await Booking.findOne({
            _id: taskId,
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ]
        })
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .populate('provider', 'name businessName profile phone');

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Task not found or unauthorized' });
        }

        res.status(200).json({
            status: 'success',
            data: { task: booking }
        });
    } catch (error) {
        console.error('Error fetching staff task details:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch task details' });
    }
};

// Upload Proof Images (Cloudinary Interface)
exports.uploadProof = async (req, res) => {
    try {
        const { images, type } = req.body;
        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Auth-Failure: Missing media payload' });
        }

        const cloudinary = require('../../../utils/cloudinary');
        const uploadPromises = images.map(img =>
            cloudinary.uploadImage(img, `clean2wash/staff/proofs/${req.user.id}/${type}`)
        );

        const results = await Promise.all(uploadPromises);
        const imageUrls = results.map(r => r.secure_url);

        res.status(200).json({
            status: 'success',
            data: { urls: imageUrls }
        });
    } catch (error) {
        console.error('Media Handshake Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to synchronize media with cloud' });
    }
};

// Update Task Status
exports.updateTaskStatus = async (req, res) => {
    try {
        const staffId = req.user.id;
        const taskId = req.params.id;
        const { status, pin, photos } = req.body;

        const validStatuses = [
            'pending', 'confirmed', 'assigned', 'pickup-assigned',
            'en_route', 'arrived', 'picked-up', 'at-studio', 'in_progress', 'washing',
            'quality-check', 'ready-for-delivery', 'delivery-assigned',
            'completed', 'cancelled'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid Terminal Status Code' });
        }

        const booking = await Booking.findOne({
            _id: taskId,
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ]
        }).populate('consumer', 'name phone');

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Resource Locked or Not Found' });
        }

        // Security PIN logic
        // For studio pickups, PIN is required at 'picked-up' (custody transfer from consumer)
        if (['arrived', 'picked-up', 'at-studio', 'completed'].includes(status)) {
            if (!pin) return res.status(400).json({ status: 'error', message: 'Security PIN verification required' });
            if (pin !== booking.securityPin) return res.status(400).json({ status: 'error', message: 'Invalid Security PIN' });
        }

        if (status === 'at-studio' && photos) {
            booking.serviceImages.before = photos;
            booking.serviceImages.capturedAt = new Date();
        }

        if (status === 'completed') {
            if (photos) booking.serviceImages.after = photos;
            booking.payment.status = 'paid';
            // Calculate 10% commission for staff member
            const commission = Math.round(booking.pricing.totalAmount * 0.1);
            booking.payment.commission = commission;

            // Credit Staff Wallet (Phase 4)
            try {
                await walletHelper.executeWalletTransaction({
                    user: staffId,
                    amount: commission,
                    type: 'credit',
                    category: 'COMMISSION',
                    description: `Commission for Service #${booking.bookingId || booking._id}`,
                    referenceId: booking._id,
                    referenceType: 'booking'
                });

                // Trigger Referral Reward (Phase 4)
                await referralService.processReferralReward(booking.consumer._id, booking._id);
            } catch (walletError) {
                console.error('Financial Handshake Failure:', walletError);
                // We proceed with saving the booking status even if wallet fails for now, 
                // but ideally this should be atomic. 
                // Since this is not in a session here, we at least log it.
            }
        }

        booking.status = status;
        const now = new Date();

        // --- LOGISTIC TIMELINE SYNC ---
        if (status === 'en_route') {
            booking.tracking.startedAt = now;
            booking.tracking.custodyStatus = 'at-consumer';
        }
        if (status === 'arrived') {
            booking.tracking.arrivedAt = now;
            // Notify consumer that Specialist is at their location
            if (booking.consumer && booking.location?.type === 'Apartment') {
                const { sendNotification: societyNotify } = require('../../../utils/notificationService');
                await societyNotify(booking.consumer._id, {
                    title: 'Specialist Arrived! 🛞',
                    message: `Our specialist is now at ${booking.location.address?.society || 'your society'}. Your wash will begin shortly.`,
                    type: 'status-update'
                });
            }
        }
        if (status === 'picked-up') {
            booking.tracking.custodyStatus = 'with-specialist';
            // Capture handover coordinates if available
            if (req.body.location) {
                booking.tracking.pickupLocation = {
                    lat: req.body.location.lat,
                    lng: req.body.location.lng,
                    capturedAt: now
                };
            }
        }
        if (status === 'at-studio') {
            booking.tracking.washStartedAt = now;
            booking.tracking.custodyStatus = 'at-studio';
        }
        if (status === 'completed') {
            booking.tracking.completedAt = now;
            booking.tracking.custodyStatus = 'returned';
        }

        await booking.save();

        // Real-time Socket Sync
        const socketService = require('../../../socketService');
        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status,
            tracking: booking.tracking
        });

        // ➕ Phase 3: Global Notification Sync
        if (booking.consumer) {
            io.to(booking.consumer._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: booking.status,
                tracking: booking.tracking,
                message: `Service status: ${statusMap[status] || status}`
            });
        }

        // Notify Consumer
        const { sendNotification } = require('../../../utils/notificationService');
        const statusMap = {
            'en_route': 'On the way to your location!',
            'arrived': 'Staff has arrived!',
            'at-studio': 'Your car has reached our Hub!',
            'completed': 'Service finalized! Check your profile for photos.'
        };

        if (statusMap[status] && booking.consumer) {
            await sendNotification(booking.consumer._id, {
                title: 'Service Update 🚗',
                message: statusMap[status],
                type: 'status-update'
            });
        }

        res.status(200).json({ status: 'success', data: { task: booking } });
    } catch (error) {
        console.error('Status Update Error:', error);
        res.status(500).json({ status: 'error', message: 'Operation Timing Failure' });
    }
};

// Update Specialist Live Location (Telemetry Pulse)
exports.updateLocation = async (req, res) => {
    try {
        const staffId = req.user.id;
        const taskId = req.params.id;
        const { lat, lng } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ status: 'error', message: 'Telemetry Pulse Corrupted: Missing Coordinates' });
        }

        const booking = await Booking.findOneAndUpdate(
            {
                _id: taskId,
                $or: [{ pickupStaff: staffId }, { deliveryStaff: staffId }, { assignedStaff: staffId }]
            },
            {
                'tracking.currentLocation': {
                    lat,
                    lng,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Mission Context Locked or Not Found' });
        }

        // Broadcast to consumers in real-time
        const socketService = require('../../../socketService');
        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('specialist_location_pulse', {
            bookingId: booking._id,
            location: { lat, lng },
            timestamp: new Date()
        });

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Telemetry Sync Error:', error);
        res.status(500).json({ status: 'error', message: 'Telemetry Handshake Failure' });
    }
};

// --- FINANCIAL PERFORMANCE ---

// Get Staff Earnings Ledger
exports.getEarnings = async (req, res) => {
    try {
        const staffId = req.user.id;
        const bookings = await Booking.find({
            status: 'completed',
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ]
        }).sort({ createdAt: -1 });

        const totalCommission = bookings.reduce((sum, b) => sum + (b.payment?.commission || 0), 0);
        const weeklyEarnings = totalCommission; // Simplification for now

        res.status(200).json({
            status: 'success',
            data: {
                ledger: bookings.map(b => ({
                    id: b._id,
                    orderId: b.bookingId,
                    amount: b.payment?.commission || 0,
                    totalBill: b.pricing.totalAmount,
                    date: b.createdAt,
                    service: b.service.name
                })),
                stats: {
                    totalEarnings: totalCommission,
                    weeklyEarnings,
                    tasksCompleted: bookings.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to access financial protocols' });
    }
};

// --- AVAILABILITY CONTROLS ---

// Toggle Online/Offline Status
exports.toggleOnlineStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        user.isOnline = !user.isOnline;
        await user.save();

        res.status(200).json({
            status: 'success',
            data: { isOnline: user.isOnline }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update terminal availability' });
    }
};

// --- NOTIFICATIONS ---

exports.getNotifications = async (req, res) => {
    try {
        const Notification = require('../../../models/Notification');
        const notifications = await Notification.find({ staff: req.user.id }).sort({ createdAt: -1 }).limit(50);
        res.status(200).json({ status: 'success', data: { notifications } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Logs unavailable' });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const Notification = require('../../../models/Notification');
        await Notification.findOneAndUpdate({ _id: req.params.id, staff: req.user.id }, { isRead: true });
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Sync failed' });
    }
};

exports.clearNotifications = async (req, res) => {
    try {
        const Notification = require('../../../models/Notification');
        await Notification.deleteMany({ staff: req.user.id });
        res.status(204).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Purge failed' });
    }
};

// Staff Commitment for Scheduled Slots (Phase 8)
exports.commitToSlot = async (req, res) => {
    try {
        const staffId = req.user.id;
        const taskId = req.params.id;

        const booking = await Booking.findOne({
            _id: taskId,
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ],
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Task Lock Exception: Assignment not found' });
        }

        // Active commitment update
        booking.isStaffCommitted = true;
        booking.activityLog = booking.activityLog || [];
        booking.activityLog.push({
            status: 'staff_committed',
            timestamp: new Date(),
            note: `Staff ${req.user.name} committed to slot`
        });

        await booking.save();

        // Broadcast to consumer/vendor
        const socketService = require('../../../socketService');
        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            isStaffCommitted: true
        });

        // ➕ Phase 3: Global Notification Sync
        if (booking.consumer) {
            io.to(booking.consumer.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                isStaffCommitted: true,
                message: `Our specialist ${req.user.name} has committed to your scheduled slot.`
            });
        }

        res.status(200).json({ status: 'success', message: 'Mission Slot Acknowledged & Secured' });
    } catch (error) {
        console.error('Commitment Failure:', error);
        res.status(500).json({ status: 'error', message: 'Lock synchronization failed' });
    }
};

// Handle Missed Wash (Car Not Found / Parking Issue)
exports.handleMissedWash = async (req, res) => {
    try {
        const staffId = req.user.id;
        const taskId = req.params.id;
        const { reason, photos } = req.body;

        const booking = await Booking.findOne({
            _id: taskId,
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ],
            isActive: true
        }).populate('consumer', 'name wallet');

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        // Logic: Mark as cancelled but with clear reason
        booking.status = 'cancelled';
        booking.notes.internal = `Missed Wash Report: ${reason || 'Car Not Found'}`;
        if (photos) {
            booking.serviceImages.before = photos; // Proof of car not being there
        }

        // If it was a subscription wash, we should ideally refund or rollover
        // Implementation: Refund current wash price to wallet for simple rollover
        if (booking.payment.method === 'subscription') {
            const refundAmount = booking.pricing.totalAmount || 0;
            if (refundAmount > 0 && booking.consumer) {
                const User = require('../../../models/User');
                const WalletTransaction = require('../../../models/WalletTransaction');

                const consumer = await User.findById(booking.consumer._id);
                if (consumer) {
                    const { executeWalletTransaction } = require('../../../utils/walletHelper');

                    await executeWalletTransaction(
                        booking.consumer._id,
                        refundAmount,
                        'credit',
                        {
                            category: 'REFUND',
                            description: `Refund: Missed Apartment Wash (#${booking.bookingId})`,
                            referenceId: booking._id,
                            referenceType: 'booking'
                        }
                    );
                }
            }
        }

        await booking.save();

        // Broadcast to consumer
        const socketService = require('../../../socketService');
        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: 'cancelled',
            message: `Wash missed: ${reason || 'Car not found in parking'}`
        });

        // ➕ Phase 3: Global Notification Sync
        if (booking.consumer) {
            io.to(booking.consumer._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: 'cancelled',
                message: `Wash missed: ${reason || 'Car not found in parking'}`
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Missed wash reported and consumer refunded successfully'
        });

    } catch (error) {
        console.error('Missed Wash Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process missed wash report' });
    }
};

// --- PRODUCT ORDER LOGISTICS (Phase 32) ---

exports.updateProductItemStatus = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { status } = req.body;
        const staffId = req.user.id;
        const ProductOrder = require('../../../models/ProductOrder');

        const order = await ProductOrder.findOne({
            _id: orderId,
            'items._id': itemId,
            'items.fulfillment.agentId': staffId
        });

        if (!order) return res.status(404).json({ status: 'error', message: 'Task not found or unauthorized' });

        const item = order.items.id(itemId);
        item.status = status;

        if (status === 'shipped') item.fulfillment.dispatchedAt = new Date();
        if (status === 'delivered') item.fulfillment.deliveredAt = new Date();

        order.history.push({
            status,
            timestamp: new Date(),
            note: `Item status updated to ${status} by staff ${req.user.name}`
        });

        await order.save();

        // Notify via socket
        const socketService = require('../../../socketService');
        const io = socketService.getIO();
        if (io) {
            io.to(order._id.toString()).emit('product_order_status_updated', {
                orderId: order._id,
                itemId: item._id,
                status
            });
        }

        res.status(200).json({ status: 'success', data: { item } });
    } catch (error) {
        console.error('Error updating product item status:', error);
        res.status(500).json({ status: 'error', message: 'Operation failed' });
    }
};

exports.verifyProductItemPin = async (req, res) => {
    // We can reuse the logic from productLogisticsController
    const productLogisticsController = require('../../vendor/controllers/productLogisticsController');
    return productLogisticsController.verifyProductDeliveryPin(req, res);
};
