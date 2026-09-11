const express = require('express');
const router = express.Router();
const theaterDashboardController = require('../controllers/theaterDashboardController');
const { authenticateJWT, authorizeTheatreAdmin } = require('../middleware/authMiddleware');

// All routes are protected and restricted to theater_admin role
router.use(authenticateJWT);
router.use(authorizeTheatreAdmin);

// Get today's statistics
router.get('/stats/today', theaterDashboardController.getTodayStats);

// Get weekly statistics
router.get('/stats/week', theaterDashboardController.getWeekStats);

// Get monthly statistics
router.get('/stats/month', theaterDashboardController.getMonthStats);

// Get today's shows with details
router.get('/shows/today', theaterDashboardController.getTodayShows);

// Get movie-wise statistics
router.get('/movies/stats', theaterDashboardController.getMovieStats);

// Get screen-wise statistics
router.get('/screens/stats', theaterDashboardController.getScreenStats);

module.exports = router; 