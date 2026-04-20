const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation Error Handler
 * Formats validation errors and sends response
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }));

        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors: formattedErrors
        });
    }
    
    next();
};

/**
 * Common Validation Rules
 */

// Email validation
const validateEmail = () => 
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail();

// Phone validation (10 digits)
const validatePhone = () =>
    body('phone')
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be exactly 10 digits');

// Password validation
const validatePassword = () =>
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

// MongoDB ObjectId validation
const validateObjectId = (field = 'id') =>
    param(field)
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(`Invalid ${field} format`);

// Name validation
const validateName = (field = 'name') =>
    body(field)
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage(`${field} must be between 2 and 100 characters`)
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage(`${field} must contain only letters and spaces`);

// Status validation
const validateStatus = (allowedStatuses) =>
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`);

// Date validation
const validateDate = (field) =>
    body(field)
        .optional()
        .isISO8601()
        .withMessage(`${field} must be a valid date`);

// Number validation
const validateNumber = (field, min = 0, max = Infinity) =>
    body(field)
        .isNumeric()
        .withMessage(`${field} must be a number`)
        .custom((value) => value >= min && value <= max)
        .withMessage(`${field} must be between ${min} and ${max}`);

// URL validation
const validateURL = (field) =>
    body(field)
        .optional()
        .isURL()
        .withMessage(`${field} must be a valid URL`);

// Array validation
const validateArray = (field, minLength = 0, maxLength = Infinity) =>
    body(field)
        .isArray({ min: minLength, max: maxLength })
        .withMessage(`${field} must be an array with ${minLength} to ${maxLength} items`);

/**
 * Specific Validation Rules for Admin Endpoints
 */

// Login validation
const validateLogin = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// User creation validation
const validateUserCreation = [
    validateName('name'),
    validateEmail(),
    validatePhone(),
    body('role')
        .isIn(['consumer', 'captain', 'vendor', 'staff', 'admin'])
        .withMessage('Invalid role'),
    body('password')
        .optional()
        .isLength({ min: 4 })
        .withMessage('Password must be at least 4 characters'),
    handleValidationErrors
];

// User update validation
const validateUserUpdate = [
    validateObjectId('id'),
    validateName('name').optional(),
    validateEmail().optional(),
    validatePhone().optional(),
    body('role')
        .optional()
        .isIn(['consumer', 'captain', 'vendor', 'staff', 'admin'])
        .withMessage('Invalid role'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    handleValidationErrors
];

// Booking status update validation
const validateBookingStatusUpdate = [
    validateObjectId('id'),
    body('status')
        .isIn([
            'pending', 'confirmed', 'assigned', 'pickup-assigned', 'en_route',
            'arrived', 'picked-up', 'at-studio', 'washing', 'in_progress',
            'quality-check', 'ready-for-delivery', 'delivery-assigned',
            'out_for_delivery', 'delivered', 'completed', 'cancelled', 'refunded'
        ])
        .withMessage('Invalid booking status'),
    handleValidationErrors
];

// Service creation/update validation
const validateService = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Service name must be between 3 and 100 characters'),
    body('category')
        .isIn(['Instant', 'Studio', 'Studio Detailing', 'Chauffeur', 'Apartment'])
        .withMessage('Invalid service category'),
    body('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .custom((value) => value >= 0)
        .withMessage('Price must be non-negative'),
    body('duration')
        .optional()
        .isString()
        .withMessage('Duration must be a string'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    handleValidationErrors
];

// Promotion validation
const validatePromotion = [
    body('code')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Promo code must be between 3 and 20 characters')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Promo code must contain only uppercase letters and numbers'),
    body('type')
        .isIn(['percentage', 'fixed'])
        .withMessage('Type must be either percentage or fixed'),
    body('value')
        .isNumeric()
        .withMessage('Value must be a number')
        .custom((value, { req }) => {
            if (req.body.type === 'percentage' && (value < 0 || value > 100)) {
                throw new Error('Percentage value must be between 0 and 100');
            }
            if (value < 0) {
                throw new Error('Value must be non-negative');
            }
            return true;
        }),
    body('validFrom')
        .isISO8601()
        .withMessage('Valid from must be a valid date'),
    body('validUntil')
        .isISO8601()
        .withMessage('Valid until must be a valid date')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.validFrom)) {
                throw new Error('Valid until must be after valid from');
            }
            return true;
        }),
    body('maxUses')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max uses must be a positive integer'),
    handleValidationErrors
];

// Settings update validation
const validateSettingUpdate = [
    body('key')
        .trim()
        .notEmpty()
        .withMessage('Setting key is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Key must be between 2 and 50 characters'),
    body('value')
        .notEmpty()
        .withMessage('Setting value is required'),
    handleValidationErrors
];

// Transaction status update validation
const validateTransactionStatusUpdate = [
    validateObjectId('id'),
    body('status')
        .isIn(['pending', 'processing', 'completed', 'failed', 'refunded'])
        .withMessage('Invalid transaction status'),
    body('adminNote')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Admin note must not exceed 500 characters'),
    body('utr')
        .optional()
        .isLength({ min: 10, max: 30 })
        .withMessage('UTR must be between 10 and 30 characters'),
    handleValidationErrors
];

// Query parameter validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Remove any potential XSS attacks from string inputs
    const sanitize = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove script tags and other dangerous HTML
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
};

module.exports = {
    // Error handler
    handleValidationErrors,
    
    // Common validators
    validateEmail,
    validatePhone,
    validatePassword,
    validateObjectId,
    validateName,
    validateStatus,
    validateDate,
    validateNumber,
    validateURL,
    validateArray,
    
    // Specific validators
    validateLogin,
    validateUserCreation,
    validateUserUpdate,
    validateBookingStatusUpdate,
    validateService,
    validatePromotion,
    validateSettingUpdate,
    validateTransactionStatusUpdate,
    validatePagination,
    
    // Sanitization
    sanitizeInput
};
