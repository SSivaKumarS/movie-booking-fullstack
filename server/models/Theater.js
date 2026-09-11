// backend/models/Theater.js
const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Theater name is required'],
        trim: true,
    },
    location: { // Full address
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        index: true, // Index for faster querying by city
    },
    // Reference to the theater admin user (optional, depending on your role structure)
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the 'User' model
        // required: true // Make required if every theater MUST have an admin user linked
    },
    // capacity: Number, // Redundant if derived from screens/seats
}, {
    timestamps: true,
});

// Ensure unique theater names within the same city (optional constraint)
// theaterSchema.index({ name: 1, city: 1 }, { unique: true });

module.exports = mongoose.model('Theater', theaterSchema);
// Collection will be 'theaters'