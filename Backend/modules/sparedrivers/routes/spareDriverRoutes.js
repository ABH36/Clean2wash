const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/spareDriverController');
const jwt = require('jsonwebtoken');
const SpareDriver = require('../models/SpareDriver');

// ── Driver Auth Guard ──
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return res.status(401).json({ status: 'fail', message: 'Not logged in' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-jwt-key-for-carwash');
        const driver = await SpareDriver.findById(decoded.id);
        if (!driver) return res.status(401).json({ status: 'fail', message: 'User not found' });

        req.user = driver;
        next();
    } catch (err) {
        res.status(401).json({ status: 'fail', message: 'Invalid token' });
    }
};

// ── Admin Guard (Frontend login is mocked, so temporaily bypassing JWT check) ──
const adminOnly = (req, res, next) => {
    // TODO: implement real admin JWT verification when admin backend is ready
    req.adminId = 'mock_admin_id';
    next();
};

// ── Public Driver Routes ──
router.post('/register', ctrl.register);

// ── Protected Driver Routes ──
router.post(
    '/upload-docs',
    protect,
    ctrl.upload.fields([
        { name: 'aadhaarCard', maxCount: 1 },
        { name: 'drivingLicense', maxCount: 1 },
        { name: 'selfie', maxCount: 1 }
    ]),
    ctrl.uploadDocuments
);
router.get('/profile', protect, ctrl.getProfile);

// ── Admin-Only Routes ──
router.get('/admin/drivers', adminOnly, ctrl.adminListDrivers);
router.patch('/admin/drivers/:id', adminOnly, ctrl.adminVerifyDriver);

module.exports = router;
