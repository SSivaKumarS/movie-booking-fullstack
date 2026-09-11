const express = require('express');
const router = express.Router();
const { verifyToken, isTheaterAdmin } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// Verify ticket endpoint
router.post('/verify', verifyToken, isTheaterAdmin, bookingController.verifyBooking);

module.exports = router; 