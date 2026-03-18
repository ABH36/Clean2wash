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
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
if (process.env.JWT_SECRET) {
    console.log('JWT_SECRET signature check:', process.env.JWT_SECRET.substring(0, 4) + '...');
}

const AppError = require('./utils/AppError');

// Import routes
const consumerRoutes = require('./modules/consumer/routes/consumerRoutes');
const captainRoutes = require('./modules/captain/routes/captainRoutes');
const spareDriverRoutes = require('./modules/sparedrivers/routes/spareDriverRoutes');
const adminRoutes = require('./modules/admin/routes/adminRoutes');
const vendorRoutes = require('./modules/vendor/routes/vendorRoutes');
const staffRoutes = require('./modules/staff/routes/staffRoutes');
const globalErrorHandler = require('./controllers/errorController');

// Initialize Express app
const app = express();

// CORS first - before any other middleware (Vite = 5173)
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash')
    .then(() => console.log('✅ MongoDB Connected'.green.bold))
    .catch((err) => console.log('❌ MongoDB Connection Error:'.red.bold, err));

// Security middleware
app.use(helmet());



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
app.use('/api/captain', captainRoutes);
app.use('/api/sparedrivers', spareDriverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/staff', staffRoutes);

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
    console.log(`👷 Captain API: http://localhost:${PORT}/api/captain`.cyan.bold);
    console.log(`🚗 SpareDriver API: http://localhost:${PORT}/api/sparedrivers`.cyan.bold);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`.green.bold);
    console.log(`📡 Socket.io initialized on port ${PORT}`.magenta.bold);
});

module.exports = { app, server };
