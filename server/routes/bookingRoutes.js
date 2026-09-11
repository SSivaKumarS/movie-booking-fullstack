// backend/routes/bookingRoutes.js
const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticateJWT } = require('../middleware/authMiddleware'); // Assuming booking routes require login

const router = express.Router();

// POST /api/v1/bookings - Create a new booking
router.post('/', authenticateJWT, bookingController.createBooking);

// GET /api/v1/bookings/me - Get bookings for the logged-in user
// ** ADD THIS ROUTE **
router.get('/me', authenticateJWT, bookingController.getMyBookings);
// ** OR use GET / if that makes more sense for your structure **
// router.get('/', authenticateJWT, bookingController.getMyBookings);

// DELETE /api/v1/bookings/:bookingId - Cancel a booking
router.delete('/:bookingId', authenticateJWT, bookingController.cancelBooking);

// POST /api/v1/bookings/verify - Verify a ticket
router.post('/verify-ticket', authenticateJWT, bookingController.verifyTicket);

module.exports = router;