// backend/routes/index.js
const express = require('express');
const authRoutes = require('./authRoutes');
const movieRoutes = require('./movieRoutes');
const seatRoutes = require('./seatRoutes'); // You have seatRoutes, ensure it's not conflicting with bookingRoutes
const showtimeRoutes = require('./showtimeRoutes');
const theaterRoutes = require('./theaterRoutes');
const bookingRoutes = require('./bookingRoutes'); // Import booking routes
const cityRoutes = require('./cityRoutes'); 
const paymentRoutes = require('./paymentRoutes'); // Import payment routes
const userRoutes = require('./userRoutes');
const theaterDashboardRoutes = require('./theaterDashboard');
const reviewRoutes = require('./reviewRoutes');
const offerRoutes = require('./offerRoutes');

const router = express.Router();

// Mount route files - use router.use() to mount each route group

// Authentication routes - prefixed with /auth
router.use('/auth', authRoutes);

// Movie routes - prefixed with /movies
router.use('/movies', movieRoutes);

// Seat routes - prefixed with /seats
router.use('/seats', seatRoutes); // Ensure seatRoutes and bookingRoutes paths don't conflict if they handle seats

// Showtime routes - prefixed with /showtimes
router.use('/showtimes', showtimeRoutes);
router.use('/theaters', theaterRoutes);
router.use('/bookings', bookingRoutes); // Mount booking routes under /api/bookings
router.use('/cities', cityRoutes);
router.use('/payments', paymentRoutes); // Mount payment routes
router.use('/users', userRoutes);
router.use('/theater', theaterDashboardRoutes);
router.use('/', reviewRoutes);
router.use('/offers', offerRoutes);


// Example of a direct route definition (you generally should use route files for organization)
// router.get('/api/test', (req, res) => {
//   res.json({ message: 'API test route is working from index.js' });
// });

module.exports = router;