const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    // Basic Info
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Task description is required'],
        trim: true
    },
    
    // Assignment
    assignedTo: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'assignedTo.userType',
            required: true
        },
        userType: {
            type: String,
            enum: ['Captain', 'SpareDriver', 'Admin', 'User'],
            required: true
        },
        name: String,
        avatar: String
    },
    
    assignedBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            required: true
        },
        name: String,
        avatar: String
    },
    
    // Status & Priority
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Dates
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    
    completedAt: Date,
    
    // Related Entities
    relatedTo: {
        entityType: {
            type: String,
            enum: ['Booking', 'User', 'SpareDriver', 'Captain', 'Hub', 'None'],
            default: 'None'
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'relatedTo.entityType'
        }
    },
    
    // Attachments
    attachments: [{
        fileUrl: String,
        fileName: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Tags
    tags: [String],
    
    // Comments Count (for performance)
    commentsCount: {
        type: Number,
        default: 0
    },
    
    // Metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
TaskSchema.index({ 'assignedTo.userId': 1, status: 1 });
TaskSchema.index({ 'assignedBy.userId': 1 });
TaskSchema.index({ status: 1, priority: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ createdAt: -1 });

// Virtual for overdue status
TaskSchema.virtual('isOverdue').get(function() {
    return this.status !== 'completed' && 
           this.status !== 'cancelled' && 
           this.dueDate < new Date();
});

TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', TaskSchema);
