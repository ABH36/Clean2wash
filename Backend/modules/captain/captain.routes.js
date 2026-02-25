const express = require('express');
const {
    authCaptain,
    registerCaptain,
    getMe,
    toggleStatus,
    getAvailableJobs,
    acceptJob,
    updateJobStatus
} = require('./captain.controller');

const router = express.Router();

const { protect } = require('../../middleware/auth');

router.post('/auth', authCaptain);
router.post('/register', registerCaptain);
router.get('/me', protect, getMe);
router.put('/status', protect, toggleStatus);

// Job routes
router.get('/jobs/available', protect, getAvailableJobs);
router.put('/jobs/:id/accept', protect, acceptJob);
router.put('/jobs/:id/status', protect, updateJobStatus);

module.exports = router;
