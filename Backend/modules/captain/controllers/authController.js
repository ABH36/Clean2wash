const Captain = require('../models/Captain');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
    return jwt.sign({ id, role: 'captain' }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d'
    });
};

const createSendToken = (captain, statusCode, res, message) => {
    const token = signToken(captain._id);
    captain.password = undefined;
    captain.otp = undefined;
    res.status(statusCode).json({
        status: 'success',
        message,
        token,
        data: { captain, token }
    });
};

const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);

exports.sendOTP = async (req, res) => {
    try {
        const { phone, userData } = req.body;
        if (!phone) {
            return res.status(400).json({ status: 'fail', message: 'Phone number is required' });
        }
        if (!validatePhone(phone)) {
            return res.status(400).json({ status: 'fail', message: 'Please provide a valid 10-digit phone number' });
        }

        let captain = await Captain.findByPhone(phone);
        const isNewUser = !captain;

        if (isNewUser && userData) {
            captain = new Captain({
                name: userData.name || `Captain_${phone.slice(-4)}`,
                phone,
                password: userData.password || '1234',
                profile: {
                    city: userData.city || '',
                    experience: userData.experience || '',
                    vehicleType: userData.vehicleType || '',
                    plate: userData.plate || '',
                    kit: userData.kit || ''
                }
            });
        }

        if (!captain) {
            return res.status(404).json({
                status: 'fail',
                message: 'No account found. Please sign up first.'
            });
        }

        captain.generateOTP();
        await captain.save({ validateBeforeSave: false });

        if (process.env.NODE_ENV === 'development') {
            console.log(`🔢 Captain OTP for ${phone}: ${captain.otp.code}`);
        }

        res.status(200).json({
            status: 'success',
            message: 'OTP sent successfully',
            data: {
                isNewUser,
                phone,
                otp: process.env.NODE_ENV === 'development' ? captain.otp.code : undefined
            }
        });
    } catch (error) {
        console.error('Captain sendOTP error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send OTP. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp, userData, isSignup } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ status: 'fail', message: 'Phone and OTP are required' });
        }

        const captain = await Captain.findByPhone(phone);
        if (!captain) {
            return res.status(404).json({ status: 'fail', message: 'User not found. Please request a new OTP.' });
        }

        if (!captain.verifyOTP(otp)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid or expired OTP. Please request a new OTP.' });
        }

        captain.otp = undefined;
        captain.isVerified = true;

        if (isSignup && userData) {
            if (userData.name) captain.name = userData.name;
            if (!captain.profile) captain.profile = {};
            if (userData.city !== undefined) captain.profile.city = userData.city;
            if (userData.experience !== undefined) captain.profile.experience = userData.experience;
            if (userData.vehicleType !== undefined) captain.profile.vehicleType = userData.vehicleType;
            if (userData.plate !== undefined) captain.profile.plate = userData.plate;
            if (userData.kit !== undefined) captain.profile.kit = userData.kit;
        }

        captain.lastLogin = new Date();
        captain.loginCount += 1;
        await captain.save({ validateBeforeSave: false });

        captain.password = undefined;
        captain.otp = undefined;
        createSendToken(captain, 200, res, 'Login successful');
    } catch (error) {
        console.error('Captain verifyOTP error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify OTP. Please try again.'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ status: 'fail', message: 'Phone and password are required' });
        }

        const captain = await Captain.findByPhone(phone).select('+password');
        if (!captain || !(await captain.correctPassword(password, captain.password))) {
            return res.status(401).json({ status: 'fail', message: 'Incorrect phone or password' });
        }

        if (!captain.isActive) {
            return res.status(401).json({ status: 'fail', message: 'Your account has been deactivated.' });
        }

        captain.lastLogin = new Date();
        captain.loginCount += 1;
        await captain.save({ validateBeforeSave: false });
        createSendToken(captain, 200, res, 'Login successful');
    } catch (error) {
        console.error('Captain login error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to login.' });
    }
};

exports.logout = (req, res) => {
    res.status(200).json({ status: 'success', message: 'Logout successful' });
};

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'You are not logged in! Please log in to get access.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.role !== 'captain') {
            return res.status(401).json({ status: 'fail', message: 'Invalid token for captain.' });
        }

        const captain = await Captain.findById(decoded.id);
        if (!captain) {
            return res.status(401).json({ status: 'fail', message: 'The user belonging to this token no longer exists.' });
        }
        if (!captain.isActive) {
            return res.status(401).json({ status: 'fail', message: 'Your account has been deactivated.' });
        }

        req.captain = captain;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'fail', message: 'Your token has expired! Please log in again.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to authenticate.' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const captain = await Captain.findById(req.captain.id);
        res.status(200).json({
            status: 'success',
            data: { captain }
        });
    } catch (error) {
        console.error('Captain getMe error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get profile.' });
    }
};
