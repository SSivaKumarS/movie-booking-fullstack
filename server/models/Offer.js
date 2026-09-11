// backend/models/Offer.js
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['conditional', 'promocode'], required: true },
    // For conditional: { minTickets: Number }
    // For promocode: { code: String, minTickets?: Number }
    condition: {
        type: Object,
        required: true,
    },
    // Scope controls where the offer applies
    // all: applies to all movies
    // movie: applies to a specific movie (movie_id must be set)
    // first_time: applies only for user's first booking
    scope: { type: String, enum: ['all', 'movie', 'first_time'], default: 'all' },
    movie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    // Optional validity period
    startsAt: { type: Date },
    endsAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
// Collection: offers


