// backend/routes/seatRoutes.js
const express = require('express');
const seatController = require('../controllers/seatController');

// --- CORRECTED IMPORT ---
// Destructure the specific middleware function you need from the exports object
const { authenticateJWT } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/v1/seats/screens/:screenId/showtimes/:showtimeId
router.get(
    '/screens/:screenId/showtimes/:showtimeId',
    authenticateJWT,             // --- Use the correctly imported function ---
    seatController.getSeatLayout
);

// GET /api/v1/seats/screens/:screenId
router.get(
    '/screens/:screenId',
    authenticateJWT,
    seatController.getScreenSeats
);

// PUT /api/v1/seats/screens/:screenId
router.put(
    '/screens/:screenId',
    authenticateJWT,
    seatController.updateScreenSeats
);

module.exports = router;