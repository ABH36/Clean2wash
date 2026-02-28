const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const jobController = require('../controllers/jobController');
const profileController = require('../controllers/profileController');
const rewardsController = require('../controllers/rewardsController');

router.post('/auth/send-otp', authController.sendOTP);
router.post('/auth/verify-otp', authController.verifyOTP);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);

router.use(authController.protect);

router.get('/profile', authController.getMe);
router.get('/profile/me', profileController.getProfile);
router.put('/profile', profileController.updateProfile);

router.get('/jobs/pending', jobController.getPendingJobs);
router.get('/jobs', jobController.getMyJobs);
router.get('/jobs/:id', jobController.getMyJob);
router.post('/jobs/:id/accept', jobController.acceptJob);
router.patch('/jobs/:id/status', jobController.updateJobStatus);

router.get('/dashboard', jobController.getDashboard);
router.get('/earnings', jobController.getEarnings);
router.get('/history', jobController.getHistory);
router.post('/earnings/withdraw', jobController.withdrawPayout);
router.patch('/online', jobController.toggleOnline);
router.get('/rewards', rewardsController.getRewards);

module.exports = router;
