const express = require('express');
const {
    authConsumer,
    getMe,
    updateProfile,
    addVehicle,
    deleteVehicle,
    addAddress,
    deleteAddress
} = require('./consumer.controller');
const {
    getProducts,
    placeOrder,
    getMyOrders
} = require('./shop.controller');
const {
    getServices,
    createBooking,
    getMyBookings
} = require('./wash.controller');

const router = express.Router();

const { protect } = require('../../middleware/auth');

router.post('/auth', authConsumer);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

router.post('/vehicles', protect, addVehicle);
router.delete('/vehicles/:id', protect, deleteVehicle);

router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// Shop routes
router.get('/shop/products', getProducts);
router.post('/shop/orders', protect, placeOrder);
router.get('/shop/my-orders', protect, getMyOrders);

// Wash/Booking routes
router.get('/services', getServices);
router.post('/bookings', protect, createBooking);
router.get('/bookings', protect, getMyBookings);

module.exports = router;
