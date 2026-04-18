const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');


const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const colors = require('colors');
const path = require('path');

// Load environment variables
dotenv.config({ path: './.env.local' });

// Elite Hardening: Production Environment Safety Check
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET is not defined in production!'.red.bold);
    process.exit(1);
}

if (process.env.NODE_ENV === 'development') {
    console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
    if (process.env.JWT_SECRET) {
        console.log('JWT_SECRET signature check:', process.env.JWT_SECRET.substring(0, 4) + '...');
    }
}

const AppError = require('./utils/AppError');

// Import routes
const consumerRoutes = require('./modules/consumer/routes/consumerRoutes');
const spareDriverRoutes = require('./modules/sparedrivers/routes/spareDriverRoutes');
const adminRoutes = require('./modules/admin/routes/adminRoutes');
const PLATFORM_MODE = process.env.PLATFORM_MODE || 'SPARE_DRIVER';
const captainRoutes = PLATFORM_MODE !== 'SPARE_DRIVER'
    ? require('./modules/captain/routes/captainRoutes')
    : null;
const vendorRoutes = PLATFORM_MODE !== 'SPARE_DRIVER'
    ? require('./modules/vendor/routes/vendorRoutes')
    : null;
const staffRoutes = PLATFORM_MODE !== 'SPARE_DRIVER'
    ? require('./modules/staff/routes/staffRoutes')
    : null;
const globalErrorHandler = require('./controllers/errorController');
const maintenanceMiddleware = require('./middleware/maintenanceMiddleware');

// Initialize Express app
const app = express();

// CORS configuration
// CORS configuration
const rawOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

const allowedOrigins = rawOrigins.map(origin => origin.trim().replace(/\/$/, ""));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const normalizedOrigin = origin.trim().replace(/\/$/, "");
        if (allowedOrigins.includes(normalizedOrigin) || process.env.NODE_ENV === 'development') {
            return callback(null, true);
        } else {
            console.warn(`🚨 CORS Blocked for: ${origin}`);
            const msg = 'Origin not allowed by Clean2Wash Security Policy';
            return callback(new Error(msg), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Database connection
const mongoOptions = {
    serverSelectionTimeoutMS: 10000, // 10s timeout
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash', mongoOptions)
    .then(() => console.log('✅ MongoDB Connected'.green.bold))
    .catch((err) => {
        console.log('❌ MongoDB Connection Error:'.red.bold, err);
        // Do not exit, allow server to heart-beat and try re-connecting
    });

// Security middleware
// Security middleware with Cross-Origin Resource Policy relaxed for static assets
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));



// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 100000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000),
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip.includes('localhost')),
    handler: (req, res, next, options) => {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️  Rate limit triggered for IP: ${req.ip}`.red.bold);
        }
        res.status(options.statusCode).send(options.message);
    }
});
app.use('/api', maintenanceMiddleware);
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'CarWash Backend API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/consumer', consumerRoutes);
app.use('/api/sparedrivers', spareDriverRoutes);
app.use('/api/admin', adminRoutes);
if (PLATFORM_MODE !== 'SPARE_DRIVER') {
    app.use('/api/captain', captainRoutes);
    app.use('/api/vendor', vendorRoutes);
    app.use('/api/staff', staffRoutes);
}

// Serve uploaded driver documents as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Create HTTP server for Socket.io
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const { init } = require('./socketService');
const io = init(server);

// Make io accessible globally if needed, or just require it in controllers
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`.yellow.bold);
    console.log(`📱 Consumer API: http://localhost:${PORT}/api/consumer`.cyan.bold);
    console.log(`🚗 SpareDriver API: http://localhost:${PORT}/api/sparedrivers`.cyan.bold);
    if (PLATFORM_MODE !== 'SPARE_DRIVER') {
        console.log(`👷 Captain API: http://localhost:${PORT}/api/captain`.cyan.bold);
    }
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`.green.bold);
    console.log(`📡 Socket.io initialized on port ${PORT}`.magenta.bold);

    // Start Background Monitor for Scheduled Bookings
    const startBookingMonitor = require('./utils/bookingMonitor');
    startBookingMonitor();

    // Start Daily Cron Service (Subscription Job Generator)
    const { initCronService } = require('./utils/cronService');
    initCronService();
});

module.exports = app;
module.exports.server = server;
