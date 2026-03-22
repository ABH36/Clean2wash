const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('../../../utils/cloudinary');
require('colors');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d'
    });
};

// PRODUCTION-GRADE OTP STORE (In-memory for current deployment constraints)
const tempOTPStore = new Map();

const createSendToken = (user, statusCode, res, message) => {
    const token = signToken(user._id);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        message: message,
        data: { token, vendor: user }
    });
};

// Send OTP (Terminal Output for Dev/Prod)
exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ status: 'error', message: 'Phone number is required for OTP verification' });

        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in-memory for 10 minutes
        tempOTPStore.set(phone, { otp, expires: Date.now() + 600000 });

        // Elite Terminal Visuals for OTP
        console.log('\n' + '='.repeat(40));
        console.log(`🔒 VENDOR AUTH PROTOCOL: CLEAN-2-WASH`);
        console.log(`📱 TARGET: ${phone}`);
        console.log(`🔑 OTP CODE: ${otp}`.yellow.bold);
        console.log(`⏳ VALID FOR: 10 MINUTES`);
        console.log('='.repeat(40) + '\n');

        res.status(200).json({
            status: 'success',
            message: 'OTP triggered successfully. Check Terminal for code.'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to trigger OTP protocol' });
    }
};

// Vendor Register with OTP Verification
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, studioName, city, idProof, otp } = req.body;

        // 1) Hardened Validation
        if (!idProof) {
            return res.status(400).json({ status: 'error', message: 'Identity Proof document is mandatory.' });
        }

        // 2) OTP Verification logic
        const storedData = tempOTPStore.get(phone);
        if (!storedData) {
            return res.status(400).json({ status: 'error', message: 'OTP expired or not requested. Please try again.' });
        }

        if (storedData.otp !== String(otp)) {
            return res.status(401).json({ status: 'error', message: 'Invalid OTP code. Security verification failed.' });
        }

        if (Date.now() > storedData.expires) {
            tempOTPStore.delete(phone);
            return res.status(400).json({ status: 'error', message: 'OTP has expired.' });
        }

        // Clean up OTP after use
        tempOTPStore.delete(phone);

        // 3) Check if user already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ status: 'error', message: 'Email already registered.' });

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) return res.status(400).json({ status: 'error', message: 'Phone number already registered.' });

        // 4) Upload idProof to Cloudinary
        let idProofUrl = '';
        const hasCloudinary = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

        if (hasCloudinary) {
            try {
                console.log('🔄 Uploading KYC document to hub...');
                const uploadRes = await cloudinary.uploadImage(idProof, 'clean2wash/vendors/ids');
                idProofUrl = uploadRes.secure_url;
            } catch (err) {
                console.error('KYC Upload Failure:', err);
                return res.status(500).json({ status: 'error', message: 'Document verification failed upload.' });
            }
        } else {
            console.log('⚠️  CLOUDINARY_API_KEY missing in .env.local - Using Mock Document Verification Path'.yellow);
            // In dev mode with missing keys, we provide a placeholder to allow signup to complete
            idProofUrl = 'https://res.cloudinary.com/demo/image/upload/sample_id_proof.png';
        }

        // 5) Create new vendor
        try {
            const newUser = await User.create({
                name, email, phone, password,
                role: 'vendor',
                profile: {
                    studioName,
                    address: { city },
                    idProof: idProofUrl,
                    verificationStatus: 'pending'
                }
            });

            console.log(`✅ Vendor Registered: ${newUser.email}`);
            createSendToken(newUser, 201, res, 'Partner Workspace Active: Verification Pending');
        } catch (dbErr) {
            console.error('❌ DATABASE REGISTRATION FAILURE:', dbErr);
            throw dbErr;
        }
    } catch (error) {
        console.error('❌ CRITICAL SIGNUP FAILURE:', error);
        res.status(400).json({
            status: 'error',
            message: error.message.includes('duplicate key') ? 'Business identity (Email/Phone) already registered.' : error.message
        });
    }
};

// Vendor Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1) Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
        }

        // 2) Check if user exists && password is correct && role is 'vendor'
        const user = await User.findOne({ email, role: 'vendor' }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ status: 'error', message: 'Incorrect email or password' });
        }

        // 3) If everything ok, send token to client
        createSendToken(user, 200, res, 'Vendor login successful');
    } catch (error) {
        console.error('Vendor login error:', error);
        res.status(500).json({ status: 'error', message: 'Error logging in' });
    }
};

// Get Vendor Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Vendor not found' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                vendor: user
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error fetching profile' });
    }
};

// Update Vendor Profile (e.g. inventory)
exports.updateProfile = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Handle ID Proof upload if provided as base64
        const idProofKey = 'profile.idProof';
        if (updateData[idProofKey] && typeof updateData[idProofKey] === 'string' && updateData[idProofKey].startsWith('data:')) {
            try {
                const uploadRes = await cloudinary.uploadImage(updateData[idProofKey], 'clean2wash/vendors/ids');
                updateData[idProofKey] = uploadRes.secure_url;
                updateData['profile.verificationStatus'] = 'pending';
            } catch (err) {
                console.error('Profile ID Proof upload failed:', err);
                delete updateData[idProofKey]; // Prevent saving base64 to DB
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        res.status(200).json({
            status: 'success',
            data: { vendor: user }
        });
    } catch (error) {
        console.error('Error updating vendor profile:', error);
        res.status(500).json({ status: 'error', message: 'Error updating profile' });
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
                message: 'Vendor user not found'
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
                platform: platform || 'unknown',
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
        console.error('Error updating Vendor FCM token:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update FCM token'
        });
    }
};
