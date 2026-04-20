const jwt = require('jsonwebtoken');
const Admin = require('../../../models/Admin');
const ActivityLog = require('../../../models/ActivityLog');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
    return jwt.sign(
        { 
            id,
            role: 'admin'
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
    );
};

/**
 * Admin login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find admin with password
        const admin = await Admin.findOne({ email: email.toLowerCase() })
            .select('+password')
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions'
                }
            });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (admin.isLocked) {
            return res.status(403).json({
                success: false,
                message: 'Account is locked. Please try again later.'
            });
        }

        // Check if account is active
        if (admin.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active'
            });
        }

        // Check password
        const isPasswordCorrect = await admin.correctPassword(password, admin.password);

        if (!isPasswordCorrect) {
            // Increment login attempts
            await admin.incLoginAttempts();

            // Log failed login
            await ActivityLog.create({
                admin: admin._id,
                action: 'LOGIN_FAILED',
                resource: 'Auth',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                status: 'FAILED',
                errorMessage: 'Invalid password'
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Reset login attempts
        await admin.resetLoginAttempts();

        // Log successful login
        await ActivityLog.create({
            admin: admin._id,
            action: 'LOGIN_SUCCESS',
            resource: 'Auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
        });

        // Generate token
        const token = generateToken(admin._id);

        // Remove password from output
        admin.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                admin,
                token,
                mustChangePassword: admin.mustChangePassword
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Get current admin
 */
exports.getMe = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id)
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions'
                }
            });

        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get admin details',
            error: error.message
        });
    }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        // Validate new password length
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters'
            });
        }

        // Get admin with password
        const admin = await Admin.findById(req.admin._id).select('+password');

        // Check current password
        const isPasswordCorrect = await admin.correctPassword(currentPassword, admin.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        admin.password = newPassword;
        admin.mustChangePassword = false;
        await admin.save();

        // Log activity
        await ActivityLog.create({
            admin: admin._id,
            action: 'PASSWORD_CHANGED',
            resource: 'Auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
        });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
    try {
        // Log activity
        await ActivityLog.create({
            admin: req.admin._id,
            action: 'LOGOUT',
            resource: 'Auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};
