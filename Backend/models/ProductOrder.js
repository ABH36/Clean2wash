const mongoose = require('mongoose');

const ProductOrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: () => 'C2W-ORD-' + Math.floor(100000 + Math.random() * 900000)
    },
    consumer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        price: Number,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'packed', 'arrived_pickup', 'shipped', 'arrived_delivery', 'delivered', 'cancelled', 'returning_to_pickup', 'returned'],
            default: 'pending'
        },
        fulfillment: {
            agentId: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'items.fulfillment.agentModel'
            },
            agentModel: {
                type: String,
                enum: ['User', 'Captain']
            },
            type: {
                type: String,
                enum: ['staff', 'captain', 'courier'],
                default: 'staff'
            },
            deliveryPin: {
                type: String,
                default: () => Math.floor(1000 + Math.random() * 9000).toString()
            },
            assignmentMethod: {
                type: String,
                enum: ['direct', 'broadcast'],
                default: 'direct'
            },
            broadcastAt: Date,
            claimedAt: Date,
            dispatchedAt: Date,
            deliveredAt: Date,
            handoverPhoto: String
        }
    }],
    pricing: {
        subtotal: Number,
        tax: Number,
        shipping: Number,
        discount: Number,
        total: {
            type: Number,
            required: true
        }
    },
    payment: {
        method: {
            type: String,
            enum: ['wallet', 'online', 'cash'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'refunded', 'failed'],
            default: 'pending'
        },
        transactionId: String,
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        label: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'partially_delivered'],
        default: 'pending'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    history: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }]
}, {
    timestamps: true
});

// Index for performance
ProductOrderSchema.index({ consumer: 1, status: 1 });
ProductOrderSchema.index({ 'items.vendor': 1 });

module.exports = mongoose.model('ProductOrder', ProductOrderSchema);
