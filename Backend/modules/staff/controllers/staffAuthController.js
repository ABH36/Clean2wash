const User = require('../../../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
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
        message,
        token,
        data: {
            user
        }
    });
};

// Staff Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email, role: 'staff' }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ status: 'error', message: 'Incorrect email or password' });
        }

        createSendToken(user, 200, res, 'Login successful');
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error logging in' });
    }
};

// Get Staff Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('vendorId', 'name studioName phone email');

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Staff member not found' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                staff: user
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error fetching profile' });
    }
};
