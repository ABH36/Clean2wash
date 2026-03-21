const notificationService = require('./notificationService');
const auditHelper = require('./auditHelper');
const mongoose = require('mongoose');

/**
 * Atomic decrement of stock with low-stock notification trigger
 */
exports.decrementStock = async (items, userId, req = null, session = null) => {
    const LOW_STOCK_THRESHOLD = 10;

    for (const item of items) {
        const product = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true, session }
        );

        if (!product) {
            throw new Error(`Insufficient stock for product: ${item.name}`);
        }

        // Trigger low-stock notification if threshold reached
        if (product.stock < LOW_STOCK_THRESHOLD) {
            await notificationService.sendNotification({
                user: product.vendor,
                title: 'Low Stock Alert',
                message: `Your product "${product.name}" is running low on stock (${product.stock} remaining).`,
                type: 'inventory',
                priority: 'high'
            });
        }

        // Audit Log
        await auditHelper.logAction({
            userId,
            action: 'STOCK_DECREMENT',
            resource: 'Product',
            resourceId: product._id,
            oldValue: { stock: product.stock + item.quantity },
            newValue: { stock: product.stock },
            req,
            metadata: { reason: 'Order Placement', quantity: item.quantity }
        }, session);
    }
};

/**
 * Atomic increment of stock (for cancellations/returns)
 */
exports.incrementStock = async (items, userId, req = null, session = null) => {
    for (const item of items) {
        const product = await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session, new: true }
        );

        // Audit Log
        if (product) {
            await auditHelper.logAction({
                userId,
                action: 'STOCK_INCREMENT',
                resource: 'Product',
                resourceId: product._id,
                oldValue: { stock: product.stock - item.quantity },
                newValue: { stock: product.stock },
                req,
                metadata: { reason: 'Cancellation/Return', quantity: item.quantity }
            }, session);
        }
    }
};
