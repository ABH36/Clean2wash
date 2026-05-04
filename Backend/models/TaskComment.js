const mongoose = require('mongoose');

const TaskCommentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    
    author: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'author.userType',
            required: true
        },
        userType: {
            type: String,
            enum: ['Admin', 'Captain', 'SpareDriver', 'User'],
            required: true
        },
        name: String,
        avatar: String
    },
    
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true
    },
    
    attachments: [{
        fileUrl: String,
        fileName: String,
        fileType: String
    }],
    
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
TaskCommentSchema.index({ taskId: 1, createdAt: -1 });
TaskCommentSchema.index({ 'author.userId': 1 });

// Update task's commentsCount after save
TaskCommentSchema.post('save', async function() {
    const Task = mongoose.model('Task');
    await Task.findByIdAndUpdate(this.taskId, {
        $inc: { commentsCount: 1 }
    });
});

module.exports = mongoose.model('TaskComment', TaskCommentSchema);
