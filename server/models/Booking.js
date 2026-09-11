// backend/models/Booking.js
const mongoose = require('mongoose');

// Define schema for the embedded booked seat details
const bookedSeatDetailSchema = new mongoose.Schema({
    seat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat', // Reference to the actual Seat document
        required: true,
    },
    seat_number: { // Denormalized for easy display on tickets/history
        type: String,
        required: true,
    },
    price: { // Denormalized price at the time of booking
        type: Number,
        required: true,
    }
}, { _id: false }); // Don't create separate _id for embedded documents unless needed

const bookingSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the 'User' model
        required: true,
    },
    showtime_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime', // Refers to the 'Showtime' model
        required: true,
    },
    // Array of embedded documents detailing seats booked in this transaction
    booked_seats: {
        type: [bookedSeatDetailSchema],
        required: true,
        validate: [v => Array.isArray(v) && v.length > 0, 'At least one seat must be booked.']
    },
    total_amount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative'],
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'accepted', 'cancelled', 'user_cancelled'],
        default: 'pending',
    },
    payment_status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    booking_date: { // More specific name than createdAt
        type: Date,
        default: Date.now,
    },
    payment_id: { // Optional link to a payment record
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: false, // Only required if payment is successful and linked
    },
    // New fields for ticket verification
    verified_at: {
        type: Date,
        default: null
    },
    verified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    verification_attempts: [{
        attempted_at: {
            type: Date,
            required: true
        },
        attempted_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        success: {
            type: Boolean,
            required: true
        },
        message: String
    }]
}, {
    timestamps: true, // Includes createdAt, updatedAt
});

// Pricing / offer fields
bookingSchema.add({
    subtotal_amount: { type: Number, min: 0 },
    discount_amount: { type: Number, min: 0, default: 0 },
    applied_offer: { type: mongoose.Schema.Types.Mixed }
});

// Index for retrieving a user's booking history, sorted by date
bookingSchema.index({ user_id: 1, booking_date: -1 });
bookingSchema.index({ user_id: 1, createdAt: -1 }); // Alternative using timestamps

// Index for finding active bookings for a specific showtime (useful for seat layout)
bookingSchema.index({ showtime_id: 1, status: 1 });

// New indexes for verification
bookingSchema.index({ verified_at: 1 });
bookingSchema.index({ verified_by: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
// Collection will be 'bookings'