const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const voiceCallService = require('../services/voiceCallService');

/**
 * Initiate a voice call
 */
exports.initiateCall = catchAsync(async (req, res, next) => {
    const { bookingId } = req.body;

    if (!bookingId) {
        return next(new AppError('Please provide bookingId', 400));
    }

    const call = await voiceCallService.initiateCall(
        bookingId,
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User'
    );

    res.status(201).json({
        status: 'success',
        data: { call }
    });
});

/**
 * Answer a call
 */
exports.answerCall = catchAsync(async (req, res, next) => {
    const { callId } = req.params;

    const call = await voiceCallService.answerCall(callId, req.user.id);

    res.status(200).json({
        status: 'success',
        data: { call }
    });
});

/**
 * Reject a call
 */
exports.rejectCall = catchAsync(async (req, res, next) => {
    const { callId } = req.params;
    const { reason } = req.body;

    const call = await voiceCallService.rejectCall(
        callId,
        req.user.id,
        reason || 'rejected'
    );

    res.status(200).json({
        status: 'success',
        data: { call }
    });
});

/**
 * End a call
 */
exports.endCall = catchAsync(async (req, res, next) => {
    const { callId } = req.params;
    const { reason } = req.body;

    const call = await voiceCallService.endCall(
        callId,
        req.user.id,
        reason || 'completed'
    );

    res.status(200).json({
        status: 'success',
        data: { call }
    });
});

/**
 * Get call history for a booking
 */
exports.getCallHistory = catchAsync(async (req, res, next) => {
    const { bookingId } = req.params;

    const calls = await voiceCallService.getCallHistory(
        bookingId,
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User'
    );

    res.status(200).json({
        status: 'success',
        results: calls.length,
        data: { calls }
    });
});

/**
 * Get active call for a booking
 */
exports.getActiveCall = catchAsync(async (req, res, next) => {
    const { bookingId } = req.params;

    const call = await voiceCallService.getActiveCall(bookingId);

    res.status(200).json({
        status: 'success',
        data: { call }
    });
});

/**
 * Get call statistics
 */
exports.getCallStats = catchAsync(async (req, res, next) => {
    const stats = await voiceCallService.getCallStats(
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User'
    );

    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});
