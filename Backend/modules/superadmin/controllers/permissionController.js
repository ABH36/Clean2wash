const Permission = require('../../../models/Permission');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Get all permissions
 * GET /api/superadmin/permissions
 */
exports.getAllPermissions = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 100,
        module,
        category,
        sortBy = 'metadata.order',
        sortOrder = 'asc'
    } = req.query;

    // Build filter
    const filter = {};

    if (module) {
        filter.module = module;
    }

    if (category) {
        filter['metadata.category'] = category;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1, module: 1, action: 1 };

    // Execute query
    const [permissions, total] = await Promise.all([
        Permission.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Permission.countDocuments(filter)
    ]);

    res.status(200).json({
        status: 'success',
        results: permissions.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            permissions
        }
    });
});

/**
 * Get permissions grouped by module
 * GET /api/superadmin/permissions/grouped
 */
exports.getGroupedPermissions = catchAsync(async (req, res, next) => {
    const grouped = await Permission.getGroupedPermissions();

    // Get module metadata
    const modules = Object.keys(grouped).map(module => ({
        module,
        permissions: grouped[module],
        count: grouped[module].length
    }));

    res.status(200).json({
        status: 'success',
        data: {
            modules,
            grouped
        }
    });
});

/**
 * Get permissions by category
 * GET /api/superadmin/permissions/category/:category
 */
exports.getByCategory = catchAsync(async (req, res, next) => {
    const { category } = req.params;

    const permissions = await Permission.getByCategory(category);

    res.status(200).json({
        status: 'success',
        results: permissions.length,
        data: {
            permissions
        }
    });
});

/**
 * Get single permission
 * GET /api/superadmin/permissions/:id
 */
exports.getPermission = catchAsync(async (req, res, next) => {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
        return next(new AppError('Permission not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            permission
        }
    });
});

/**
 * Create new permission (System only - rarely used)
 * POST /api/superadmin/permissions
 */
exports.createPermission = catchAsync(async (req, res, next) => {
    const {
        module,
        action,
        resource,
        description,
        metadata
    } = req.body;

    // Validation
    if (!module || !action || !resource || !description) {
        return next(new AppError('Please provide module, action, resource, and description', 400));
    }

    // Check if permission already exists
    const exists = await Permission.exists(module, action);
    if (exists) {
        return next(new AppError('Permission already exists', 400));
    }

    // Create permission
    const permission = await Permission.create({
        module,
        action,
        resource,
        description,
        isSystem: false, // Custom permissions are not system permissions
        metadata: metadata || {}
    });

    res.status(201).json({
        status: 'success',
        message: 'Permission created successfully',
        data: {
            permission
        }
    });
});

/**
 * Update permission
 * PATCH /api/superadmin/permissions/:id
 */
exports.updatePermission = catchAsync(async (req, res, next) => {
    const {
        description,
        metadata
    } = req.body;

    const permission = await Permission.findById(req.params.id);

    if (!permission) {
        return next(new AppError('Permission not found', 404));
    }

    // Prevent updating system permissions' core fields
    if (permission.isSystem) {
        return next(new AppError('Cannot update system permission', 400));
    }

    // Update allowed fields
    if (description) permission.description = description;
    if (metadata) permission.metadata = { ...permission.metadata, ...metadata };

    await permission.save();

    res.status(200).json({
        status: 'success',
        message: 'Permission updated successfully',
        data: {
            permission
        }
    });
});

/**
 * Delete permission (Custom permissions only)
 * DELETE /api/superadmin/permissions/:id
 */
exports.deletePermission = catchAsync(async (req, res, next) => {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
        return next(new AppError('Permission not found', 404));
    }

    // Prevent deleting system permissions
    if (permission.isSystem) {
        return next(new AppError('Cannot delete system permission', 400));
    }

    // Check if any roles are using this permission
    const Role = require('../../../models/Role');
    const rolesUsingPermission = await Role.countDocuments({
        permissions: permission._id
    });

    if (rolesUsingPermission > 0) {
        return next(new AppError(`Cannot delete permission. ${rolesUsingPermission} role(s) are using this permission`, 400));
    }

    await permission.deleteOne();

    res.status(200).json({
        status: 'success',
        message: 'Permission deleted successfully',
        data: null
    });
});

/**
 * Get permission statistics
 * GET /api/superadmin/permissions/stats
 */
exports.getPermissionStats = catchAsync(async (req, res, next) => {
    const total = await Permission.countDocuments();
    const system = await Permission.countDocuments({ isSystem: true });
    const custom = await Permission.countDocuments({ isSystem: false });

    // Group by module
    const byModule = await Permission.aggregate([
        {
            $group: {
                _id: '$module',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    // Group by category
    const byCategory = await Permission.aggregate([
        {
            $group: {
                _id: '$metadata.category',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            total,
            system,
            custom,
            byModule,
            byCategory
        }
    });
});

/**
 * Bulk create permissions
 * POST /api/superadmin/permissions/bulk
 */
exports.bulkCreatePermissions = catchAsync(async (req, res, next) => {
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
        return next(new AppError('Please provide an array of permissions', 400));
    }

    // Validate each permission
    for (const perm of permissions) {
        if (!perm.module || !perm.action || !perm.resource || !perm.description) {
            return next(new AppError('Each permission must have module, action, resource, and description', 400));
        }
    }

    // Bulk create using upsert
    const result = await Permission.bulkCreatePermissions(permissions);

    res.status(201).json({
        status: 'success',
        message: 'Permissions created successfully',
        data: {
            inserted: result.nUpserted,
            modified: result.nModified,
            total: result.nUpserted + result.nModified
        }
    });
});

/**
 * Search permissions
 * GET /api/superadmin/permissions/search
 */
exports.searchPermissions = catchAsync(async (req, res, next) => {
    const { q } = req.query;

    if (!q) {
        return next(new AppError('Please provide search query', 400));
    }

    const permissions = await Permission.find({
        $or: [
            { module: { $regex: q, $options: 'i' } },
            { action: { $regex: q, $options: 'i' } },
            { resource: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
        ]
    }).limit(50);

    res.status(200).json({
        status: 'success',
        results: permissions.length,
        data: {
            permissions
        }
    });
});
