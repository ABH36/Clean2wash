const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sanitizePhone } = require('../../../utils/authUtils');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// Helper function to create JWT token
const signToken = (id) => {
    return jwt.sign({ id, role: 'consumer' }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d'
    });
};

// Helper function to create and send token
const createSendToken = (consumer, statusCode, res, message) => {
    const token = signToken(consumer._id);

    // Remove password from output
    consumer.password = undefined;
    consumer.otp = undefined;

    res.status(statusCode).json({
        status: 'success',
        message,
        token,
        data: {
            consumer,
            token
        }
    });
};

// Helper function to validate phone number
const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};

// Helper function to validate email
const validateEmail = (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

// Send OTP for login/signup
exports.sendOTP = catchAsync(async (req, res, next) => {
    const { identifier, type } = req.body; // identifier can be phone or email, type can be 'phone' or 'email'

    if (!identifier) {
        return next(new AppError('Phone number or email is required', 400));
    }

    // Validate identifier based on type
    if (type === 'phone' && !validatePhone(identifier)) {
        return next(new AppError('Please provide a valid 10-digit phone number', 400));
    }

    if (type === 'email' && !validateEmail(identifier)) {
        return next(new AppError('Please provide a valid email address', 400));
    }

    // Find consumer by phone or email
    let consumer = await User.findByEmailOrPhone(identifier);
    let isNewUser = !consumer;

    // Signup: new user with userData — create consumer only then
    if (isNewUser && req.body.userData) {
        const { name, phone, email } = req.body.userData;
        consumer = new User({
            name: name || `User_${identifier.slice(-4)}`,
            phone: sanitizePhone(phone || (type === 'phone' ? identifier : '')),
            email: email || (type === 'email' ? identifier.toLowerCase() : undefined),
            password: crypto.randomBytes(8).toString('hex'),
            role: 'consumer'
        });
    }

    // New User handling: If still no consumer, create a minimal "pending" one
    if (!consumer) {
        consumer = new User({
            name: 'New User',
            phone: type === 'phone' ? sanitizePhone(identifier) : `9999999999`,
            email: type === 'email' ? identifier.toLowerCase() : undefined,
            password: crypto.randomBytes(8).toString('hex'),
            role: 'consumer',
            isVerified: false
        });
        await consumer.save({ validateBeforeSave: false });
        isNewUser = true;
    }

    // Generate and save OTP
    const otp = consumer.generateOTP();
    try {
        await consumer.save();
    } catch (saveError) {
        console.error('Error saving consumer:', saveError);
        // If save fails due to duplicate, try to find existing consumer
        if (saveError.code === 11000) {
            consumer = await User.findByEmailOrPhone(identifier);
            if (!consumer) {
                throw saveError;
            }
            const newOtp = consumer.generateOTP();
            await consumer.save();
        } else {
            throw saveError;
        }
    }

    // In development, send OTP in response
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔢 OTP for ${identifier}: ${otp}`);
    }

    res.status(200).json({
        status: 'success',
        message: 'OTP sent successfully',
        data: {
            isNewUser,
            identifier,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }
    });
});

// Verify OTP and login/signup
exports.verifyOTP = catchAsync(async (req, res, next) => {
    const { identifier, otp, userData } = req.body;

    if (!identifier || !otp) {
        return next(new AppError('Identifier and OTP are required', 400));
    }

    // Find consumer
    const consumer = await User.findByEmailOrPhone(identifier);
    if (!consumer) {
        return next(new AppError('User not found. Please request a new OTP.', 404));
    }

    // Verify OTP
    if (!consumer.verifyOTP(otp)) {
        return next(new AppError('Invalid or expired OTP. Please request a new OTP.', 400));
    }

    // Clear OTP after successful verification
    consumer.otp = undefined;
    consumer.isVerified = true;

    const isSignup = req.body.isSignup === true;
    if (isSignup && userData) {
        if (userData.name) consumer.name = userData.name;
        if (userData.email && userData.email !== consumer.email) consumer.email = userData.email;
        if (userData.phone && userData.phone !== consumer.phone) consumer.phone = userData.phone;

        // Handle Referral Code Linkage
        if (userData.referralCode && !consumer.referredBy) {
            const referrer = await User.findOne({ referralCode: userData.referralCode.toUpperCase() });
            if (referrer && referrer._id.toString() !== consumer._id.toString()) {
                consumer.referredBy = referrer._id;
            }
        }
    }

    // Update login info
    consumer.lastLogin = new Date();
    consumer.loginCount += 1;

    await consumer.save({ validateBeforeSave: false });

    // Remove sensitive data
    consumer.password = undefined;
    consumer.otp = undefined;

    // Send token
    const needsSignup = consumer.name === 'New User';
    const token = signToken(consumer._id);

    res.status(200).json({
        status: 'success',
        message: 'Login successful',
        token,
        needsSignup,
        data: {
            consumer,
            token
        }
    });
});

// Login with phone/email and password (alternative method)
exports.login = catchAsync(async (req, res, next) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return next(new AppError('Please provide identifier and password', 400));
    }

    const sanitizedIdentifier = sanitizePhone(identifier);

    // Find consumer and include password
    const consumer = await User.findOne({
        $or: [
            { phone: sanitizedIdentifier },
            { email: identifier.toLowerCase() }
        ]
    }).select('+password');

    if (!consumer || !(await consumer.correctPassword(password, consumer.password))) {
        return next(new AppError('Incorrect identifier or password', 401));
    }

    // Check if consumer is active
    if (!consumer.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // Update login info
    consumer.lastLogin = new Date();
    consumer.loginCount += 1;
    await consumer.save({ validateBeforeSave: false });

    // Send token
    createSendToken(consumer, 200, res, 'Login successful');
});

// Signup (for new users)
exports.signup = catchAsync(async (req, res, next) => {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
        return next(new AppError('Please provide all required fields: name, email, phone, password', 400));
    }

    // Validate email and phone formats
    if (!validateEmail(email)) {
        return next(new AppError('Please provide a valid email address', 400));
    }

    if (!validatePhone(phone)) {
        return next(new AppError('Please provide a valid 10-digit phone number', 400));
    }

    // Check if consumer already exists
    const existingConsumer = await User.findOne({
        $or: [{ email }, { phone }]
    });

    if (existingConsumer) {
        return next(new AppError('A user with this email or phone number already exists', 400));
    }

    // Create new consumer
    const signupData = {
        name,
        email,
        phone: sanitizePhone(phone),
        password,
        role: 'consumer',
        isVerified: false
    };

    // Handle referral code during direct signup
    if (req.body.referralCode) {
        const referrer = await User.findOne({ referralCode: req.body.referralCode.toUpperCase() });
        if (referrer) {
            signupData.referredBy = referrer._id;
        }
    }

    const newConsumer = await User.create(signupData);

    // Generate OTP for verification
    const otp = newConsumer.generateOTP();
    await newConsumer.save({ validateBeforeSave: false });

    // In development, send OTP in response
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔢 OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
        status: 'success',
        message: 'Account created successfully. Please verify your email/phone with the OTP sent.',
        data: {
            consumer: {
                id: newConsumer._id,
                name: newConsumer.name,
                email: newConsumer.email,
                phone: newConsumer.phone
            },
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }
    });
});

// Logout (client-side token removal)
exports.logout = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Logout successful'
    });
};

// Protect middleware - to verify JWT token
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Get token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 3) Check if consumer still exists
    const currentConsumer = await User.findById(decoded.id);
    if (!currentConsumer) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Check if consumer is active
    if (!currentConsumer.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // Grant access to protected route
    req.user = currentConsumer;
    next();
});

// Get current user profile
exports.getMe = catchAsync(async (req, res, next) => {
    const consumer = await User.findById(req.user.id)
        .populate('vehicles')
        .populate('primaryVehicle')
        .populate('subscription');

    if (!consumer) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            consumer
        }
    });
});

// Update FCM Token for push notifications
exports.updateFCMToken = catchAsync(async (req, res, next) => {
    const { token, platform } = req.body;

    if (!token) {
        return next(new AppError('FCM token is required', 400));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Initialize fcmTokens if not exists (safety)
    if (!user.fcmTokens) user.fcmTokens = [];

    // Check if token already exists
    const existingTokenIndex = user.fcmTokens.findIndex(t => t.token === token);

    if (existingTokenIndex > -1) {
        // Update last used timestamp
        user.fcmTokens[existingTokenIndex].lastUsed = new Date();
        if (platform) user.fcmTokens[existingTokenIndex].platform = platform;
    } else {
        // Add new token
        user.fcmTokens.push({
            token,
            platform: platform || 'unknown',
            lastUsed: new Date()
        });
    }

    // Limit tokens per user to 3 (prevent document bloat)
    if (user.fcmTokens.length > 3) {
        user.fcmTokens.sort((a, b) => b.lastUsed - a.lastUsed);
        user.fcmTokens = user.fcmTokens.slice(0, 3);
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'FCM token registered successfully'
    });
});
