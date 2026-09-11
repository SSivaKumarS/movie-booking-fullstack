const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, markPaymentFailed } = require('../controllers/paymentController');

// Create a new Razorpay order
router.post('/create-order', createOrder);

// Verify payment
router.post('/verify-payment', verifyPayment);

// Client can notify failure/cancel to release seats
router.post('/payment-failed', markPaymentFailed);

module.exports = router; 