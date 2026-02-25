const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ConsumerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        unique: true,
        match: [
            /^\d{10}$/,
            'Please add a valid 10 digit phone number'
        ]
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        default: 'consumer'
    },
    addresses: [{
        label: String, // Home, Work, etc
        address: String,
        isPrimary: Boolean,
        coordinates: {
            lat: Number,
            lng: Number
        }
    }],
    vehicles: [{
        brand: String,
        model: String,
        type: String, // Sedan, SUV, etc
        plate: String,
        color: String,
        isPrimary: Boolean
    }],
    wallet: {
        balance: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// JSON Web Token
ConsumerSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

module.exports = mongoose.model('Consumer', ConsumerSchema);
