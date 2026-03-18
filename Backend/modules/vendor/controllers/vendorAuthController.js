const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('../../../utils/cloudinary');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res, message) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        message: message,
        data: {
            token,
            vendor: user
        }
    });
};

// Vendor Register
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, studioName, city, idProof } = req.body;

        // 1) Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'User with this email or phone already exists'
            });
        }

        // 2) Create new vendor
        const vendorData = {
            name,
            email,
            phone,
            password,
            role: 'vendor',
            profile: {
                studioName,
                address: { city },
                idProof: '', // Will be updated if upload succeeds
                verificationStatus: 'pending'
            }
        };

        // 2a) Upload idProof to Cloudinary if provided
        if (idProof) {
            try {
                const uploadRes = await cloudinary.uploadImage(idProof, 'clean2wash/vendors/ids');
                vendorData.profile.idProof = uploadRes.secure_url;
            } catch (err) {
                console.error('ID Proof upload failed:', err);
                // We'll proceed without the ID proof for now, or you could return an error
            }
        }

        const newUser = await User.create(vendorData);

        // 3) Send token
        createSendToken(newUser, 201, res, 'Vendor registered successfully');
    } catch (error) {
        console.error('Vendor register error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
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
