const ProductOrder = require('../../../models/ProductOrder');
const Product = require('../../../models/Product');
const User = require('../../../models/User');
const Promotion = require('../../../models/Promotion');
const { sendNotification } = require('../../../utils/notificationService');
const socketService = require('../../../socketService');
const mongoose = require('mongoose');
const auditHelper = require('../../../utils/auditHelper');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// Create Product Order
exports.createOrder = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, pricing, paymentMethod, shippingAddress, razorpayOrderId, couponCode } = req.body;

        if (!items || items.length === 0) {
            return next(new AppError('No items in order', 400));
        }

        const enrichedItems = [];
        let subtotal = 0;

        // 1. Validate and Decrement Stock (Atomic)
        const inventoryHelper = require('../../../utils/inventoryHelper');
        await inventoryHelper.decrementStock(items, req.user.id, req, session);

        for (const item of items) {
            const product = await Product.findById(item.product).session(session);

            enrichedItems.push({
                product: product._id,
                name: product.name,
                price: product.salePrice || product.price,
                quantity: item.quantity,
                vendor: product.vendor,
                status: 'pending'
            });

            subtotal += (product.salePrice || product.price) * item.quantity;
        }

        // --- COUPON VALIDATION ---
        let discountAmount = 0;
        let appliedCouponRecord = null;

        if (couponCode) {
            const promo = await Promotion.findOne({
                code: couponCode.toUpperCase(),
                status: 'Active',
                type: 'Coupons'
            }).session(session);

            if (!promo) {
                throw new AppError('Invalid or expired coupon code.', 400);
            }

            // Check if user already used this coupon
            const user = await User.findById(req.user.id).session(session);
            if (user.usedPromotions && user.usedPromotions.includes(promo._id)) {
                throw new AppError('You have already used this coupon.', 400);
            }

            // Calculate Discount
            const valNum = parseInt(promo.val?.replace(/\D/g, '')) || 0;
            if (promo.reductionType === 'Percentage') {
                discountAmount = Math.round((subtotal * valNum) / 100);
            } else if (promo.reductionType === 'Flat') {
                discountAmount = valNum;
            }

            appliedCouponRecord = {
                id: promo._id,
                code: promo.code,
                reductionType: promo.reductionType,
                value: promo.val,
                amount: discountAmount
            };

            // Limit discount to subtotal
            discountAmount = Math.min(discountAmount, subtotal);
        }

        const totalOrderAmount = Math.max(0, subtotal + (pricing.tax || 0) + (pricing.shipping || 0) - discountAmount);

        // 2. Create the Order
        const newOrder = await ProductOrder.create([{
            consumer: req.user.id,
            items: enrichedItems,
            pricing: {
                subtotal,
                tax: pricing.tax || 0,
                shipping: pricing.shipping || 0,
                discount: discountAmount,
                total: totalOrderAmount
            },
            payment: {
                method: paymentMethod,
                status: 'pending',
                razorpayOrderId
            },
            shippingAddress,
            status: 'pending'
        }], { session });

        // Record coupon usage
        if (appliedCouponRecord) {
            await User.findByIdAndUpdate(req.user.id, {
                $addToSet: { usedPromotions: appliedCouponRecord.id }
            }, { session });
        }

        await session.commitTransaction();
        session.endSession();

        // 2.5 Audit Log
        await auditHelper.logAction({
            userId: req.user.id,
            action: 'ORDER_CREATED',
            resource: 'ProductOrder',
            resourceId: newOrder[0]._id,
            newValue: newOrder[0],
            req,
            metadata: { total: newOrder[0].pricing.total }
        });

        // 3. Notify Admin & Vendor
        const io = socketService.getIO();
        io.to('admin_room').emit('new_product_order', {
            orderId: newOrder[0].orderId,
            total: newOrder[0].pricing.total
        });

        res.status(201).json({
            status: 'success',
            message: 'Order placed successfully',
            data: { order: newOrder[0] }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// Get My Orders
exports.getMyOrders = catchAsync(async (req, res, next) => {
    const orders = await ProductOrder.find({ consumer: req.user.id, isActive: true })
        .populate('items.product', 'name image category')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        data: { orders }
    });
});

// Get Single Order Details
exports.getOrderDetails = catchAsync(async (req, res, next) => {
    const order = await ProductOrder.findOne({
        _id: req.params.id,
        consumer: req.user.id,
        isActive: true
    }).populate('items.product items.vendor', 'name image category profile.studioName');

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { order }
    });
});

// Update Order Status (For Webhook/Manual) -- Internal use
exports.updateOrderStatusInternal = async (orderId, updates) => {
    try {
        const order = await ProductOrder.findByIdAndUpdate(orderId, updates, { new: true });
        if (order) {
            // Socket emission
            socketService.emitToRoom(order.consumer.toString(), 'order_status_updated', {
                orderId: order._id,
                status: order.status
            });
        }
        return order;
    } catch (err) {
        console.error('Internal order update failed:', err);
    }
};

// Verify Order Payment
exports.verifyOrderPayment = catchAsync(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const crypto = require('crypto');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new AppError('Payment details missing', 400));
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'GkxKRQ2B0U63BKBoayuugS3D';
    const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generated_signature !== razorpay_signature) {
        return next(new AppError('Invalid signature', 400));
    }

    const order = await ProductOrder.findByIdAndUpdate(
        orderId,
        {
            $set: {
                'payment.status': 'paid',
                'payment.transactionId': razorpay_payment_id,
                'payment.razorpayPaymentId': razorpay_payment_id,
                'payment.razorpaySignature': razorpay_signature,
                status: 'processing'
            },
            $push: {
                history: { status: 'processing', note: 'Payment verified successfully.' }
            }
        },
        { new: true }
    );

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    // 1. Increment salesCount for all products in the order
    const Product = require('../../../models/Product');
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { salesCount: item.quantity } });
    }

    // 2. Automate Fulfillment: Broadcast pickup for EACH item to Captains
    const { broadcastProductPickup } = require('../../vendor/controllers/productLogisticsController');
    
    for (const item of order.items) {
        try {
            // Mocking req for broadcast function
            const mockReq = {
                params: { orderId: order._id, itemId: item._id },
                user: { _id: item.vendor } // Acting as the vendor
            };
            const mockRes = {
                status: () => ({ json: () => {} })
            };
            await broadcastProductPickup(mockReq, mockRes);
        } catch (bridgeErr) {
            console.error(`Automation Bridge Failure for Item ${item._id}:`, bridgeErr);
        }
    }

    // Notify user
    await sendNotification(req.user.id, {
        title: 'Order Confirmed! 📦',
        message: `Your payment was successful. Order #${order.orderId} is now being processed.`,
        type: 'payment',
        priority: 'medium'
    });


    res.status(200).json({
        status: 'success',
        message: 'Payment verified and order confirmed',
        data: { order }
    });
});
