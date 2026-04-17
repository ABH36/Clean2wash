const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Role name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        required: [true, 'Role slug is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Role description is required'],
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    level: {
        type: Number,
        required: [true, 'Role level is required'],
        min: 1,
        max: 10,
        default: 5
    },
    isSystem: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Indexes
roleSchema.index({ slug: 1 });
roleSchema.index({ level: 1 });
roleSchema.index({ isActive: 1 });

// Pre-save middleware to generate slug
roleSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
    }
    next();
});

// Method to check if role has specific permission
roleSchema.methods.hasPermission = async function(module, action) {
    await this.populate('permissions');
    
    return this.permissions.some(permission => 
        permission.module === module && 
        (permission.action === action || permission.action === '*')
    );
};

// Method to check if role has any of the permissions
roleSchema.methods.hasAnyPermission = async function(permissionArray) {
    await this.populate('permissions');
    
    return permissionArray.some(perm => {
        const [module, action] = perm.split(':');
        return this.permissions.some(permission =>
            permission.module === module &&
            (permission.action === action || permission.action === '*')
        );
    });
};

// Method to get all permission strings
roleSchema.methods.getPermissionStrings = async function() {
    await this.populate('permissions');
    
    return this.permissions.map(permission => 
        `${permission.module}:${permission.action}`
    );
};

// Static method to get role with permissions
roleSchema.statics.findByIdWithPermissions = function(id) {
    return this.findById(id).populate('permissions');
};

// Static method to get role by slug
roleSchema.statics.findBySlug = function(slug) {
    return this.findOne({ slug }).populate('permissions');
};

// Static method to check if role name exists
roleSchema.statics.nameExists = async function(name, excludeId = null) {
    const query = { name: { $regex: new RegExp(`^${name}$`, 'i') } };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    const role = await this.findOne(query);
    return !!role;
};

// Prevent deletion of system roles
roleSchema.pre('remove', function(next) {
    if (this.isSystem) {
        return next(new Error('Cannot delete system role'));
    }
    next();
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
