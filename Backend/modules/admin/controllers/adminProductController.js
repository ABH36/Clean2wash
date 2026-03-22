const ProductOrder = require('../../../models/ProductOrder');
const Product = require('../../../models/Product');
const User = require('../../../models/User');
const AppError = require('../../../utils/AppError');
const auditHelper = require('../../../utils/auditHelper');
const mongoose = require('mongoose');

/**
 * @desc    Get global product sales stats for Admin
 * @route   GET /api/admin/products/stats
 */
exports.getProductStats = async (req, res, next) => {
    try {
        const stats = await ProductOrder.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$payment.amount' },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: '$payment.amount' }
                }
            }
        ]);

        const vendorPerformance = await ProductOrder.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.vendor',
                    totalSales: { $sum: 1 },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'vendorInfo'
                }
            },
            { $unwind: '$vendorInfo' },
            {
                $project: {
                    vendorName: '$vendorInfo.name',
                    studioName: '$vendorInfo.profile.studioName',
                    totalSales: 1,
                    revenue: 1
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                overview: stats[0] || { totalRevenue: 0, totalOrders: 0 },
                vendorPerformance
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get master inventory across all studios
 * @route   GET /api/admin/products/inventory
 */
exports.getMasterInventory = async (req, res, next) => {
    try {
        const lowStockThreshold = 10;

        const products = await Product.find()
            .populate('vendor', 'name profile.studioName')
            .select('name category price stock vendor');

        const inventory = products.map(p => ({
            id: p._id,
            name: p.name,
            vendor: p.vendor?.profile?.studioName || 'Unknown',
            stock: p.stock,
            price: p.price,
            isLowStock: p.stock < lowStockThreshold
        }));

        res.status(200).json({
            status: 'success',
            results: inventory.length,
            data: { inventory }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Handle complex dispute (Manual Refund/Override)
 * @route   POST /api/admin/products/resolve-dispute
 */
exports.resolveProductDispute = async (req, res, next) => {
    try {
        const { orderId, itemId, action, refundAmount } = req.body;

        const order = await ProductOrder.findById(orderId);
        if (!order) return next(new AppError('Order not found', 404));

        const item = order.items.id(itemId);
        if (!item) return next(new AppError('Item not found', 404));

        if (action === 'manual_refund') {
            const { executeWalletTransaction } = require('../../../utils/walletHelper');

            await executeWalletTransaction(
                order.consumer,
                refundAmount || item.price * item.quantity,
                'credit',
                {
                    category: 'REFUND',
                    description: `Admin Manual Refund for Order ${orderId}`,
                    referenceId: orderId,
                    referenceType: 'product_order'
                }
            );

            item.status = 'cancelled';
        }

        await order.save();

        // Audit Log
        await auditHelper.logAction({
            userId: req.user.id,
            action: 'DISPUTE_RESOLVED',
            resource: 'ProductOrder',
            resourceId: orderId,
            newValue: { itemId, action, refundAmount },
            req,
            metadata: { note: 'Manual Resolution by Admin' }
        });

        res.status(200).json({
            status: 'success',
            message: `Dispute resolved with action: ${action}`
        });
    } catch (error) {
        next(error);
    }
};
