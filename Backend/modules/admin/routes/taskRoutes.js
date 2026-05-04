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
