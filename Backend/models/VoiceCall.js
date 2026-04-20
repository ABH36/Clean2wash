const mongoose = require('mongoose');

const voiceCallSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true
    },
    caller: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'caller.type'
        },
        type: {
            type: String,
            required: true,
            enum: ['User', 'SpareDriver']
        },
        name: String,
        phone: String,
        maskedPhone: String // For privacy
    },
    receiver: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'receiver.type'
        },
        type: {
            type: String,
            required: true,
            enum: ['User', 'SpareDriver']
        },
        name: String,
        phone: String,
        maskedPhone: String // For privacy
    },
    callType: {
        type: String,
        enum: ['voice', 'video'],
        default: 'voice'
    },
    status: {
        type: String,
        enum: ['initiated', 'ringing', 'connected', 'ended', 'missed', 'rejected', 'failed'],
        default: 'initiated'
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    startedAt: Date,
    endedAt: Date,
    callProvider: {
        type: String,
        enum: ['twilio', 'exotel', 'knowlarity', 'direct'],
        default: 'direct'
    },
    callSid: String, // Provider's call ID
    recordingUrl: String,
    metadata: {
        endReason: String, // 'completed', 'busy', 'no-answer', 'failed'
        quality: Number, // 1-5 rating
        feedback: String,
        cost: Number
    }
}, {
    timestamps: true
});

// Indexes
voiceCallSchema.index({ bookingId: 1, createdAt: -1 });
voiceCallSchema.index({ 'caller.id': 1, createdAt: -1 });
voiceCallSchema.index({ 'receiver.id': 1, createdAt: -1 });
voiceCallSchema.index({ status: 1 });

// Calculate call duration
voiceCallSchema.methods.calculateDuration = function() {
    if (this.startedAt && this.endedAt) {
        this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
    }
    return this.duration;
};

// End call
voiceCallSchema.methods.endCall = function(reason = 'completed') {
    this.status = 'ended';
    this.endedAt = new Date();
    this.metadata.endReason = reason;
    this.calculateDuration();
    return this.save();
};

module.exports = mongoose.model('VoiceCall', voiceCallSchema);
