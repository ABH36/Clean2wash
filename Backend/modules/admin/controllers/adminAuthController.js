const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = (id) => {
    return jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d'
    });
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password'
            });
        }

        const admin = await User.findOne({ email, role: 'admin' }).select('+password');

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }

        const token = signToken(admin._id);

        admin.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                admin
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to log in'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const admin = await User.findById(req.user.id);
        res.status(200).json({
            status: 'success',
            data: { admin }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
    }
};
