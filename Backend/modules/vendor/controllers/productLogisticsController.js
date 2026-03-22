const ProductOrder = require('../../../models/ProductOrder');
const User = require('../../../models/User');
const Captain = require('../../../models/Captain');
const socketService = require('../../../socketService');
const { sendNotification, sendVendorNotification, sendStaffNotification } = require('../../../utils/notificationService');
const inventoryHelper = require('../../../utils/inventoryHelper'); // Added
const auditHelper = require('../../../utils/auditHelper'); // Added
const mongoose = require('mongoose'); // Added

/**
 * Assign a delivery agent (Staff or Captain) to a specific product item
 */
exports.assignProductDeliveryAgent = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { agentId, agentType } = req.body; // agentType: 'staff' or 'captain'
        const vendorId = req.user._id;

        const order = await ProductOrder.findOne({
            _id: orderId,
            'items.vendor': vendorId,
            isActive: true
        });

        if (!order) {
            return res.status(404).json({ status: 'error', message: 'Product order not found' });
        }

        const itemIndex = order.items.findIndex(it => it._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Item not found in this order' });
        }

        const item = order.items[itemIndex];

        // 1. Verify Agent
        let agent;
        if (agentType === 'staff') {
            agent = await User.findOne({ _id: agentId, role: 'staff', 'profile.vendorId': vendorId });
            if (!agent) return res.status(404).json({ status: 'error', message: 'Staff member not found or not linked to your studio' });
        } else if (agentType === 'captain') {
            agent = await Captain.findById(agentId);
            if (!agent) return res.status(404).json({ status: 'error', message: 'Captain not found' });
        } else {
            return res.status(400).json({ status: 'error', message: 'Invalid agent type' });
        }

        // 2. Update Fulfillment Data
        item.fulfillment = {
            ...item.fulfillment,
            agentId: agent._id,
            agentModel: agentType === 'staff' ? 'User' : 'Captain',
            type: agentType,
            dispatchedAt: new Date()
        };
        item.status = 'shipped';

        await order.save();

        // 3. Notify Consumer via Socket & Push
        const io = socketService.getIO();
        if (io) {
            io.to(order._id.toString()).emit('product_order_status_updated', {
                orderId: order._id,
                itemId: item._id,
                status: 'shipped',
                agent: {
                    name: agent.name,
                    phone: agent.phone,
                    type: agentType
                }
            });
        }

        await sendNotification(order.consumer, {
            title: 'Package Dispatched! 📦',
            message: `Your item "${item.name}" is out for delivery by ${agent.name}.`,
            type: 'product_order',
            priority: 'medium'
        });

        // 4. Notify Agent
        if (agentType === 'staff') {
            await sendStaffNotification(agent._id, {
                title: 'New Delivery Task 🚚',
                message: `Deliver ${item.quantity}x ${item.name} to ${order.shippingAddress.city}. Order ID: ${order.orderId}`,
                type: 'delivery',
                metaData: { orderId: order._id, itemId: item._id }
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Delivery agent assigned successfully',
            data: { item: order.items[itemIndex] }
        });

    } catch (error) {
        console.error('Error assigning product delivery agent:', error);
        res.status(500).json({ status: 'error', message: 'Failed to assign agent' });
    }
};

/**
 * Verify Handover PIN to complete delivery
 */
exports.verifyProductDeliveryPin = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { pin } = req.body;
        const agentId = req.user._id; // Assuming agent is logged in (Staff or Captain)

        const order = await ProductOrder.findById(orderId);
        if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

        const itemIndex = order.items.findIndex(it => it._id.toString() === itemId);
        if (itemIndex === -1) return res.status(404).json({ status: 'error', message: 'Item not found' });

        const item = order.items[itemIndex];

        // 1. Verify Agent Ownership
        if (item.fulfillment.agentId.toString() !== agentId.toString()) {
            return res.status(403).json({ status: 'error', message: 'You are not assigned to this delivery' });
        }

        // 2. Verify PIN
        if (item.fulfillment.deliveryPin !== pin) {
            return res.status(400).json({ status: 'error', message: 'Invalid Delivery PIN' });
        }

        // 3. Complete Delivery
        item.status = 'delivered';
        item.fulfillment.deliveredAt = new Date();

        // Push to history
        order.history.push({
            status: 'delivered',
            timestamp: new Date(),
            note: `Item ${item.name} delivered by ${req.user.name}`
        });

        // 4. Trigger Vendor Payout (Hardened Phase 1)
        const commissionHelper = require('../../../utils/commissionHelper');
        const { executeWalletTransaction } = require('../../../utils/walletHelper');

        const itemTotal = item.price * item.quantity;
        const { adminCut, providerPayout } = await commissionHelper.calculatePayout(itemTotal, 'vendor');

        // Use the centralized helper for atomic credit and logging
        await executeWalletTransaction(
            item.vendor,
            providerPayout,
            'credit',
            {
                category: 'PRODUCT_SALE',
                description: `Payout for ${item.name} (Order #${order.orderId})`,
                referenceId: order._id,
                referenceType: 'product_order'
            }
        );

        await sendVendorNotification(item.vendor, {
            title: 'Payment Credited! 🪙',
            message: `₹${providerPayout.toFixed(0)} credited for Order #${order.orderId}.`,
            type: 'payout',
            priority: 'high'
        });

        // 5. Finalize Order if all items delivered
        const allDelivered = order.items.every(it => it.status === 'delivered');
        if (allDelivered) {
            order.status = 'delivered';
        }

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Delivery completed and verified'
        });

    } catch (error) {
        console.error('Error verifying delivery PIN:', error);
        res.status(500).json({ status: 'error', message: 'Verification failed' });
    }
};

/**
 * Broadcast a product pickup to nearby platform captains
 */
exports.broadcastProductPickup = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const vendorId = req.user._id;

        const order = await ProductOrder.findOne({
            _id: orderId,
            'items._id': itemId,
            'items.vendor': vendorId,
            isActive: true
        }).populate('items.vendor', 'name profile location');

        if (!order) return res.status(404).json({ status: 'error', message: 'Order item not found' });

        const item = order.items.id(itemId);

        // Ensure not already assigned
        if (item.fulfillment?.agentId) {
            return res.status(400).json({ status: 'error', message: 'Already assigned to an agent' });
        }

        // Update item to reflect broadcast state
        item.status = 'processing'; // Or a specific 'pending_pickup' status
        item.fulfillment = {
            ...item.fulfillment,
            assignmentMethod: 'broadcast',
            broadcastAt: new Date()
        };

        await order.save();

        // Socket Broadcast to Captains
        const io = socketService.getIO();
        if (io) {
            // In a real app, we would use geofencing here. 
            // For now, we broadcast to all 'captains' room or similar.
            io.emit('new_product_broadcast', {
                orderId: order._id,
                itemId: item._id,
                orderNumber: order.orderId,
                productName: item.name,
                quantity: item.quantity,
                vendorName: req.user.name,
                pickupLocation: order.items.find(it => it._id.toString() === itemId)?.vendor?.location || req.user.location,
                deliveryLocation: order.shippingAddress,
                earnings: item.price * 0.1 // Just a placeholder for commission
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Pickup request broadcasted to platform captains'
        });

    } catch (error) {
        console.error('Error broadcasting product pickup:', error);
        res.status(500).json({ status: 'error', message: 'Broadcast failed' });
    }
};

/**
 * Cancel a product item and trigger atomic refund
 */
exports.cancelProductItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;
        const vendorId = req.user._id;

        const order = await ProductOrder.findOne({
            _id: orderId,
            'items._id': itemId,
            'items.vendor': vendorId
        }).populate('consumer');

        if (!order) return res.status(404).json({ status: 'error', message: 'Item not found' });

        const item = order.items.id(itemId);

        if (['delivered', 'returned', 'cancelled'].includes(item.status)) {
            return res.status(400).json({ status: 'error', message: `Cannot cancel item in ${item.status} state` });
        }

        item.status = 'cancelled';

        order.history.push({
            status: 'cancelled',
            timestamp: new Date(),
            note: `Item cancelled by vendor. Reason: ${reason || 'Not specified'}`
        });

        // Atomic Refund Logic (Hardened Phase 1)
        if (order.payment.status === 'paid' && (order.payment.method === 'wallet' || order.payment.method === 'online')) {
            const refundAmount = item.price * item.quantity;
            const { executeWalletTransaction } = require('../../../utils/walletHelper');

            await executeWalletTransaction(
                order.consumer._id,
                refundAmount,
                'credit',
                {
                    category: 'REFUND',
                    description: `Refund: Cancelled item ${item.name} (Order #${order.orderId})`,
                    referenceId: order._id,
                    referenceType: 'product_order'
                }
            );

            await sendNotification(order.consumer._id, {
                title: 'Refund Processed! 💸',
                message: `₹${refundAmount} has been credited to your wallet for the cancelled item: ${item.name}.`,
                type: 'wallet'
            });
        }

        // 4. Atomic Stock Recovery
        const inventoryHelper = require('../../../utils/inventoryHelper');
        await inventoryHelper.incrementStock([{
            product: item.product,
            quantity: item.quantity
        }], req.user._id, req);

        // 5. Audit Log
        await auditHelper.logAction({
            userId: req.user._id,
            action: 'ITEM_CANCELLED',
            resource: 'ProductOrder',
            resourceId: orderId,
            metadata: { itemId, reason: 'Vendor Cancellation' },
            req
        });

        await order.save();

        const io = socketService.getIO();
        if (io) {
            io.to(order.consumer._id.toString()).emit('product_order_status_updated', {
                orderId: order._id,
                itemId: item._id,
                status: 'cancelled',
                reason
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Item cancelled and consumer refunded.'
        });

    } catch (error) {
        console.error('Error cancelling product item:', error);
        res.status(500).json({ status: 'error', message: 'Cancellation failed' });
    }
};

/**
 * Acknowledge item return to studio
 */
exports.markAsReturned = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const vendorId = req.user._id;

        const order = await ProductOrder.findOne({
            _id: orderId,
            'items._id': itemId,
            'items.vendor': vendorId
        });

        if (!order) return res.status(404).json({ status: 'error', message: 'Item not found' });

        const item = order.items.id(itemId);
        item.status = 'returned';

        order.history.push({
            status: 'returned',
            timestamp: new Date(),
            note: `Item returned to studio and acknowledged by vendor.`
        });

        // 2. Atomic Stock Recovery
        const inventoryHelper = require('../../../utils/inventoryHelper');
        await inventoryHelper.incrementStock([{
            product: item.product,
            quantity: item.quantity
        }], req.user._id, req);

        // 3. Audit Log
        await auditHelper.logAction({
            userId: req.user._id,
            action: 'RETURN_ACKNOWLEDGED',
            resource: 'ProductOrder',
            resourceId: orderId,
            metadata: { itemId },
            req
        });

        await order.save();
        res.status(200).json({ status: 'success', message: 'Return acknowledged' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Return acknowledgement failed' });
    }
};
