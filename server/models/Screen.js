// backend/models/Screen.js
const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
    theater_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theater', // Refers to the 'Theater' model
        required: true,
    },
    screen_number: { // e.g., '1', '2', 'Audi 3', 'IMAX'
        type: String,
        required: [true, 'Screen number/identifier is required'],
        trim: true,
    },
    format: { // e.g., '4K Dolby Atmos', 'Standard', 'IMAX Laser'
        type: String,
        required: [true, 'Screen format description is required'],
        trim: true,
    },
    total_seats: { // Can be calculated from linked Seats or stored explicitly
        type: Number,
        required: [true, 'Total seats count is required'],
        min: [1, 'Screen must have at least one seat'],
    },
    // Add other screen-specific details if needed (e.g., sound system, 3D capability)
    // features: [String] // e.g., ['Dolby Atmos', '4K Projection']
}, {
    timestamps: true,
});

// Ensure screen numbers are unique within the same theater
screenSchema.index({ theater_id: 1, screen_number: 1 }, { unique: true });

module.exports = mongoose.model('Screen', screenSchema);
// Collection will be 'screens'