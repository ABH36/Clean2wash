# 🚀 Antigravity - Day 4 Tasks
## Task Management System - Backend Foundation

**Date**: May 7, 2026  
**Phase**: Phase 1 - Day 4 of 10  
**Feature**: Task Management System (Backend)  
**Estimated Time**: 6-8 hours  
**Status**: Ready to Start

---

## 📋 Overview

Day 4 focuses on building the **backend foundation** for the Task Management System. This system will allow admins to create, assign, track, and manage tasks for team members (Captains, SpareDrivers, Staff).

### **What You'll Build Today**:
1. ✅ Task Model (with priority, status, assignments)
2. ✅ TaskComment Model (for task discussions)
3. ✅ taskService (business logic layer)
4. ✅ taskController (API endpoints)
5. ✅ taskRoutes (route definitions)

---

## 🎯 Success Criteria

By the end of Day 4, you should have:
- ✅ 2 MongoDB models created and indexed
- ✅ 1 service layer with 10+ functions
- ✅ 1 controller with 12+ endpoints
- ✅ RESTful API routes configured
- ✅ All endpoints tested and working
- ✅ Proper error handling and validation
- ✅ Code quality: Production-ready

---

## 📦 Task 1: Create Task Model

**File**: `Backend/models/Task.js`

### **Schema Requirements**:

```javascript
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
```

---

## 📦 Task 2: Create TaskComment Model

**File**: `Backend/models/TaskComment.js`

### **Schema Requirements**:

```javascript
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
```

---

## 📦 Task 3: Create Task Service Layer

**File**: `Backend/services/taskService.js`

### **Functions to Implement**:

```javascript
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
            userId: admin._id,
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
```

---

## 📦 Task 4: Create Task Controller

**File**: `Backend/modules/admin/controllers/taskController.js`

### **Endpoints to Implement**:

```javascript
const taskService = require('../../../services/taskService');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

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
```

---

## 📦 Task 5: Create Task Routes

**File**: `Backend/modules/admin/routes/taskRoutes.js`

### **Routes to Define**:

```javascript
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Task CRUD
router.post('/tasks', taskController.createTask);
router.get('/tasks', taskController.getTasks);
router.get('/tasks/stats', taskController.getTaskStats);
router.get('/tasks/:taskId', taskController.getTask);
router.patch('/tasks/:taskId', taskController.updateTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

// Task status and assignment
router.patch('/tasks/:taskId/status', taskController.updateTaskStatus);
router.patch('/tasks/:taskId/assign', taskController.assignTask);

// Comments
router.post('/tasks/:taskId/comments', taskController.addComment);
router.get('/tasks/:taskId/comments', taskController.getComments);
router.patch('/tasks/comments/:commentId', taskController.updateComment);
router.delete('/tasks/comments/:commentId', taskController.deleteComment);

module.exports = router;
```

---

## 📦 Task 6: Mount Routes in Admin Router

**File**: `Backend/modules/admin/routes/adminRoutes.js`

### **Add this line**:

```javascript
const taskRoutes = require('./taskRoutes');

// ... existing routes ...

// Task Management
router.use('/', taskRoutes);
```

---

## 🧪 Testing Checklist

### **Manual Testing with Postman/Thunder Client**:

```bash
# 1. Create a task
POST /api/admin/tasks
{
  "title": "Fix booking issue",
  "description": "Investigate and fix the booking cancellation bug",
  "assignedTo": {
    "userId": "captain_id_here",
    "userType": "Captain",
    "name": "John Doe"
  },
  "priority": "high",
  "dueDate": "2026-05-10T00:00:00.000Z",
  "tags": ["bug", "urgent"]
}

# 2. Get all tasks
GET /api/admin/tasks?page=1&limit=20

# 3. Get tasks by status
GET /api/admin/tasks?status=pending

# 4. Get overdue tasks
GET /api/admin/tasks?overdue=true

# 5. Get task by ID
GET /api/admin/tasks/:taskId

# 6. Update task
PATCH /api/admin/tasks/:taskId
{
  "status": "in_progress",
  "priority": "urgent"
}

# 7. Update task status
PATCH /api/admin/tasks/:taskId/status
{
  "status": "completed"
}

# 8. Assign task
PATCH /api/admin/tasks/:taskId/assign
{
  "assignedTo": {
    "userId": "new_user_id",
    "userType": "SpareDriver",
    "name": "Jane Smith"
  }
}

# 9. Add comment
POST /api/admin/tasks/:taskId/comments
{
  "content": "I've started working on this task"
}

# 10. Get comments
GET /api/admin/tasks/:taskId/comments

# 11. Get task stats
GET /api/admin/tasks/stats

# 12. Delete task
DELETE /api/admin/tasks/:taskId
```

---

## 📊 Performance Metrics to Track

- ✅ Task creation: < 100ms
- ✅ Task list query: < 50ms (with indexes)
- ✅ Task update: < 50ms
- ✅ Comment creation: < 100ms
- ✅ Stats query: < 100ms

---

## ⚠️ Important Notes

### **1. Error Handling**:
- Use `AppError` for all operational errors
- Use `catchAsync` wrapper for all async functions
- Validate all inputs before processing

### **2. Indexes**:
- Add compound indexes for common queries
- Test query performance with `.explain()`

### **3. Virtual Fields**:
- `isOverdue` virtual field for overdue status
- Enable virtuals in JSON/Object conversion

### **4. Soft Delete**:
- TaskComment uses soft delete (isDeleted flag)
- Task uses hard delete (with cascade to comments)

### **5. Atomic Operations**:
- Use `$inc` for commentsCount updates
- Use post-save hooks for automatic updates

---

## 📝 Daily Report Format

At the end of Day 4, submit a report with:

1. **What I Completed Today**:
   - List all models, services, controllers created
   - List all endpoints implemented

2. **Backend Changes**:
   - Files Created (with paths)
   - Files Modified (with paths)
   - API Endpoints Added (with methods and paths)

3. **Testing Done**:
   - List all endpoints tested
   - Performance metrics recorded

4. **Issues Encountered**:
   - Any problems faced and how you resolved them

5. **Tomorrow's Plan**:
   - Brief outline of Day 5 tasks

6. **Time Spent**: X hours

---

## 🎯 Success Indicators

You'll know Day 4 is successful when:
- ✅ All 12 API endpoints are working
- ✅ Task creation, update, delete working
- ✅ Comments system functional
- ✅ Filters and pagination working
- ✅ Task stats endpoint returning correct data
- ✅ No errors in console
- ✅ Performance metrics within targets

---

## 🚀 Ready to Start?

**Estimated Time**: 6-8 hours  
**Difficulty**: Medium  
**Dependencies**: None (fresh start)

Good luck, Antigravity! Build a solid backend foundation for the Task Management System. Focus on clean code, proper error handling, and comprehensive testing. 🚀

---

*Document Created: May 6, 2026*  
*For: Antigravity*  
*Phase: Phase 1 - Day 4*  
*Feature: Task Management System (Backend)*
