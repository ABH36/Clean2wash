const Captain = require('../../../models/Captain');
const jwt = require('jsonwebtoken');
const { sanitizePhone } = require('../../../utils/authUtils');

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

exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, city, vehicleType, plate, kit, experience, drivingLicense, aadharCard, photo } = req.body;

        // 1) Check if user already exists
        const existingCaptain = await Captain.findOne({
            $or: [{ phone }, email ? { email } : null].filter(Boolean)
        });

        if (existingCaptain) {
            return res.status(400).json({
                status: 'error',
                message: 'Captain with this phone or email already exists'
            });
        }

        // 2) Create new captain
        const captainData = {
            name,
            email: email || undefined,
            phone: sanitizePhone(phone),
            password: password || '1234',
            isVerified: false,
            profile: {
                city,
                vehicleType,
                plate,
                kit,
                experience,
                drivingLicense: '',
                aadharCard: '',
                photo: ''
            }
        };

        const cloudinary = require('../../../utils/cloudinary'); // Ensure cloudinary is imported locally or globally

        // 2a) Upload documents if provided
        try {
            if (drivingLicense && drivingLicense.startsWith('data:')) {
                const dlRes = await cloudinary.uploadImage(drivingLicense, 'clean2wash/captains/documents');
                captainData.profile.drivingLicense = dlRes.secure_url;
            }
            if (aadharCard && aadharCard.startsWith('data:')) {
                const aadharRes = await cloudinary.uploadImage(aadharCard, 'clean2wash/captains/documents');
                captainData.profile.aadharCard = aadharRes.secure_url;
            }
            if (photo && photo.startsWith('data:')) {
                const photoRes = await cloudinary.uploadImage(photo, 'clean2wash/captains/photos');
                captainData.profile.photo = photoRes.secure_url;
            }
        } catch (uploadError) {
            console.error('Document upload failed:', uploadError);
            // Non-blocking for now, or you can fail the request
        }

        const newCaptain = await Captain.create(captainData);

        // 3) Send token
        createSendToken(newCaptain, 201, res, 'Captain registered successfully');
    } catch (error) {
        console.error('Captain register error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message || 'Failed to register captain'
        });
    }
};

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

        // If trying to signup (userData present) but captain already exists and is verified
        if (userData && captain && captain.isVerified) {
            return res.status(400).json({
                status: 'fail',
                message: 'This phone number is already registered. Please login instead.'
            });
        }

        if (isNewUser && userData) {
            captain = new Captain({
                name: userData.name || `Captain_${phone.slice(-4)}`,
                phone: sanitizePhone(phone),
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
            error: process.env.NODE_ENV === 'development' ? error.stack || error.message : undefined
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp, userData, isSignup } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ status: 'fail', message: 'Phone and OTP are required' });
        }

        const sanitizedPhone = sanitizePhone(phone);
        const captain = await Captain.findByPhone(sanitizedPhone);
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
            if (userData.password) captain.password = userData.password;
            if (!captain.profile) captain.profile = {};
            if (userData.city !== undefined) captain.profile.city = userData.city;
            if (userData.experience !== undefined) captain.profile.experience = userData.experience;
            if (userData.vehicleType !== undefined) captain.profile.vehicleType = userData.vehicleType;
            if (userData.plate !== undefined) captain.profile.plate = userData.plate;
            if (userData.kit !== undefined) captain.profile.kit = userData.kit;

            // Handle file uploads if present in userData
            const cloudinary = require('../../../utils/cloudinary');
            try {
                if (userData.drivingLicense && userData.drivingLicense.startsWith('data:')) {
                    const dlRes = await cloudinary.uploadImage(userData.drivingLicense, 'clean2wash/captains/documents');
                    captain.profile.drivingLicense = dlRes.secure_url;
                }
                if (userData.aadharCard && userData.aadharCard.startsWith('data:')) {
                    const aadharRes = await cloudinary.uploadImage(userData.aadharCard, 'clean2wash/captains/documents');
                    captain.profile.aadharCard = aadharRes.secure_url;
                }
                if (userData.photo && userData.photo.startsWith('data:')) {
                    const photoRes = await cloudinary.uploadImage(userData.photo, 'clean2wash/captains/photos');
                    captain.profile.photo = photoRes.secure_url;
                }
            } catch (uploadError) {
                console.error('Document upload failed during verifyOTP:', uploadError);
                // We'll still allow verification to succeed but documents might be missing
            }
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

        const sanitizedPhone = sanitizePhone(phone);
        const captain = await Captain.findByPhone(sanitizedPhone).select('+password');
        if (!captain || !(await captain.correctPassword(password, captain.password))) {
            return res.status(401).json({ status: 'fail', message: 'Incorrect phone or password' });
        }

        if (!captain.isActive) {
            return res.status(401).json({ status: 'fail', message: 'Your account has been deactivated.' });
        }

        // Optional: Check if verified, but maybe allow login to see "Pending" dashboard?
        // If you strictly want them not to login until verified (Vendor allows login but restricted features):
        // if (!captain.isVerified) {
        //     return res.status(401).json({ status: 'fail', message: 'Your account is pending verification by an Admin.' });
        // }

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

        const captain = await Captain.findById(req.captain.id);
        if (!captain) {
            return res.status(404).json({
                status: 'fail',
                message: 'Captain not found'
            });
        }

        if (!captain.fcmTokens) captain.fcmTokens = [];

        const existingTokenIndex = captain.fcmTokens.findIndex(t => t.token === token);

        if (existingTokenIndex > -1) {
            captain.fcmTokens[existingTokenIndex].lastUsed = new Date();
            if (platform) captain.fcmTokens[existingTokenIndex].platform = platform;
        } else {
            captain.fcmTokens.push({
                token,
                platform: platform || 'unknown',
                lastUsed: new Date()
            });
        }

        if (captain.fcmTokens.length > 3) {
            captain.fcmTokens.sort((a, b) => b.lastUsed - a.lastUsed);
            captain.fcmTokens = captain.fcmTokens.slice(0, 3);
        }

        await captain.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'FCM token registered successfully'
        });

    } catch (error) {
        console.error('Error updating Captain FCM token:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update FCM token'
        });
    }
};
