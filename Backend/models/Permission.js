const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    module: {
        type: String,
        required: [true, 'Module is required'],
        trim: true,
        lowercase: true
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        trim: true,
        lowercase: true
    },
    resource: {
        type: String,
        required: [true, 'Resource is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    isSystem: {
        type: Boolean,
        default: true
    },
    metadata: {
        category: {
            type: String,
            default: 'general'
        },
        icon: {
            type: String,
            default: 'shield'
        },
        order: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Compound unique index
permissionSchema.index({ module: 1, action: 1 }, { unique: true });
permissionSchema.index({ resource: 1 });
permissionSchema.index({ 'metadata.category': 1 });

// Virtual for permission string
permissionSchema.virtual('permissionString').get(function() {
    return `${this.module}:${this.action}`;
});

// Static method to get permissions grouped by module
permissionSchema.statics.getGroupedPermissions = async function() {
    const permissions = await this.find().sort({ 'metadata.order': 1, module: 1, action: 1 });
    
    const grouped = {};
    permissions.forEach(permission => {
        if (!grouped[permission.module]) {
            grouped[permission.module] = [];
        }
        grouped[permission.module].push(permission);
    });
    
    return grouped;
};

// Static method to get permissions by category
permissionSchema.statics.getByCategory = async function(category) {
    return this.find({ 'metadata.category': category })
        .sort({ 'metadata.order': 1, module: 1, action: 1 });
};

// Static method to check if permission exists
permissionSchema.statics.exists = async function(module, action) {
    const permission = await this.findOne({ module, action });
    return !!permission;
};

// Static method to find by permission string
permissionSchema.statics.findByString = async function(permissionString) {
    const [module, action] = permissionString.split(':');
    return this.findOne({ module, action });
};

// Static method to bulk create permissions
permissionSchema.statics.bulkCreatePermissions = async function(permissionsArray) {
    const operations = permissionsArray.map(perm => ({
        updateOne: {
            filter: { module: perm.module, action: perm.action },
            update: { $set: perm },
            upsert: true
        }
    }));
    
    return this.bulkWrite(operations);
};

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
