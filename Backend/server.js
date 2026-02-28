const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const colors = require('colors');

// Load environment variables
dotenv.config({ path: './.env' });

// Import routes
const consumerRoutes = require('./modules/consumer/routes/consumerRoutes');
const captainRoutes = require('./modules/captain/routes/captainRoutes');

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
// app.use(mongoSanitize());
// app.use(xss());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`.yellow.bold);
    console.log(`📱 Consumer API: http://localhost:${PORT}/api/consumer`.cyan.bold);
    console.log(`👷 Captain API: http://localhost:${PORT}/api/captain`.cyan.bold);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`.green.bold);
});

module.exports = app;
