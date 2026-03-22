const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const Captain = require('../models/Captain');
const SpareDriver = require('../models/SpareDriver');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const extractToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    }
    if (req.cookies && req.cookies.jwt) {
        return req.cookies.jwt;
    }
    return null;
};

const ensureUserActive = (user) => {
    if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }
};

const ensureSpareDriverActive = (driver) => {
    if (['rejected', 'suspended'].includes(driver.status)) {
        throw new AppError('Your account is not active. Please contact support.', 401);
    }
};

const applyPrincipalToRequest = (req, principal) => {
    req.auth = {
        id: principal.id,
        role: principal.role
    };

    req.user = principal.user;

    if (principal.role === 'captain') {
        req.captain = principal.user;
    }

    if (principal.role === 'sparedriver') {
        req.spareDriver = principal.user;
    }
};

const resolvePrincipalFromRole = async (decoded) => {
    const tokenRole = decoded.role;

    if (tokenRole === 'captain') {
        const captain = await Captain.findById(decoded.id);
        if (!captain) return null;
        ensureUserActive(captain);
        return { id: captain._id, role: 'captain', user: captain };
    }

    if (tokenRole === 'sparedriver') {
        const spareDriver = await SpareDriver.findById(decoded.id);
        if (!spareDriver) return null;
        ensureSpareDriverActive(spareDriver);
        return { id: spareDriver._id, role: 'sparedriver', user: spareDriver };
    }

    const user = await User.findById(decoded.id);
    if (!user) return null;
    ensureUserActive(user);

    if (tokenRole && user.role !== tokenRole) {
        throw new AppError('Token role mismatch. Please log in again.', 401);
    }

    return { id: user._id, role: user.role, user };
};

const resolveLegacyPrincipal = async (decoded) => {
    const user = await User.findById(decoded.id);
    if (user) {
        ensureUserActive(user);
        return { id: user._id, role: user.role, user };
    }

    const captain = await Captain.findById(decoded.id);
    if (captain) {
        ensureUserActive(captain);
        return { id: captain._id, role: 'captain', user: captain };
    }

    const spareDriver = await SpareDriver.findById(decoded.id);
    if (spareDriver) {
        ensureSpareDriverActive(spareDriver);
        return { id: spareDriver._id, role: 'sparedriver', user: spareDriver };
    }

    return null;
};

const resolvePrincipal = async (decoded) => {
    if (decoded.role) {
        return resolvePrincipalFromRole(decoded);
    }
    return resolveLegacyPrincipal(decoded);
};

exports.protect = catchAsync(async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const decoded = await promisify(jwt.verify)(token, JWT_SECRET);
    const principal = await resolvePrincipal(decoded);
    if (!principal) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    applyPrincipalToRequest(req, principal);
    next();
});

// Middleware for routes that can optionally have user context
exports.optionalProtect = catchAsync(async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return next();
    }

    try {
        const decoded = await promisify(jwt.verify)(token, JWT_SECRET);
        const principal = await resolvePrincipal(decoded);
        if (principal) {
            applyPrincipalToRequest(req, principal);
        }
    } catch (err) {
        // Silently fail for optional auth
    }
    next();
});

// Authorize certain roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        const currentRole = req.auth?.role || req.user?.role;

        if (!currentRole || !roles.includes(currentRole)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
