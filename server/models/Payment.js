// backend/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking', // Refers to the 'Booking' model
        required: true,
        index: true, // Index for looking up payment by booking
    },
    booking_amount: {
        type: Number,
        required: true,
    },
    payment_date: {
        type: Date,
        default: Date.now,
    },
    payment_status: { // e.g., 'Success', 'Failed', 'Pending', 'Refunded'
        type: String,
        required: true,
        trim: true,
    },
    payment_provider: { // e.g., 'Stripe', 'PayPal', 'Razorpay'
        type: String,
        trim: true,
    },
    transaction_id: { // ID provided by the payment gateway
        type: String,
        trim: true,
        index: true, // Index if you need to look up payments by transaction ID
    },
    // You might store additional gateway-specific response details here
    // gateway_response: {
    //     type: mongoose.Schema.Types.Mixed // For storing arbitrary JSON object
    // }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
// Collection will be 'payments'