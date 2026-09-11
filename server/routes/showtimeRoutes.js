const express = require('express');
const router = express.Router();
const showtimeController = require('../controllers/showtimeController'); // Import your showtime controller
const { authenticateJWT, authorizeTheatreAdmin, authorizeAdmin } = require('../middleware/authMiddleware'); // Import middleware

// Route to get showtimes for a movie by city and date (No authentication needed for public viewing)
router.get('/movies/:movieId', showtimeController.getShowtimesByMovie); // Public route - no middleware

// --- Protected routes for Theatre Admins ---

// NEW ROUTE: Get showtimes for the logged-in Theatre Admin's theater
router.get('/theaters', authenticateJWT, authorizeTheatreAdmin, showtimeController.getShowtimesByTheater); // No theaterId in path - backend gets from user context


// Route to get showtimes for a specific theater (Protected - Theatre Admin or Admin role required - if needed for general admin or public - keep it)
router.get('/theaters/:theaterId', authenticateJWT, showtimeController.getShowtimesByTheater); // Public access with theaterId in path


// Route to create a showtime for a screen (Protected - Theatre Admin role required)
router.post('/screens/:screenId', authenticateJWT, authorizeTheatreAdmin, showtimeController.createShowtime);

// Route to update a showtime (Protected - Theatre Admin role required)
router.put('/:showtimeId', authenticateJWT, authorizeTheatreAdmin, showtimeController.updateShowtime);

// Route to delete a showtime (Protected - Theatre Admin role required)
router.delete('/:showtimeId', authenticateJWT, authorizeTheatreAdmin, showtimeController.deleteShowtime);

// NEW ROUTE: Get showtime details by showtimeId (Public route)
router.get('/:showtimeId/details', showtimeController.getShowtimeDetailsById); // Public route

router.post('/multiple', authenticateJWT,  showtimeController.addMultipleShowtimes);// Use authorizeAdmin directly

module.exports = router;