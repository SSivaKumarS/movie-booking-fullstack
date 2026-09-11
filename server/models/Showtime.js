// backend/models/Showtime.js
const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
    movie_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie', // Refers to the 'Movie' model
        required: true,
    },
    screen_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Screen', // Refers to the 'Screen' model
        required: true,
    },
    // Denormalized theater_id for easier querying without extra populate
    theater_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theater', // Refers to the 'Theater' model
        required: true,
    },
    start_time: {
        type: Date,
        required: [true, 'Show start time is required'],
    },
    language: { // Optional: Specific language for this showing (overrides movie default)
        type: String,
        trim: true,
    },

    status: {
        type: String,
        required: true, // Make status mandatory
        enum: {
            values: ['scheduled', 'completed', 'cancelled'], // Define allowed values
            message: 'Status must be either scheduled, completed, or cancelled' // Custom error message
        },
        default: 'scheduled' // Set default status when creating a showtime
    },
    // end_time: { // Can be calculated based on movie duration + start_time if needed
    //     type: Date,
    // },

    // booked_seats: [{ // Option 1: Array of Seat ObjectIds. Can grow large.
    //    type: mongoose.Schema.Types.ObjectId,
    //    ref: 'Seat'
    // }]
    // Option 2 (Generally Preferred): Determine booked seats by querying active Bookings for this showtime_id.
}, {
    timestamps: true,
});

// Index for finding showtimes by movie/theater/date/status
showtimeSchema.index({ movie_id: 1, theater_id: 1, start_time: 1, status: 1 });
// Index for finding showtimes by screen/time (useful for conflict checking)
showtimeSchema.index({ screen_id: 1, start_time: 1 });
// Index for quickly finding showtimes for a specific theater and date range
showtimeSchema.index({ theater_id: 1, start_time: 1 });
// Index for the scheduled task to find shows to mark as completed
showtimeSchema.index({ status: 1, start_time: 1 });

module.exports = mongoose.model('Showtime', showtimeSchema);
// Collection will be 'showtimes'