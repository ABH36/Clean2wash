const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'Setting key is required'],
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Setting value is required']
    },
    category: {
        type: String,
        required: [true, 'Setting category is required'],
        enum: ['General', 'Security', 'Ops', 'Financial'],
        default: 'General'
    },
    description: String,
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
