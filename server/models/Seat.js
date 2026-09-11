// backend/models/Seat.js
const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    screen_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Screen', // Refers to the 'Screen' model
        required: true,
    },
    // Combined seat identifier (e.g., 'A1', 'B12', 'R5')
    seat_number: {
        type: String,
        required: [true, 'Seat number is required'],
        trim: true,
        uppercase: true,
    },
    // Explicit row identifier (e.g., 'A', 'B', 'R')
    row: {
        type: String,
        required: [true, 'Row identifier is required'],
        trim: true,
        uppercase: true,
        maxlength: 2 // Or adjust as needed
    },
    // Number within the row (e.g., 1, 12, 5)
    number_in_row: {
        type: Number,
        required: [true, 'Number in row is required'],
        // --- CHANGE HERE ---
        min: [0, 'Seat number cannot be negative'], // Allow 0
        // --- END CHANGE ---
    },
    seat_type: { // e.g., 'Regular', 'Premium', 'Recliner', 'Wheelchair'
        type: String,
        default: 'Regular',
        trim: true,
    },
    price: {
        type: Number,
        required: [true, 'Seat price is required'],
        min: [0, 'Price cannot be negative'],
    },
    // is_available: { // Status is usually determined by querying bookings for a showtime, not stored here
    //     type: Boolean,
    //     default: true
    // }
}, {
    // No timestamps needed here usually, unless tracking individual seat modifications
    // timestamps: true
});

// Ensure seat numbers are unique within the same screen
seatSchema.index({ screen_id: 1, seat_number: 1 }, { unique: true });
// Optional index for fetching seats by row
seatSchema.index({ screen_id: 1, row: 1, number_in_row: 1 });

module.exports = mongoose.model('Seat', seatSchema);
// Collection will be 'seats'