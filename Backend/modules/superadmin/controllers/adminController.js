const Admin = require('../../../models/Admin');
const Role = require('../../../models/Role');
const ActivityLog = require('../../../models/ActivityLog');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const crypto = require('crypto');

/**
 * Get all admins
 * GET /api/superadmin/admins
 */
exports.getAllAdmins = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        search,
        status,
        role,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    if (status) {
        filter.status = status;
    }

    if (role) {
        filter.role = role;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [admins, total] = await Promise.all([
        Admin.find(filter)
            .populate({
                path: 'role',
                select: 'name slug level permissions',
                populate: {
                    path: 'permissions',
                    select: 'module action description'
                }
            })
            .populate('createdBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password'),
        Admin.countDocuments(filter)
    ]);

    res.status(200).json({
        status: 'success',
        results: admins.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            admins
        }
    });
});

/**
 * Get single admin
 * GET /api/superadmin/admins/:id
 */
exports.getAdmin = catchAsync(async (req, res, next) => {
    const admin = await Admin.findById(req.params.id)
        .populate({
            path: 'role',
            populate: {
                path: 'permissions',
                select: 'module action description'
            }
        })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .select('-password');

    if (!admin) {
        return next(new AppError('Admin not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            admin
        }
    });
});

/**
 * Create new admin
 * POST /api/superadmin/admins
 */
exports.createAdmin = catchAsync(async (req, res, next) => {
    const {
        name,
        email,
        password,
        role,
        phone,
        status = 'ACTIVE',
        metadata
    } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
        return next(new AppError('Please provide name, email, password, and role', 400));
    }

    // Check if email already exists
    const emailExists = await Admin.emailExists(email);
    if (emailExists) {
        return next(new AppError('Email already exists', 400));
    }

    // Verify role exists
    const roleDoc = await Role.findById(role);
    if (!roleDoc) {
        return next(new AppError('Role not found', 404));
    }

    // Check if current admin can assign this role
    const currentAdminRole = await Role.findById(req.admin.role);
    if (currentAdminRole.level > roleDoc.level) {
        return next(new AppError('You cannot assign a role with higher privileges than yours', 403));
    }

    // Create admin
    const admin = await Admin.create({
        name,
        email,
        password,
        role,
        phone,
        status,
        metadata,
        createdBy: req.admin._id
    });

    // Remove password from response
    admin.password = undefined;

    // Populate role
    await admin.populate('role', 'name slug level');

    res.status(201).json({
        status: 'success',
        message: 'Admin created successfully',
        data: {
            admin
        }
    });
});

/**
 * Update admin
 * PATCH /api/superadmin/admins/:id
 */
exports.updateAdmin = catchAsync(async (req, res, next) => {
    const {
        name,
        email,
        phone,
        status,
        metadata
    } = req.body;

    // Find admin
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
        return next(new AppError('Admin not found', 404));
    }

    // Prevent self-status change
    if (status && admin._id.toString() === req.admin._id.toString()) {
        return next(new AppError('You cannot change your own status', 400));
    }

    // Check email uniqueness if changed
    if (email && email !== admin.email) {
        const emailExists = await Admin.emailExists(email, admin._id);
        if (emailExists) {
            return next(new AppError('Email already exists', 400));
        }
    }

    // Store old values for activity log
    const oldValues = {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        status: admin.status
    };

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (phone) admin.phone = phone;
    if (status) admin.status = status;
    if (metadata) admin.metadata = { ...admin.metadata, ...metadata };
    admin.updatedBy = req.admin._id;

    await admin.save();

    // Attach changes for activity log
    req.activityChanges = {
        before: oldValues,
        after: {
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            status: admin.status
        }
    };

    await admin.populate('role', 'name slug level');

    res.status(200).json({
        status: 'success',
        message: 'Admin updated successfully',
        data: {
            admin
        }
    });
});

/**
 * Delete admin
 * DELETE /api/superadmin/admins/:id
 */
exports.deleteAdmin = catchAsync(async (req, res, next) => {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
        return next(new AppError('Admin not found', 404));
    }

    // Prevent self-deletion
    if (admin._id.toString() === req.admin._id.toString()) {
        return next(new AppError('You cannot delete your own account', 400));
    }

    // Check if admin has higher or equal role level
    const adminRole = await Role.findById(admin.role);
    const currentAdminRole = await Role.findById(req.admin.role);

    if (currentAdminRole.level >= adminRole.level) {
        return next(new AppError('You cannot delete an admin with equal or higher privileges', 403));
    }

    await admin.deleteOne();

    res.status(200).json({
        status: 'success',
        message: 'Admin deleted successfully',
        data: null
    });
});

/**
 * Toggle admin status
 * PATCH /api/superadmin/admins/:id/status
 */
exports.toggleStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        return next(new AppError('Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED', 400));
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
        return next(new AppError('Admin not found', 404));
    }

    // Prevent self-status change
    if (admin._id.toString() === req.admin._id.toString()) {
        return next(new AppError('You cannot change your own status', 400));
    }

    const oldStatus = admin.status;
    admin.status = status;
    admin.updatedBy = req.admin._id;
    await admin.save();

    // Attach changes for activity log
    req.activityChanges = {
        before: { status: oldStatus },
        after: { status: admin.status }
    };

    res.status(200).json({
        status: 'success',
        message: `Admin ${status.toLowerCase()} successfully`,
        data: {
            admin
        }
    });
});

/**
 * Assign role to admin
 * PATCH /api/superadmin/admins/:id/role
 */
exports.assignRole = catchAsync(async (req, res, next) => {
    const { roleId } = req.body;

    if (!roleId) {
        return next(new AppError('Please provide role ID', 400));
    }

    // Find admin
    const admin = await Admin.findById(req.params.id).populate('role');
    if (!admin) {
        return next(new AppError('Admin not found', 404));
    }

    // Prevent self-role change
    if (admin._id.toString() === req.admin._id.toString()) {
        return next(new AppError('You cannot change your own role', 400));
    }

    // Verify new role exists
    const newRole = await Role.findById(roleId);
    if (!newRole) {
        return next(new AppError('Role not found', 404));
    }

    // Check if current admin can assign this role
    const currentAdminRole = await Role.findById(req.admin.role);
    if (currentAdminRole.level > newRole.level) {
        return next(new AppError('You cannot assign a role with higher privileges than yours', 403));
    }

    const oldRole = admin.role;
    admin.role = roleId;
    admin.updatedBy = req.admin._id;
    await admin.save();

    await admin.populate('role', 'name slug level');

    // Attach changes for activity log
    req.activityChanges = {
        before: { role: oldRole.name },
        after: { role: admin.role.name }
    };

    res.status(200).json({
        status: 'success',
        message: 'Role assigned successfully',
        data: {
            admin
        }
    });
});

/**
 * Reset admin password
 * POST /api/superadmin/admins/:id/reset-password
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
        return next(new AppError('Admin not found', 404));
    }

    // Generate random password
    const newPassword = crypto.randomBytes(8).toString('hex');

    admin.password = newPassword;
    admin.mustChangePassword = true;
    admin.updatedBy = req.admin._id;
    await admin.save();

    res.status(200).json({
        status: 'success',
        message: 'Password reset successfully',
        data: {
            temporaryPassword: newPassword,
            note: 'Admin must change password on next login'
        }
    });
});

/**
 * Get admin statistics
 * GET /api/superadmin/admins/stats
 */
exports.getAdminStats = catchAsync(async (req, res, next) => {
    const stats = await Admin.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const roleStats = await Admin.aggregate([
        {
            $lookup: {
                from: 'roles',
                localField: 'role',
                foreignField: '_id',
                as: 'roleInfo'
            }
        },
        {
            $unwind: '$roleInfo'
        },
        {
            $group: {
                _id: '$roleInfo.name',
                count: { $sum: 1 }
            }
        }
    ]);

    const total = await Admin.countDocuments();
    const activeCount = await Admin.countDocuments({ status: 'ACTIVE' });
    const inactiveCount = await Admin.countDocuments({ status: 'INACTIVE' });
    const suspendedCount = await Admin.countDocuments({ status: 'SUSPENDED' });

    res.status(200).json({
        status: 'success',
        data: {
            total,
            active: activeCount,
            inactive: inactiveCount,
            suspended: suspendedCount,
            byStatus: stats,
            byRole: roleStats
        }
    });
});

/**
 * Get admin activity
 * GET /api/superadmin/admins/:id/activity
 */
exports.getAdminActivity = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
        ActivityLog.find({ admin: req.params.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        ActivityLog.countDocuments({ admin: req.params.id })
    ]);

    res.status(200).json({
        status: 'success',
        results: activities.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            activities
        }
    });
});
