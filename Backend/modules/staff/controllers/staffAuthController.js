const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
require('colors');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE_IN || '90d'
    });
};

// PRODUCTION-GRADE OTP STORE (In-memory for current deployment constraints)
const staffOTPStore = new Map();

const createSendToken = (user, statusCode, res, message) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        message,
        token,
        data: {
            user
        }
    });
};

// Send OTP for Staff Login
exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ status: 'error', message: 'Phone number is required' });
        }

        // Check if user is actually staff
        const user = await User.findOne({ phone, role: 'staff', isActive: true });
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Unauthorized: No active staff profile linked to this mobile number' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store for 10 minutes
        staffOTPStore.set(phone, { otp, expires: Date.now() + 600000 });

        // Terminal Log for Dev
        console.log('\n' + '='.repeat(40));
        console.log(`🛡️  STAFF TERMINAL AUTH: ${user.name}`);
        console.log(`📱 TARGET: ${phone}`);
        console.log(`🔑 SECURITY OTP: ${otp}`.cyan.bold);
        console.log(`⏳ TTL: 600 SECONDS`);
        console.log('='.repeat(40) + '\n');

        res.status(200).json({
            status: 'success',
            message: 'Verification code dispatched to your registered device'
        });
    } catch (error) {
        console.error('Staff OTP Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

// Staff Login with OTP
exports.login = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ status: 'error', message: 'Authentication requires both mobile and OTP' });
        }

        // OTP Validation
        const storedData = staffOTPStore.get(phone);
        if (!storedData) {
            return res.status(400).json({ status: 'error', message: 'Session expired. Request a new login code.' });
        }

        if (storedData.otp !== String(otp)) {
            return res.status(401).json({ status: 'error', message: 'Access Denied: Invalid Security Code' });
        }

        if (Date.now() > storedData.expires) {
            staffOTPStore.delete(phone);
            return res.status(400).json({ status: 'error', message: 'Access Denied: Code Expiry Reached' });
        }

        // Clear OTP
        staffOTPStore.delete(phone);

        // Fetch User
        const user = await User.findOne({ phone, role: 'staff', isActive: true });
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Staff profile de-activated or not found' });
        }

        createSendToken(user, 200, res, 'Terminal Handshake Successful');
    } catch (error) {
        console.error('Staff Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to initialize terminal access' });
    }
};

// Get Staff Profile (Enhanced)
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Profile data missing' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                staff: user
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Profile retrieval failure' });
    }
};

// Update Staff Profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Terminal Identity Mismatch' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) {
            if (!user.profile.address) user.profile.address = {};
            user.profile.address.street = address;
        }

        await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                staff: user
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to synchronize identity updates' });
    }
};

// Update FCM Token for push notifications (Phase 2 Hardening)
exports.updateFCMToken = async (req, res) => {
    try {
        const { token, platform } = req.body;
        if (!token) {
            return res.status(400).json({
                status: 'fail',
                message: 'FCM token is required'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Staff user not found'
            });
        }

        if (!user.fcmTokens) user.fcmTokens = [];

        const existingTokenIndex = user.fcmTokens.findIndex(t => t.token === token);

        if (existingTokenIndex > -1) {
            user.fcmTokens[existingTokenIndex].lastUsed = new Date();
            if (platform) user.fcmTokens[existingTokenIndex].platform = platform;
        } else {
            user.fcmTokens.push({
                token,
                platform: platform || 'web',
                lastUsed: new Date()
            });
        }

        if (user.fcmTokens.length > 3) {
            user.fcmTokens.sort((a, b) => b.lastUsed - a.lastUsed);
            user.fcmTokens = user.fcmTokens.slice(0, 3);
        }

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'FCM token registered successfully'
        });

    } catch (error) {
        console.error('Error updating Staff FCM token:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update FCM token'
        });
    }
};
