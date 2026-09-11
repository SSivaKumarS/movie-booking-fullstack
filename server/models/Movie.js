// backend/models/Movie.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Movie title is required.'], // Custom error message
        trim: true, // Remove leading/trailing whitespace
        index: true // Index for faster lookups/sorting by title
    },
    genre: {
        type: String,
        required: [true, 'Genre is required.'],
        trim: true
    },
    duration: { // Duration in minutes
        type: Number,
        required: [true, 'Duration is required.'],
        min: [1, 'Duration must be at least 1 minute.'] // Ensure positive duration
    },
    release_date: {
        type: Date, // *** THIS IS THE CRITICAL PART - Must be Date type ***
        required: [true, 'Release date is required.']
    },
    languages: { // Renamed from 'language' (as you had)
        type: [String], // Array of strings
        required: [true, 'At least one language is required.'],
         // Optional: Add validation to ensure the array isn't empty if required is true
         validate: {
            validator: function(langs) {
                return langs && langs.length > 0;
            },
            message: 'Languages array cannot be empty.'
         }
        // Note: Trimming individual strings in the array needs to happen before saving if desired,
        // Mongoose doesn't trim array elements automatically.
    },
    rating: { // Optional field, uses enum for restricted values
        type: String,
        trim: true,
        enum: {
             values: ['U', 'UA', 'A', 'S', null], // Allowed values + null for optional
             message: 'Invalid rating value: {VALUE}. Allowed: U, UA, A, S.'
        },
        default: null // Explicitly make it optional
    },
    description: {
        type: String,
        required: [true, 'Description is required.'],
        trim: true
    },
    poster_url: {
        type: String,
        required: [true, 'Poster URL is required.'],
        trim: true
        // Optional: Add regex validation for basic URL format
        // match: [/^(https?:\/\/[^\s$.?#].[^\s]*)$/, 'Please fill a valid Poster URL']
    },
    trailer_url: { // Optional field
        type: String,
        trim: true,
        default: null // Explicitly make it optional
        // Optional: Add regex validation for basic URL format
        // match: [/^(https?:\/\/[^\s$.?#].[^\s]*)$/, 'Please fill a valid Trailer URL']
    },
    // --- Ratings & Reviews ---
    avgRatingPoints: {
        type: Number,
        default: 0,
        min: [0, 'Average rating cannot be negative']
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: [0, 'Review count cannot be negative']
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
});

// Add combined text index for searching across title and genre (as you had)
movieSchema.index({ title: 'text', genre: 'text' });

// Ensure Mongoose doesn't automatically create a version key (__v) if you don't need it
// movieSchema.set('versionKey', false); // Uncomment if you want to disable __v

module.exports = mongoose.model('Movie', movieSchema);
// The collection name in MongoDB will be 'movies' (pluralized automatically by Mongoose)