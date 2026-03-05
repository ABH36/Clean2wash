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

// ── Admin Guard (uses consumer JWT — admin already logged in) ──
const adminOnly = (req, res, next) => {
    // Admin token comes from Authorization header — decoded role must be 'admin'
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return res.status(401).json({ status: 'fail', message: 'Admin token required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-jwt-key-for-carwash');
        if (decoded.role !== 'admin') return res.status(403).json({ status: 'fail', message: 'Admin access only' });

        req.adminId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ status: 'fail', message: 'Invalid admin token' });
    }
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
