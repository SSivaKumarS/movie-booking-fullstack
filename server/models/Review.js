// backend/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 0.5,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: { createdAt: true, updatedAt: true }
});

// Prevent multiple reviews by the same user for the same movie
reviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

