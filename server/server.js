// backend/server.js

require('dotenv').config(); // Load environment variables early

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Import mongoose
const cron = require('node-cron');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const axios = require('axios');
const path = require('path');

// --- Import Configuration and Controllers ---
const connectDB = require('./config/db'); // Import the Mongoose connection function
const apiRoutes = require('./routes/index'); // Import the main router
const showtimeController = require('./controllers/showtimeController'); // For the scheduled task
const bookingController = require('./controllers/bookingController');

// --- Configure Winston Logger ---
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// --- Connect to MongoDB Database ---
// Call connectDB immediately. It handles process exit on failure.
connectDB();

// --- Initialize Express App ---
const app = express();

// --- Trust Proxy Configuration ---
app.set('trust proxy', 1); // Trust first proxy

// --- Security Middleware ---
app.use(helmet()); // Set various HTTP headers for security
app.use(cors({
    origin: true, // Allow all origins
    credentials: true // Allow credentials
})); // Enable CORS with specific configuration

// --- Rate Limiting ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// --- Compression Middleware ---
app.use(compression());

// --- Logging Middleware ---
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// --- Core Middleware ---
app.use(express.json({ limit: '10kb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Middleware to parse URL-encoded bodies

// --- Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- API Documentation ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

// --- API Routes ---
// Mount all routes under /api/v1
app.use('/api/v1', apiRoutes);

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// --- 404 Handler (Not Found) ---
// Place after all valid routes
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

// --- Global Error Handling Middleware ---
// Place after 404 handler and all other middleware/routes
app.use((err, req, res, next) => {
    // Default status code and status
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    logger.error('Error:', {
        error: err,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
    });

    const isProduction = process.env.NODE_ENV === 'production';
    let responseError = {
        status: err.status,
        message: err.message || 'An unexpected error occurred.',
    };

    // Specific Error Handling (Customize based on errors you expect)
    if (err.name === 'ValidationError') { // Mongoose validation error
        err.statusCode = 400;
        err.status = 'fail';
        // Combine validation messages
        const errors = Object.values(err.errors).map(el => el.message);
        responseError.message = `Invalid input data: ${errors.join('. ')}`;
        if (!isProduction) responseError.errors = err.errors; // Optionally include detailed errors in dev
    } else if (err.name === 'CastError') { // Mongoose invalid ObjectId or type casting error
        err.statusCode = 400;
        err.status = 'fail';
        responseError.message = `Invalid ${err.path}: ${err.value}.`;
    } else if (err.code === 11000) { // MongoDB duplicate key error
        err.statusCode = 409; // Conflict
        err.status = 'fail';
        // Try to extract the duplicate field
        const field = Object.keys(err.keyValue)[0];
        responseError.message = `Duplicate field value entered for '${field}'. Please use another value.`;
    } else if (err.name === 'JsonWebTokenError') { // JWT invalid signature
        err.statusCode = 401;
        err.status = 'fail';
        responseError.message = 'Invalid token. Please log in again.';
    } else if (err.name === 'TokenExpiredError') { // JWT expired
        err.statusCode = 401;
        err.status = 'fail';
        responseError.message = 'Your token has expired. Please log in again.';
    }

    // Send more details in development environment
    if (!isProduction) {
        responseError.error = { ...err, stack: err.stack }; // Send full error object in dev
    } else {
        // For production, only send operational errors or generic message
        if (!err.isOperational) { // Mark operational errors explicitly if needed
            console.error('PROGRAMMING or UNKNOWN ERROR:', err);
            responseError.message = 'Something went very wrong!'; // Generic message for non-operational errors
        }
    }

    res.status(err.statusCode).json(responseError);
});

// --- Server Variable ---
let server; // Declare server variable to hold the HTTP server instance

// --- Unhandled Promise Rejection Handling ---
// Catches promises that fail without a .catch() block
process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', { reason });
    // Exit gracefully - close server first if it's running
    if (server) {
        server.close(() => {
            process.exit(1); // Exit with failure code
        });
    } else {
        process.exit(1);
    }
});

// --- SIGTERM Handling (e.g., from Docker, Kubernetes) ---
process.on('SIGTERM', () => {
    logger.info('SIGTERM RECEIVED. Shutting down gracefully...');
    gracefulShutdown('SIGTERM');
});

// --- SIGINT Handling (e.g., Ctrl+C) ---
process.on('SIGINT', () => {
    logger.info('SIGINT RECEIVED. Shutting down gracefully...');
    gracefulShutdown('SIGINT');
});

// --- Graceful Shutdown Function ---
async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Closing HTTP server...`);
    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed.');
            // Close MongoDB connection
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed.');
            } catch (dbErr) {
                logger.error('Error closing MongoDB connection:', dbErr);
            } finally {
                process.exit(0); // Exit cleanly
            }
        });
    } else {
        // If server never started, just close DB and exit
        try {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed (server never started).');
        } catch (dbErr) {
            logger.error('Error closing MongoDB connection:', dbErr);
        } finally {
            process.exit(0);
        }
    }

    // Force close server after a timeout if it doesn't close gracefully
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000); // 10 seconds timeout
}

// --- Start the HTTP Server ---
const PORT = process.env.PORT || 3000;

server = app.listen(PORT, () => {
    logger.info(`-------------------------------------------------------`);
    logger.info(` Server running on port ${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`-------------------------------------------------------`);

    // --- Schedule Cron Jobs ---

    // 1. Showtime status update job
    logger.info('[Scheduler] Setting up cron job to update showtime statuses...');
    cron.schedule('*/15 * * * *', async () => {
        logger.info('[Scheduler] Triggering updateShowtimeStatusesToCompleted job...');
        try {
            const result = await showtimeController.updateShowtimeStatusesToCompleted();
            logger.info(`[Scheduler] Job finished. Success: ${result.success}, Updated: ${result.updated != null ? result.updated : 'N/A'}`);
        } catch (error) {
            logger.error('[Scheduler] Error running scheduled job updateShowtimeStatusesToCompleted:', error);
        }
    });

    // 1b. Auto-cancel stale pending bookings (>15m)
    logger.info('[Scheduler] Setting up cron job to cancel stale pending bookings...');
    cron.schedule('*/5 * * * *', async () => {
        logger.info('[Scheduler] Triggering cancelStalePendingBookings job...');
        try {
            const result = await bookingController.cancelStalePendingBookings();
            logger.info(`[Scheduler] Stale bookings cleanup finished. Success: ${result.success}, Modified: ${result.modified != null ? result.modified : 'N/A'}`);
        } catch (error) {
            logger.error('[Scheduler] Error running cancelStalePendingBookings:', error);
        }
    });

    // 2. Cold start prevention job (only in production)
    if (process.env.NODE_ENV === 'production') {
        logger.info('[Scheduler] Setting up Render.com cold start prevention job...');
        cron.schedule('*/10 * * * *', async () => {
            const startTime = Date.now();
            logger.info('[Scheduler] Making Render.com cold start prevention request...');
            try {
                // Make request to both root and health endpoints
                const [rootResponse, healthResponse] = await Promise.all([
                    axios.get('http://localhost:5000/api/v1', {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'CinePlus-Cron-Job',
                            'X-Render-Cron': 'true'
                        }
                    }),
                    axios.get('http://localhost:5000/api/v1', {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'CinePlus-Cron-Job',
                            'X-Render-Cron': 'true'
                        }
                    })
                ]);

                const endTime = Date.now();
                logger.info(`[Scheduler] Render.com cold start prevention successful. Root: ${rootResponse.status}, Health: ${healthResponse.status}, Response time: ${endTime - startTime}ms`);
            } catch (error) {
                // Safe property access without using optional chaining operator (?.)
                const responseStatus = (error.response && error.response.status) ? error.response.status : undefined;

                logger.error('[Scheduler] Error in Render.com cold start prevention:', {
                    message: error.message,
                    code: error.code,
                    response: responseStatus,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
});

// Export server (optional, e.g., for testing)
module.exports = server;