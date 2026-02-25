const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const Consumer = require('../models/Consumer');
const Captain = require('../models/Captain');
const Vendor = require('../models/Vendor');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check role and find user
        if (decoded.role === 'captain') {
            req.user = await Captain.findById(decoded.id);
        } else if (decoded.role === 'vendor') {
            req.user = await Vendor.findById(decoded.id);
        } else {
            // Default to consumer
            req.user = await Consumer.findById(decoded.id);
        }

        if (!req.user) {
            return next(new ErrorResponse('User not found', 404));
        }

        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
};
