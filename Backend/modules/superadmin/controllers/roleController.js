const Role = require('../../../models/Role');
const Permission = require('../../../models/Permission');
const Admin = require('../../../models/Admin');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Get all roles
 * GET /api/superadmin/roles
 */
exports.getAllRoles = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 20,
        search,
        isActive,
        sortBy = 'level',
        sortOrder = 'asc'
    } = req.query;

    // Build filter
    const filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [roles, total] = await Promise.all([
        Role.find(filter)
            .populate('permissions', 'module action description')
            .populate('createdBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Role.countDocuments(filter)
    ]);

    // Get admin count for each role
    const rolesWithCount = await Promise.all(
        roles.map(async (role) => {
            const adminCount = await Admin.countDocuments({ role: role._id });
            return {
                ...role.toObject(),
                adminCount
            };
        })
    );

    res.status(200).json({
        status: 'success',
        results: rolesWithCount.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            roles: rolesWithCount
        }
    });
});

/**
 * Get single role
 * GET /api/superadmin/roles/:id
 */
exports.getRole = catchAsync(async (req, res, next) => {
    const role = await Role.findById(req.params.id)
        .populate('permissions')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!role) {
        return next(new AppError('Role not found', 404));
    }

    // Get admin count
    const adminCount = await Admin.countDocuments({ role: role._id });

    res.status(200).json({
        status: 'success',
        data: {
            role: {
                ...role.toObject(),
                adminCount
            }
        }
    });
});

/**
 * Create new role
 * POST /api/superadmin/roles
 */
exports.createRole = catchAsync(async (req, res, next) => {
    const {
        name,
        description,
        permissions = [],
        level,
        isActive = true
    } = req.body;

    // Validation
    if (!name || !description || !level) {
        return next(new AppError('Please provide name, description, and level', 400));
    }

    // Check if role name already exists
    const nameExists = await Role.nameExists(name);
    if (nameExists) {
        return next(new AppError('Role name already exists', 400));
    }

    // Verify all permissions exist
    if (permissions.length > 0) {
        const permissionDocs = await Permission.find({ _id: { $in: permissions } });
        if (permissionDocs.length !== permissions.length) {
            return next(new AppError('One or more permissions not found', 404));
        }
    }

    // Check if current admin can create role with this level
    const currentAdminRole = await Role.findById(req.admin.role);
    if (currentAdminRole.level > level) {
        return next(new AppError('You cannot create a role with higher privileges than yours', 403));
    }

    // Create role
    const role = await Role.create({
        name,
        description,
        permissions,
        level,
        isActive,
        createdBy: req.admin._id
    });

    await role.populate('permissions', 'module action description');

    res.status(201).json({
        status: 'success',
        message: 'Role created successfully',
        data: {
            role
        }
    });
});

/**
 * Update role
 * PATCH /api/superadmin/roles/:id
 */
exports.updateRole = catchAsync(async (req, res, next) => {
    const {
        name,
        description,
        level,
        isActive
    } = req.body;

    // Find role
    const role = await Role.findById(req.params.id);
    if (!role) {
        return next(new AppError('Role not found', 404));
    }

    // Prevent updating system roles
    if (role.isSystem) {
        return next(new AppError('Cannot update system role', 400));
    }

    // Check if name is being changed and if it already exists
    if (name && name !== role.name) {
        const nameExists = await Role.nameExists(name, role._id);
        if (nameExists) {
            return next(new AppError('Role name already exists', 400));
        }
    }

    // Check if current admin can update this role
    const currentAdminRole = await Role.findById(req.admin.role);
    if (currentAdminRole.level > role.level) {
        return next(new AppError('You cannot update a role with higher privileges than yours', 403));
    }

    // If level is being changed, check permission
    if (level && level !== role.level && currentAdminRole.level > level) {
        return next(new AppError('You cannot set a role level higher than yours', 403));
    }

    // Store old values for activity log
    const oldValues = {
        name: role.name,
        description: role.description,
        level: role.level,
        isActive: role.isActive
    };

    // Update fields
    if (name) role.name = name;
    if (description) role.description = description;
    if (level) role.level = level;
    if (isActive !== undefined) role.isActive = isActive;
    role.updatedBy = req.admin._id;

    await role.save();

    // Attach changes for activity log
    req.activityChanges = {
        before: oldValues,
        after: {
            name: role.name,
            description: role.description,
            level: role.level,
            isActive: role.isActive
        }
    };

    await role.populate('permissions', 'module action description');

    res.status(200).json({
        status: 'success',
        message: 'Role updated successfully',
        data: {
            role
        }
    });
});

/**
 * Delete role
 * DELETE /api/superadmin/roles/:id
 */
exports.deleteRole = catchAsync(async (req, res, next) => {
    const role = await Role.findById(req.params.id);

    if (!role) {
        return next(new AppError('Role not found', 404));
    }

    // Prevent deleting system roles
    if (role.isSystem) {
        return next(new AppError('Cannot delete system role', 400));
    }

    // Check if any admins are using this role
    const adminCount = await Admin.countDocuments({ role: role._id });
    if (adminCount > 0) {
        return next(new AppError(`Cannot delete role. ${adminCount} admin(s) are using this role`, 400));
    }

    // Check if current admin can delete this role
    const currentAdminRole = await Role.findById(req.admin.role);
    if (currentAdminRole.level > role.level) {
        return next(new AppError('You cannot delete a role with higher privileges than yours', 403));
    }

    await role.deleteOne();

    res.status(200).json({
        status: 'success',
        message: 'Role deleted successfully',
        data: null
    });
});

/**
 * Update role permissions
 * PATCH /api/superadmin/roles/:id/permissions
 */
exports.updatePermissions = catchAsync(async (req, res, next) => {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
        return next(new AppError('Permissions must be an array', 400));
    }

    // Find role
    const role = await Role.findById(req.params.id);
    if (!role) {
        return next(new AppError('Role not found', 404));
    }

    // Prevent updating system roles
    if (role.isSystem) {
        return next(new AppError('Cannot update permissions for system role', 400));
    }

    // Check if current admin can update this role
    const currentAdminRole = await Role.findById(req.admin.role);
    if (currentAdminRole.level > role.level) {
        return next(new AppError('You cannot update a role with higher privileges than yours', 403));
    }

    // Verify all permissions exist
    if (permissions.length > 0) {
        const permissionDocs = await Permission.find({ _id: { $in: permissions } });
        if (permissionDocs.length !== permissions.length) {
            return next(new AppError('One or more permissions not found', 404));
        }
    }

    const oldPermissions = role.permissions;
    role.permissions = permissions;
    role.updatedBy = req.admin._id;
    await role.save();

    await role.populate('permissions', 'module action description');

    // Attach changes for activity log
    req.activityChanges = {
        before: { permissionCount: oldPermissions.length },
        after: { permissionCount: role.permissions.length }
    };

    res.status(200).json({
        status: 'success',
        message: 'Permissions updated successfully',
        data: {
            role
        }
    });
});

/**
 * Toggle role status
 * PATCH /api/superadmin/roles/:id/toggle
 */
exports.toggleStatus = catchAsync(async (req, res, next) => {
    const role = await Role.findById(req.params.id);

    if (!role) {
        return next(new AppError('Role not found', 404));
    }

    // Prevent toggling system roles
    if (role.isSystem) {
        return next(new AppError('Cannot toggle system role status', 400));
    }

    const oldStatus = role.isActive;
    role.isActive = !role.isActive;
    role.updatedBy = req.admin._id;
    await role.save();

    // Attach changes for activity log
    req.activityChanges = {
        before: { isActive: oldStatus },
        after: { isActive: role.isActive }
    };

    res.status(200).json({
        status: 'success',
        message: `Role ${role.isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
            role
        }
    });
});

/**
 * Get role statistics
 * GET /api/superadmin/roles/stats
 */
exports.getRoleStats = catchAsync(async (req, res, next) => {
    const total = await Role.countDocuments();
    const active = await Role.countDocuments({ isActive: true });
    const inactive = await Role.countDocuments({ isActive: false });
    const system = await Role.countDocuments({ isSystem: true });
    const custom = await Role.countDocuments({ isSystem: false });

    // Get roles with admin counts
    const rolesWithAdmins = await Role.aggregate([
        {
            $lookup: {
                from: 'admins',
                localField: '_id',
                foreignField: 'role',
                as: 'admins'
            }
        },
        {
            $project: {
                name: 1,
                level: 1,
                adminCount: { $size: '$admins' }
            }
        },
        {
            $sort: { level: 1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            total,
            active,
            inactive,
            system,
            custom,
            rolesWithAdmins
        }
    });
});

/**
 * Duplicate role
 * POST /api/superadmin/roles/:id/duplicate
 */
exports.duplicateRole = catchAsync(async (req, res, next) => {
    const { name } = req.body;

    if (!name) {
        return next(new AppError('Please provide a name for the duplicated role', 400));
    }

    // Find source role
    const sourceRole = await Role.findById(req.params.id).populate('permissions');
    if (!sourceRole) {
        return next(new AppError('Role not found', 404));
    }

    // Check if name already exists
    const nameExists = await Role.nameExists(name);
    if (nameExists) {
        return next(new AppError('Role name already exists', 400));
    }

    // Create duplicate
    const duplicateRole = await Role.create({
        name,
        description: `Copy of ${sourceRole.description}`,
        permissions: sourceRole.permissions.map(p => p._id),
        level: sourceRole.level,
        isActive: false, // Start as inactive
        isSystem: false, // Never duplicate as system role
        createdBy: req.admin._id
    });

    await duplicateRole.populate('permissions', 'module action description');

    res.status(201).json({
        status: 'success',
        message: 'Role duplicated successfully',
        data: {
            role: duplicateRole
        }
    });
});
