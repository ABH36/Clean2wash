const { body, param, query, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Validation Middleware - Comprehensive input validation
 */

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));

        return next(new AppError(
            'Validation failed',
            400,
            { errors: errorMessages }
        ));
    }
    next();
};

// Common validation rules
const commonValidations = {
    // MongoDB ObjectId validation
    mongoId: (field = 'id') => 
        param(field)
            .isMongoId()
            .withMessage(`Invalid ${field} format`),

    // Email validation
    email: (field = 'email') =>
        body(field)
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid email format'),

    // Phone validation (Indian format)
    phone: (field = 'phone') =>
        body(field)
            .matches(/^[6-9]\d{9}$/)
            .withMessage('Invalid phone number. Must be 10 digits starting with 6-9'),

    // Password validation
    password: (field = 'password') =>
        body(field)
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    // Name validation
    name: (field = 'name') =>
        body(field)
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage(`${field} must be between 2 and 100 characters`)
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage(`${field} must contain only letters and spaces`),

    // Coordinates validation
    coordinates: (latField = 'lat', lngField = 'lng') => [
        body(latField)
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid latitude. Must be between -90 and 90'),
        body(lngField)
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid longitude. Must be between -180 and 180')
    ],

    // Amount validation
    amount: (field = 'amount') =>
        body(field)
            .isFloat({ min: 0 })
            .withMessage(`${field} must be a positive number`),

    // Date validation
    date: (field = 'date') =>
        body(field)
            .isISO8601()
            .withMessage('Invalid date format. Use ISO 8601 format'),

    // Enum validation
    enum: (field, values) =>
        body(field)
            .isIn(values)
            .withMessage(`${field} must be one of: ${values.join(', ')}`),

    // Pagination validation
    pagination: () => [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ]
};

// Booking validation rules
const bookingValidations = {
    createBooking: [
        body('vehicleId')
            .isMongoId()
            .withMessage('Invalid vehicle ID'),
        body('serviceId')
            .notEmpty()
            .withMessage('Service ID is required'),
        body('location.address.coordinates.lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid latitude'),
        body('location.address.coordinates.lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid longitude'),
        body('schedule.type')
            .isIn(['instant', 'scheduled'])
            .withMessage('Schedule type must be instant or scheduled'),
        body('schedule.date')
            .optional()
            .isISO8601()
            .withMessage('Invalid date format'),
        handleValidationErrors
    ],

    updateBookingStatus: [
        param('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('status')
            .isIn([
                'pending', 'confirmed', 'accepted', 'assigned', 'pickup-assigned',
                'en_route', 'arrived', 'active', 'picked-up', 'before_photo', 
                'at-studio', 'washing', 'in_progress', 'after_photo', 
                'quality-check', 'ready-for-delivery', 'delivery-assigned', 
                'out_for_delivery', 'at_delivery_address', 'completed', 
                'cancelled', 'refunded'
            ])
            .withMessage('Invalid booking status'),
        handleValidationErrors
    ],

    assignDriver: [
        param('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('driverId')
            .isMongoId()
            .withMessage('Invalid driver ID'),
        handleValidationErrors
    ]
};

// User validation rules
const userValidations = {
    register: [
        commonValidations.name('name'),
        commonValidations.email('email'),
        commonValidations.phone('phone'),
        commonValidations.password('password'),
        body('confirmPassword')
            .custom((value, { req }) => value === req.body.password)
            .withMessage('Passwords do not match'),
        handleValidationErrors
    ],

    login: [
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail(),
        body('phone')
            .optional()
            .matches(/^[6-9]\d{9}$/),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        body()
            .custom((value) => {
                if (!value.email && !value.phone) {
                    throw new Error('Either email or phone is required');
                }
                return true;
            }),
        handleValidationErrors
    ],

    updateProfile: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters'),
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail(),
        body('phone')
            .optional()
            .matches(/^[6-9]\d{9}$/),
        handleValidationErrors
    ]
};

// Driver validation rules
const driverValidations = {
    register: [
        commonValidations.name('name'),
        commonValidations.email('email'),
        commonValidations.phone('phone'),
        commonValidations.password('password'),
        body('licenseNumber')
            .notEmpty()
            .withMessage('License number is required')
            .matches(/^[A-Z]{2}[0-9]{13}$/)
            .withMessage('Invalid license number format'),
        body('vehicleType')
            .isIn(['sedan', 'suv', 'hatchback', 'luxury'])
            .withMessage('Invalid vehicle type'),
        handleValidationErrors
    ],

    updateLocation: [
        body('bookingId')
            .optional()
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('location.lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid latitude'),
        body('location.lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid longitude'),
        handleValidationErrors
    ],

    acceptBooking: [
        param('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        handleValidationErrors
    ]
};

// Payment validation rules
const paymentValidations = {
    initiatePayment: [
        body('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('amount')
            .isFloat({ min: 1 })
            .withMessage('Amount must be greater than 0'),
        body('method')
            .isIn(['cash', 'online', 'wallet', 'subscription'])
            .withMessage('Invalid payment method'),
        handleValidationErrors
    ],

    verifyPayment: [
        body('transactionId')
            .notEmpty()
            .withMessage('Transaction ID is required'),
        body('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        handleValidationErrors
    ]
};

// Review validation rules
const reviewValidations = {
    submitReview: [
        body('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5'),
        body('review')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Review must not exceed 500 characters'),
        handleValidationErrors
    ]
};

// Chat validation rules
const chatValidations = {
    sendMessage: [
        body('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('messageType')
            .optional()
            .isIn(['text', 'image', 'location', 'voice', 'system', 'quick_reply'])
            .withMessage('Invalid message type'),
        body('content')
            .notEmpty()
            .withMessage('Message content is required'),
        handleValidationErrors
    ],

    sendLocation: [
        body('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('location.lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid latitude'),
        body('location.lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid longitude'),
        handleValidationErrors
    ]
};

// Tracking validation rules
const trackingValidations = {
    updateLocation: [
        body('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('location.lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid latitude'),
        body('location.lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid longitude'),
        handleValidationErrors
    ],

    calculateETA: [
        body('origin.lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid origin latitude'),
        body('origin.lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid origin longitude'),
        body('destination.lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid destination latitude'),
        body('destination.lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid destination longitude'),
        handleValidationErrors
    ]
};

// Admin validation rules
const adminValidations = {
    createUser: [
        commonValidations.name('name'),
        commonValidations.email('email'),
        commonValidations.phone('phone'),
        body('role')
            .isIn(['admin', 'superadmin', 'staff'])
            .withMessage('Invalid role'),
        handleValidationErrors
    ],

    updateBooking: [
        param('bookingId')
            .isMongoId()
            .withMessage('Invalid booking ID'),
        body('status')
            .optional()
            .isIn([
                'pending', 'confirmed', 'accepted', 'assigned', 'pickup-assigned',
                'en_route', 'arrived', 'active', 'picked-up', 'before_photo', 
                'at-studio', 'washing', 'in_progress', 'after_photo', 
                'quality-check', 'ready-for-delivery', 'delivery-assigned', 
                'out_for_delivery', 'at_delivery_address', 'completed', 
                'cancelled', 'refunded'
            ])
            .withMessage('Invalid booking status'),
        handleValidationErrors
    ]
};

module.exports = {
    handleValidationErrors,
    commonValidations,
    bookingValidations,
    userValidations,
    driverValidations,
    paymentValidations,
    reviewValidations,
    chatValidations,
    trackingValidations,
    adminValidations
};
