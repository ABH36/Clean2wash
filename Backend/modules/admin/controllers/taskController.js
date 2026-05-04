const taskService = require('../../../services/taskService');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Task Controller - Handles task management for admins
 */

// Create task
exports.createTask = catchAsync(async (req, res, next) => {
    const task = await taskService.createTask(req.body, req.admin);
    
    res.status(201).json({
        status: 'success',
        message: 'Task created successfully',
        data: { task }
    });
});

// Get all tasks
exports.getTasks = catchAsync(async (req, res, next) => {
    const filters = {
        status: req.query.status,
        priority: req.query.priority,
        assignedTo: req.query.assignedTo,
        assignedBy: req.query.assignedBy,
        overdue: req.query.overdue,
        search: req.query.search
    };
    
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
    };
    
    const result = await taskService.getTasks(filters, pagination);
    
    res.status(200).json({
        status: 'success',
        ...result
    });
});

// Get task by ID
exports.getTask = catchAsync(async (req, res, next) => {
    const task = await taskService.getTaskById(req.params.taskId);
    
    res.status(200).json({
        status: 'success',
        data: { task }
    });
});

// Update task
exports.updateTask = catchAsync(async (req, res, next) => {
    const task = await taskService.updateTask(req.params.taskId, req.body);
    
    res.status(200).json({
        status: 'success',
        message: 'Task updated successfully',
        data: { task }
    });
});

// Delete task
exports.deleteTask = catchAsync(async (req, res, next) => {
    await taskService.deleteTask(req.params.taskId);
    
    res.status(200).json({
        status: 'success',
        message: 'Task deleted successfully'
    });
});

// Add comment
exports.addComment = catchAsync(async (req, res, next) => {
    if (!req.body.content) {
        return next(new AppError('Comment content is required', 400));
    }
    
    const comment = await taskService.addComment(
        req.params.taskId,
        req.body,
        req.admin
    );
    
    res.status(201).json({
        status: 'success',
        message: 'Comment added successfully',
        data: { comment }
    });
});

// Get comments
exports.getComments = catchAsync(async (req, res, next) => {
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
    };
    
    const result = await taskService.getComments(req.params.taskId, pagination);
    
    res.status(200).json({
        status: 'success',
        ...result
    });
});

// Update comment
exports.updateComment = catchAsync(async (req, res, next) => {
    if (!req.body.content) {
        return next(new AppError('Comment content is required', 400));
    }
    
    const comment = await taskService.updateComment(
        req.params.commentId,
        req.body.content
    );
    
    res.status(200).json({
        status: 'success',
        message: 'Comment updated successfully',
        data: { comment }
    });
});

// Delete comment
exports.deleteComment = catchAsync(async (req, res, next) => {
    await taskService.deleteComment(req.params.commentId);
    
    res.status(200).json({
        status: 'success',
        message: 'Comment deleted successfully'
    });
});

// Get task statistics
exports.getTaskStats = catchAsync(async (req, res, next) => {
    const filters = {
        assignedTo: req.query.assignedTo
    };
    
    const stats = await taskService.getTaskStats(filters);
    
    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});

// Update task status
exports.updateTaskStatus = catchAsync(async (req, res, next) => {
    if (!req.body.status) {
        return next(new AppError('Status is required', 400));
    }
    
    const task = await taskService.updateTask(req.params.taskId, {
        status: req.body.status
    });
    
    res.status(200).json({
        status: 'success',
        message: 'Task status updated successfully',
        data: { task }
    });
});

// Assign task to user
exports.assignTask = catchAsync(async (req, res, next) => {
    if (!req.body.assignedTo || !req.body.assignedTo.userId) {
        return next(new AppError('Please provide assignment details', 400));
    }
    
    const task = await taskService.updateTask(req.params.taskId, {
        assignedTo: req.body.assignedTo
    });
    
    res.status(200).json({
        status: 'success',
        message: 'Task assigned successfully',
        data: { task }
    });
});
