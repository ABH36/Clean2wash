const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const AppError = require('../utils/AppError');

class TaskService {
    /**
     * Create a new task
     * @param {Object} taskData - Task data
     * @param {Object} admin - Admin creating the task
     * @returns {Promise<Object>} Created task
     */
    async createTask(taskData, admin) {
        // Validate assignedTo
        if (!taskData.assignedTo || !taskData.assignedTo.userId || !taskData.assignedTo.userType) {
            throw new AppError('Please provide valid assignment details', 400);
        }
        
        // Set assignedBy
        taskData.assignedBy = {
            userId: admin._id || admin.id,
            name: admin.name,
            avatar: admin.avatar
        };
        
        const task = await Task.create(taskData);
        return task;
    }
    
    /**
     * Get tasks with filters and pagination
     * @param {Object} filters - Filter criteria
     * @param {Object} pagination - Page and limit
     * @returns {Promise<Object>} Tasks and metadata
     */
    async getTasks(filters = {}, pagination = {}) {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;
        
        const query = {};
        
        // Filter by status
        if (filters.status) {
            query.status = filters.status;
        }
        
        // Filter by priority
        if (filters.priority) {
            query.priority = filters.priority;
        }
        
        // Filter by assignedTo
        if (filters.assignedTo) {
            query['assignedTo.userId'] = filters.assignedTo;
        }
        
        // Filter by assignedBy
        if (filters.assignedBy) {
            query['assignedBy.userId'] = filters.assignedBy;
        }
        
        // Filter by overdue
        if (filters.overdue === 'true') {
            query.dueDate = { $lt: new Date() };
            query.status = { $nin: ['completed', 'cancelled'] };
        }
        
        // Search by title
        if (filters.search) {
            query.title = { $regex: filters.search, $options: 'i' };
        }
        
        const [tasks, total] = await Promise.all([
            Task.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean(),
            Task.countDocuments(query)
        ]);
        
        return {
            tasks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * Get task by ID
     * @param {String} taskId - Task ID
     * @returns {Promise<Object>} Task details
     */
    async getTaskById(taskId) {
        const task = await Task.findById(taskId).lean();
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        return task;
    }
    
    /**
     * Update task
     * @param {String} taskId - Task ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated task
     */
    async updateTask(taskId, updateData) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        
        // If status is being changed to completed, set completedAt
        if (updateData.status === 'completed' && task.status !== 'completed') {
            updateData.completedAt = new Date();
        }
        
        Object.assign(task, updateData);
        await task.save();
        
        return task;
    }
    
    /**
     * Delete task
     * @param {String} taskId - Task ID
     * @returns {Promise<void>}
     */
    async deleteTask(taskId) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        
        // Delete all comments
        await TaskComment.deleteMany({ taskId });
        
        // Delete task
        await task.deleteOne();
    }
    
    /**
     * Add comment to task
     * @param {String} taskId - Task ID
     * @param {Object} commentData - Comment data
     * @param {Object} author - Comment author
     * @returns {Promise<Object>} Created comment
     */
    async addComment(taskId, commentData, author) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        
        const comment = await TaskComment.create({
            taskId,
            author: {
                userId: author._id || author.id,
                userType: author.userType || 'Admin',
                name: author.name,
                avatar: author.avatar
            },
            content: commentData.content,
            attachments: commentData.attachments || []
        });
        
        return comment;
    }
    
    /**
     * Get comments for a task
     * @param {String} taskId - Task ID
     * @param {Object} pagination - Page and limit
     * @returns {Promise<Object>} Comments and metadata
     */
    async getComments(taskId, pagination = {}) {
        const { page = 1, limit = 50 } = pagination;
        const skip = (page - 1) * limit;
        
        const [comments, total] = await Promise.all([
            TaskComment.find({ taskId, isDeleted: false })
                .sort({ createdAt: 1 })
                .limit(limit)
                .skip(skip)
                .lean(),
            TaskComment.countDocuments({ taskId, isDeleted: false })
        ]);
        
        return {
            comments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * Update comment
     * @param {String} commentId - Comment ID
     * @param {String} content - New content
     * @returns {Promise<Object>} Updated comment
     */
    async updateComment(commentId, content) {
        const comment = await TaskComment.findById(commentId);
        if (!comment) {
            throw new AppError('Comment not found', 404);
        }
        
        comment.content = content;
        await comment.save();
        
        return comment;
    }
    
    /**
     * Delete comment (soft delete)
     * @param {String} commentId - Comment ID
     * @returns {Promise<void>}
     */
    async deleteComment(commentId) {
        const comment = await TaskComment.findById(commentId);
        if (!comment) {
            throw new AppError('Comment not found', 404);
        }
        
        comment.isDeleted = true;
        await comment.save();
        
        // Decrement task's commentsCount
        await Task.findByIdAndUpdate(comment.taskId, {
            $inc: { commentsCount: -1 }
        });
    }
    
    /**
     * Get task statistics
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} Statistics
     */
    async getTaskStats(filters = {}) {
        const query = {};
        
        if (filters.assignedTo) {
            query['assignedTo.userId'] = filters.assignedTo;
        }
        
        const [
            total,
            pending,
            inProgress,
            completed,
            cancelled,
            overdue
        ] = await Promise.all([
            Task.countDocuments(query),
            Task.countDocuments({ ...query, status: 'pending' }),
            Task.countDocuments({ ...query, status: 'in_progress' }),
            Task.countDocuments({ ...query, status: 'completed' }),
            Task.countDocuments({ ...query, status: 'cancelled' }),
            Task.countDocuments({
                ...query,
                status: { $nin: ['completed', 'cancelled'] },
                dueDate: { $lt: new Date() }
            })
        ]);
        
        return {
            total,
            pending,
            inProgress,
            completed,
            cancelled,
            overdue
        };
    }
}

module.exports = new TaskService();
