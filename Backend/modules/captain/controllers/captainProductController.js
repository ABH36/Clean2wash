const ProductOrder = require('../../../models/ProductOrder');
const Captain = require('../../../models/Captain');
const User = require('../../../models/User');
const Booking = require('../../../models/Booking');
const socketService = require('../../../socketService');
const { sendNotification, sendVendorNotification } = require('../../../utils/notificationService');
const batchingService = require('../services/batchingService');

const NON_TERMINAL_ACTIVE_STATUSES = ['accepted', 'en_route', 'arrived', 'before_photo', 'washing', 'after_photo', 'in_progress', 'active'];
const NON_TERMINAL_ASSIGNED_STATUSES = ['confirmed', 'assigned'];
const NON_TERMINAL_STATUSES = [...NON_TERMINAL_ASSIGNED_STATUSES, ...NON_TERMINAL_ACTIVE_STATUSES];

const isApartmentBooking = (booking) => !!booking?.location?.hubId || booking?.service?.category === 'Apartment';

const parseSlotDateTime = (dateValue, timeValue, fallbackOffsetMinutes = 0) => {
    if (!dateValue) return null;

    const base = new Date(dateValue);
    if (Number.isNaN(base.getTime())) return null;

    if (!timeValue) {
        base.setMinutes(base.getMinutes() + fallbackOffsetMinutes);
        return base;
    }

    const parsed = new Date(`${base.toDateString()} ${timeValue}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    base.setMinutes(base.getMinutes() + fallbackOffsetMinutes);
    return base;
};

const getConflictSummary = (booking) => {
    const mode = isApartmentBooking(booking) ? 'Apartment Wash' : (booking?.service?.name || 'mission');
    const start = booking?.schedule?.timeSlot?.start || '';
    return start ? `${mode} at ${start}` : mode;
};

const isBlockingMission = (booking, now = new Date()) => {
    if (!booking) return false;

    if (NON_TERMINAL_ACTIVE_STATUSES.includes(booking.status)) return true;
    if (!NON_TERMINAL_ASSIGNED_STATUSES.includes(booking.status)) return false;
    if (booking?.schedule?.type === 'instant') return true;

    const missionStart = parseSlotDateTime(booking?.schedule?.date, booking?.schedule?.timeSlot?.start);
    const missionEnd = parseSlotDateTime(booking?.schedule?.date, booking?.schedule?.timeSlot?.end, 90);
    if (!missionStart) return isApartmentBooking(booking);

    const leadWindowMs = (isApartmentBooking(booking) ? 120 : 45) * 60 * 1000;
    const withinLeadWindow = (missionStart.getTime() - now.getTime()) <= leadWindowMs;
    const insideMissionWindow = missionEnd ? now <= missionEnd : now >= missionStart;

    return withinLeadWindow || insideMissionWindow;
};

const findCaptainBlockingMission = async (captainId) => {
    const candidateMissions = await Booking.find({
        'provider.id': captainId,
        isActive: true,
        status: { $in: NON_TERMINAL_STATUSES }
    })
        .select('status schedule service location')
        .sort({ 'schedule.date': 1, createdAt: 1 })
        .limit(12);

    return candidateMissions.find((mission) => isBlockingMission(mission)) || null;
};

/**
 * Get available product pickup broadcasts nearby (with dynamic batching)
 */
exports.getAvailableProductPickups = async (req, res) => {
    try {
        const captain = req.user;
        const blockingMission = await findCaptainBlockingMission(captain._id);
        if (blockingMission) {
            return res.status(200).json({
                status: 'success',
                data: {
                    missions: [],
                    blockedBy: {
                        bookingId: blockingMission._id,
                        summary: getConflictSummary(blockingMission),
                        serviceCategory: blockingMission?.service?.category || ''
                    }
                }
            });
        }

        const missions = await batchingService.createDynamicBatches(captain.location);

        res.status(200).json({
            status: 'success',
            data: { missions }
        });

    } catch (error) {
        console.error('Error fetching available product pickups:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch missions' });
    }
};

/**
 * Accept a product pickup gig
 */
exports.acceptProductPickup = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const captainId = req.user._id;
        const blockingMission = await findCaptainBlockingMission(captainId);

        if (blockingMission) {
            return res.status(403).json({
                status: 'error',
                message: `Mission Conflict: Finish or clear your current ${getConflictSummary(blockingMission)} before claiming another pickup.`
            });
        }

        const order = await ProductOrder.findById(orderId);
        if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

        const item = order.items.id(itemId);
        if (!item) return res.status(404).json({ status: 'error', message: 'Item not found' });

        // Check if already claimed
        if (item.fulfillment?.agentId) {
            return res.status(400).json({ status: 'error', message: 'Mission already claimed by another agent' });
        }

        // Assign Captain
        item.fulfillment = {
            ...item.fulfillment,
            agentId: captainId,
            agentModel: 'Captain',
            type: 'captain',
            assignmentMethod: 'direct', // Transition from broadcast to direct
            claimedAt: new Date()
        };
        item.status = 'shipped'; // Marking as out for pickup/delivery

        await order.save();

        // Notify Vendor via Socket
        const io = socketService.getIO();
        if (io) {
            io.to(item.vendor.toString()).emit('product_mission_claimed', {
                orderId: order._id,
                itemId: item._id,
                agent: {
                    name: req.user.name,
                    phone: req.user.phone
                }
            });
        }

        await sendVendorNotification(item.vendor, {
            title: 'Captain Assigned! 🚖',
            message: `Captain ${req.user.name} has claimed the pickup for ${item.name}.`,
            type: 'product_order',
            priority: 'medium'
        });

        res.status(200).json({
            status: 'success',
            message: 'Mission claimed successfully',
            data: { mission: item }
        });

    } catch (error) {
        console.error('Error accepting product pickup:', error);
        res.status(500).json({ status: 'error', message: 'Failed to claim mission' });
    }
};

/**
 * Accept a batch of product pickups
 */
exports.acceptProductBatch = async (req, res) => {
    try {
        const { batchItems } = req.body; // Array of { orderId, itemId }
        const captainId = req.user._id;
        const blockingMission = await findCaptainBlockingMission(captainId);

        if (blockingMission) {
            return res.status(403).json({
                status: 'error',
                message: `Mission Conflict: Finish or clear your current ${getConflictSummary(blockingMission)} before claiming another batch.`
            });
        }

        if (!batchItems || !Array.isArray(batchItems)) {
            return res.status(400).json({ status: 'error', message: 'Invalid batch items' });
        }

        const acceptedItems = [];
        const io = socketService.getIO();

        for (const itemRef of batchItems) {
            const order = await ProductOrder.findById(itemRef.orderId);
            if (!order) continue;

            const item = order.items.id(itemRef.itemId);
            if (!item || item.fulfillment?.agentId) continue;

            // Assign Captain
            item.fulfillment = {
                ...item.fulfillment,
                agentId: captainId,
                agentModel: 'Captain',
                type: 'captain',
                assignmentMethod: 'direct',
                claimedAt: new Date()
            };
            item.status = 'shipped';

            await order.save();
            acceptedItems.push(item);

            // Notify via socket
            if (io) {
                io.to(item.vendor.toString()).emit('product_mission_claimed', {
                    orderId: order._id,
                    itemId: item._id,
                    agent: { name: req.user.name, phone: req.user.phone }
                });
            }
        }

        res.status(200).json({
            status: 'success',
            message: `Claimed ${acceptedItems.length} missions in batch`,
            data: { missions: acceptedItems }
        });

    } catch (error) {
        console.error('Error accepting batch:', error);
        res.status(500).json({ status: 'error', message: 'Failed to claim batch' });
    }
};

/**
 * Update product delivery mission status
 */
exports.updateProductStatus = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { status, deliveryPin } = req.body;
        const captainId = req.user._id;

        const order = await ProductOrder.findById(orderId);
        if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

        const item = order.items.id(itemId);
        if (!item) return res.status(404).json({ status: 'error', message: 'Item not found' });

        // Verify captain is assigned
        if (item.fulfillment?.agentId?.toString() !== captainId.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized for this mission' });
        }

        // Logic based on status
        if (status === 'delivered') {
            // Verify item-specific PIN
            if (!deliveryPin || deliveryPin !== item.fulfillment.deliveryPin) {
                return res.status(400).json({ status: 'error', message: 'Invalid Delivery PIN' });
            }
            item.status = 'delivered';
            item.fulfillment.deliveredAt = new Date();

            // Status sync for global order
            const allDelivered = order.items.every(i => i.status === 'delivered' || i.status === 'cancelled' || i.status === 'returned');
            if (allDelivered) {
                order.status = 'delivered';
                order.isActive = false;
            }
        } else if (status === 'returning_to_pickup') {
            item.status = 'returning_to_pickup';
            order.history.push({
                status: 'returning',
                timestamp: new Date(),
                note: `Item rejected at doorstep. Captain ${req.user.name} returning to studio.`
            });
        } else {
            // Generic status updates (arrived_pickup, shipped, arrived_delivery)
            item.status = status;
        }

        await order.save();

        // Notify Vendor and Customer
        const io = socketService.getIO();
        if (io) {
            // Notify customer room
            io.to(order.consumer.toString()).emit('order_item_status_updated', {
                orderId,
                itemId,
                status,
                orderNumber: order.orderId
            });
            // Notify vendor room
            io.to(item.vendor.toString()).emit('vendor_order_item_status', {
                orderId,
                itemId,
                status
            });
        }

        res.status(200).json({
            status: 'success',
            message: `Status updated to ${status}`,
            data: { item }
        });

    } catch (error) {
        console.error('Error updating product status:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update status' });
    }
};
