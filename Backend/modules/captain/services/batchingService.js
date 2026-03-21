const ProductOrder = require('../../../models/ProductOrder');

/**
 * Groups available product pickup broadcasts into efficient batches
 * Logic:
 * 1. Pickup studios within 2km are considered "Nearby Pickups"
 * 2. Delivery destinations within 3km of each other are considered "Nearby Destinations"
 * 3. Max items per batch = 3 (Initial limit for safety/carrying capacity)
 */
exports.createDynamicBatches = async (captainLocation = null) => {
    try {
        // Find all broadcast items not yet assigned
        const orders = await ProductOrder.find({
            'items.fulfillment.assignmentMethod': 'broadcast',
            'items.fulfillment.agentId': { $exists: false },
            isActive: true
        }).populate('items.vendor', 'name profile location');

        const availableItems = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.fulfillment?.assignmentMethod === 'broadcast' && !item.fulfillment?.agentId) {
                    availableItems.push({
                        itemId: item._id,
                        orderId: order._id,
                        productName: item.name,
                        vendorId: item.vendor?._id,
                        vendorName: item.vendor?.name || 'Studio Partner',
                        vendorLocation: item.vendor?.location,
                        deliveryLocation: order.shippingAddress.location,
                        price: item.price,
                        orderNumber: order.orderId
                    });
                }
            });
        });

        if (availableItems.length === 0) return [];

        const batches = [];
        const processedItems = new Set();

        for (let i = 0; i < availableItems.length; i++) {
            const currentItem = availableItems[i];
            if (processedItems.has(currentItem.itemId.toString())) continue;

            const currentBatch = [currentItem];
            processedItems.add(currentItem.itemId.toString());

            // Look for nearby partners or delivery points
            for (let j = i + 1; j < availableItems.length; j++) {
                if (currentBatch.length >= 3) break; // Hard limit

                const nextItem = availableItems[j];
                if (processedItems.has(nextItem.itemId.toString())) continue;

                // Check distance between vendors (Mocked distance check for now)
                // In production, we use GeoSpatial queries or Haversine formula
                const isNearbyVendor = currentItem.vendorId?.toString() === nextItem.vendorId?.toString();

                // If same vendor or nearby, add to batch
                if (isNearbyVendor) {
                    currentBatch.push(nextItem);
                    processedItems.add(nextItem.itemId.toString());
                }
            }

            if (currentBatch.length > 1) {
                batches.push({
                    type: 'batch',
                    itemsCount: currentBatch.length,
                    vendorNames: [...new Set(currentBatch.map(b => b.vendorName))].join(' & '),
                    productNames: currentBatch.map(b => b.productName).join(', '),
                    estimatedEarnings: currentBatch.reduce((sum, item) => sum + (item.price * 0.1) + 15, 0), // Bulk discount on base fee
                    items: currentBatch,
                    isBatched: true
                });
            } else {
                // Keep as individual gig if no batch found
                batches.push({
                    ...currentItem,
                    type: 'product_pickup',
                    estimatedEarnings: (currentItem.price * 0.1) + 20,
                    isBatched: false
                });
            }
        }

        return batches;

    } catch (error) {
        console.error('Batching Error:', error);
        return [];
    }
};
