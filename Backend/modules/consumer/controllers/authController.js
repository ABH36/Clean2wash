const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sanitizePhone } = require('../../../utils/authUtils');

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
exports.sendOTP = async (req, res) => {
    try {
        const { identifier, type } = req.body; // identifier can be phone or email, type can be 'phone' or 'email'

        if (!identifier) {
            return res.status(400).json({
                status: 'fail',
                message: 'Phone number or email is required'
            });
        }

        // Validate identifier based on type
        if (type === 'phone' && !validatePhone(identifier)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid 10-digit phone number'
            });
        }

        if (type === 'email' && !validateEmail(identifier)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid email address'
            });
        }

        // Find consumer by phone or email
        let consumer = await User.findByEmailOrPhone(identifier);
        const isNewUser = !consumer;

        // Signup: new user with userData — create consumer only then
        if (isNewUser && req.body.userData) {
            const { name, phone, email } = req.body.userData;
            consumer = new User({
                name: name || `User_${identifier.slice(-4)}`,
                phone: sanitizePhone(phone || (type === 'phone' ? identifier : '')),
                email: email || (type === 'email' ? identifier : `user_${identifier}@temp.com`),
                password: 'defaultPassword123', // Will be updated after OTP verification
                role: 'consumer'
            });
        }

        // Login: user not found and no signup data — do NOT create, ask to sign up
        if (!consumer) {
            return res.status(404).json({
                status: 'fail',
                message: 'No account found with this phone/email. Please sign up first.'
            });
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

        // TODO: Integrate with SMS/Email service for production
        // await sendSMS(phone, `Your Clean2Wash OTP is: ${otp}`);
        // await sendEmail(email, 'Your Clean2Wash OTP', `Your OTP is: ${otp}`);

        res.status(200).json({
            status: 'success',
            message: 'OTP sent successfully',
            data: {
                isNewUser,
                identifier,
                otp: process.env.NODE_ENV === 'development' ? otp : undefined
            }
        });

    } catch (error) {
        console.error('Error in sendOTP:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({
                status: 'fail',
                message: `Validation Error: ${messages.join('. ')}`
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to send OTP. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.stack || error.message : undefined
        });
    }
};

// Verify OTP and login/signup
exports.verifyOTP = async (req, res, next) => {
    try {
        const { identifier, otp, userData } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({
                status: 'fail',
                message: 'Identifier and OTP are required'
            });
        }

        // Find consumer
        const consumer = await User.findByEmailOrPhone(identifier);
        if (!consumer) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found. Please request a new OTP.'
            });
        }

        // Verify OTP
        if (!consumer.verifyOTP(otp)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid or expired OTP. Please request a new OTP.'
            });
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
        createSendToken(consumer, 200, res, 'Login successful');

    } catch (error) {
        console.error('Error in verifyOTP:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify OTP. Please try again.'
        });
    }
};

// Login with phone/email and password (alternative method)
exports.login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide identifier and password'
            });
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
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect identifier or password'
            });
        }

        // Check if consumer is active
        if (!consumer.isActive) {
            return res.status(401).json({
                status: 'fail',
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Update login info
        consumer.lastLogin = new Date();
        consumer.loginCount += 1;
        await consumer.save({ validateBeforeSave: false });

        // Send token
        createSendToken(consumer, 200, res, 'Login successful');

    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to login. Please try again.'
        });
    }
};

// Signup (for new users)
exports.signup = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: name, email, phone, password'
            });
        }

        // Validate email and phone formats
        if (!validateEmail(email)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid email address'
            });
        }

        if (!validatePhone(phone)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid 10-digit phone number'
            });
        }

        // Check if consumer already exists
        const existingConsumer = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingConsumer) {
            return res.status(400).json({
                status: 'fail',
                message: 'A user with this email or phone number already exists'
            });
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
            console.log(`🔢 OTP for ${email}: ${otp}`.cyan.bold);
        }

        // TODO: Send OTP via email/SMS

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

    } catch (error) {
        console.error('Error in signup:', error);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({
                status: 'fail',
                message: messages.join('. ')
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                status: 'fail',
                message: `A user with this ${field} already exists`
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to create account. Please try again.'
        });
    }
};

// Logout (client-side token removal)
exports.logout = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Logout successful'
    });
};

// Protect middleware - to verify JWT token
exports.protect = async (req, res, next) => {
    try {
        // 1) Get token and check if it's there
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not logged in! Please log in to get access.'
            });
        }

        // 2) Verification token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // 3) Check if consumer still exists
        const currentConsumer = await User.findById(decoded.id);
        if (!currentConsumer) {
            return res.status(401).json({
                status: 'fail',
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // 4) Check if consumer is active
        if (!currentConsumer.isActive) {
            return res.status(401).json({
                status: 'fail',
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Grant access to protected route
        req.user = currentConsumer;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid token. Please log in again.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'fail',
                message: 'Your token has expired! Please log in again.'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to authenticate. Please try again.'
        });
    }
};

// Get current user profile
exports.getMe = async (req, res) => {
    try {
        const consumer = await User.findById(req.user.id)
            .populate('vehicles')
            .populate('primaryVehicle')
            .populate('subscription');

        res.status(200).json({
            status: 'success',
            data: {
                consumer
            }
        });

    } catch (error) {
        console.error('Error in getMe:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get profile. Please try again.'
        });
    }
};
