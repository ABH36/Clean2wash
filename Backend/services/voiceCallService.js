const VoiceCall = require('../models/VoiceCall');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SpareDriver = require('../models/SpareDriver');
const socketService = require('../services/enhancedSocketService');
const { sendNotification } = require('../utils/notificationService');

/**
 * Voice Call Service - Production-grade calling system
 * Supports direct calls and masked calling for privacy
 */

/**
 * Initiate a voice call
 */
const initiateCall = async (bookingId, callerId, callerType) => {
    // Validate booking
    const booking = await Booking.findById(bookingId)
        .populate('consumer')
        .populate('provider.id');

    if (!booking) {
        throw new Error('Booking not found');
    }

    // Determine receiver
    let receiverId, receiverType, receiverName, receiverPhone;
    let callerName, callerPhone;

    if (callerType === 'User') {
        // User calling driver
        const user = await User.findById(callerId);
        callerName = user.name;
        callerPhone = user.phone;

        receiverId = booking.provider?.id?._id || booking.provider?.id;
        receiverType = 'SpareDriver';
        receiverName = booking.provider?.id?.name;
        receiverPhone = booking.provider?.id?.phone;
    } else if (callerType === 'SpareDriver') {
        // Driver calling user
        const driver = await SpareDriver.findById(callerId);
        callerName = driver.name;
        callerPhone = driver.phone;

        receiverId = booking.consumer._id;
        receiverType = 'User';
        receiverName = booking.consumer.name;
        receiverPhone = booking.consumer.phone;
    }

    if (!receiverId) {
        throw new Error('Receiver not found for this booking');
    }

    // Create call record
    const call = await VoiceCall.create({
        bookingId,
        caller: {
            id: callerId,
            type: callerType,
            name: callerName,
            phone: callerPhone,
            maskedPhone: generateMaskedNumber(callerPhone)
        },
        receiver: {
            id: receiverId,
            type: receiverType,
            name: receiverName,
            phone: receiverPhone,
            maskedPhone: generateMaskedNumber(receiverPhone)
        },
        callType: 'voice',
        status: 'initiated',
        callProvider: 'direct' // Can be changed to 'twilio', 'exotel', etc.
    });

    // Send real-time notification via socket
    const socket = socketService.getIO();
    if (socket) {
        // Notify receiver about incoming call
        socket.to(`${receiverType.toLowerCase()}_${receiverId}`).emit('incoming_call', {
            callId: call._id,
            bookingId,
            caller: {
                id: callerId,
                type: callerType,
                name: callerName,
                maskedPhone: call.caller.maskedPhone
            }
        });
    }

    // Send push notification
    await sendNotification(receiverId, {
        title: `Incoming call from ${callerName}`,
        message: `${callerName} is calling you`,
        type: 'call',
        priority: 'urgent',
        sound: 'call_ringtone',
        data: {
            callId: call._id.toString(),
            bookingId: bookingId.toString(),
            callerType,
            callerId: callerId.toString()
        }
    });

    return call;
};

/**
 * Answer a call
 */
const answerCall = async (callId, receiverId) => {
    const call = await VoiceCall.findById(callId);

    if (!call) {
        throw new Error('Call not found');
    }

    if (call.receiver.id.toString() !== receiverId.toString()) {
        throw new Error('Unauthorized to answer this call');
    }

    call.status = 'connected';
    call.startedAt = new Date();
    await call.save();

    // Notify caller that call was answered
    const socket = socketService.getIO();
    if (socket) {
        socket.to(`${call.caller.type.toLowerCase()}_${call.caller.id}`).emit('call_answered', {
            callId: call._id,
            bookingId: call.bookingId
        });
    }

    return call;
};

/**
 * Reject a call
 */
const rejectCall = async (callId, receiverId, reason = 'rejected') => {
    const call = await VoiceCall.findById(callId);

    if (!call) {
        throw new Error('Call not found');
    }

    if (call.receiver.id.toString() !== receiverId.toString()) {
        throw new Error('Unauthorized to reject this call');
    }

    call.status = 'rejected';
    call.endedAt = new Date();
    call.metadata.endReason = reason;
    await call.save();

    // Notify caller that call was rejected
    const socket = socketService.getIO();
    if (socket) {
        socket.to(`${call.caller.type.toLowerCase()}_${call.caller.id}`).emit('call_rejected', {
            callId: call._id,
            bookingId: call.bookingId,
            reason
        });
    }

    return call;
};

/**
 * End a call
 */
const endCall = async (callId, userId, reason = 'completed') => {
    const call = await VoiceCall.findById(callId);

    if (!call) {
        throw new Error('Call not found');
    }

    // Verify user is part of this call
    const isParticipant = (
        call.caller.id.toString() === userId.toString() ||
        call.receiver.id.toString() === userId.toString()
    );

    if (!isParticipant) {
        throw new Error('Unauthorized to end this call');
    }

    await call.endCall(reason);

    // Notify other party
    const socket = socketService.getIO();
    if (socket) {
        const otherPartyId = call.caller.id.toString() === userId.toString()
            ? call.receiver.id
            : call.caller.id;

        const otherPartyType = call.caller.id.toString() === userId.toString()
            ? call.receiver.type
            : call.caller.type;

        socket.to(`${otherPartyType.toLowerCase()}_${otherPartyId}`).emit('call_ended', {
            callId: call._id,
            bookingId: call.bookingId,
            duration: call.duration,
            reason
        });
    }

    return call;
};

/**
 * Get call history for a booking
 */
const getCallHistory = async (bookingId, userId, userType) => {
    // Verify user has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new Error('Booking not found');
    }

    const hasAccess = (
        (userType === 'User' && booking.consumer.toString() === userId.toString()) ||
        (userType === 'SpareDriver' && booking.provider?.id?.toString() === userId.toString())
    );

    if (!hasAccess) {
        throw new Error('Access denied to this call history');
    }

    const calls = await VoiceCall.find({ bookingId })
        .sort({ createdAt: -1 })
        .lean();

    return calls;
};

/**
 * Get active call for a booking
 */
const getActiveCall = async (bookingId) => {
    return await VoiceCall.findOne({
        bookingId,
        status: { $in: ['initiated', 'ringing', 'connected'] }
    }).lean();
};

/**
 * Mark call as missed
 */
const markAsMissed = async (callId) => {
    const call = await VoiceCall.findById(callId);

    if (!call) {
        throw new Error('Call not found');
    }

    if (call.status === 'initiated' || call.status === 'ringing') {
        call.status = 'missed';
        call.endedAt = new Date();
        call.metadata.endReason = 'no-answer';
        await call.save();

        // Notify caller
        const socket = socketService.getIO();
        if (socket) {
            socket.to(`${call.caller.type.toLowerCase()}_${call.caller.id}`).emit('call_missed', {
                callId: call._id,
                bookingId: call.bookingId
            });
        }
    }

    return call;
};

/**
 * Generate masked phone number for privacy
 */
const generateMaskedNumber = (phone) => {
    if (!phone) return null;

    // Mask middle digits: +91 98765 43210 -> +91 98*** **210
    const phoneStr = phone.toString();
    if (phoneStr.length >= 10) {
        const start = phoneStr.substring(0, phoneStr.length - 7);
        const end = phoneStr.substring(phoneStr.length - 3);
        return `${start}*** **${end}`;
    }

    return phoneStr;
};

/**
 * Get call statistics for a user
 */
const getCallStats = async (userId, userType) => {
    const stats = await VoiceCall.aggregate([
        {
            $match: {
                $or: [
                    { 'caller.id': userId, 'caller.type': userType },
                    { 'receiver.id': userId, 'receiver.type': userType }
                ]
            }
        },
        {
            $group: {
                _id: null,
                totalCalls: { $sum: 1 },
                completedCalls: {
                    $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
                },
                missedCalls: {
                    $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
                },
                rejectedCalls: {
                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                },
                totalDuration: { $sum: '$duration' },
                avgDuration: { $avg: '$duration' }
            }
        }
    ]);

    return stats[0] || {
        totalCalls: 0,
        completedCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0,
        totalDuration: 0,
        avgDuration: 0
    };
};

module.exports = {
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    getCallHistory,
    getActiveCall,
    markAsMissed,
    getCallStats
};
