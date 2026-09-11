// backend/controllers/offerController.js
const Offer = require('../models/Offer');
const { evaluateBestOffer } = require('../utils/offerEngine');
const Booking = require('../models/Booking');

exports.createOffer = async (req, res) => {
    try {
        const offer = await Offer.create(req.body);
        res.status(201).json({ success: true, data: offer });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getOffers = async (req, res) => {
    try {
        const { type, isActive } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';
        const offers = await Offer.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: offers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
        res.json({ success: true, data: offer });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.updateOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
        res.json({ success: true, data: offer });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
        res.json({ success: true, message: 'Offer deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// POST /offers/evaluate
// Body: { numTickets, subtotal, promoCode }
exports.evaluate = async (req, res) => {
    try {
        const { numTickets, subtotal, promoCode, movieId, isFirstBooking } = req.body;
        const result = await evaluateBestOffer({ numTickets, subtotal, movieId, isFirstBooking }, promoCode);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// POST /offers/apply-to-booking
// Body: { bookingId, promoCode }
exports.applyToBooking = async (req, res) => {
    try {
        const { bookingId, promoCode } = req.body;
        const booking = await Booking.findById(bookingId).populate({
            path: 'showtime_id',
            select: 'movie_id',
            populate: { path: 'movie_id', select: '_id' }
        });
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const numTickets = booking.booked_seats?.length || 0;
        const subtotal = booking.subtotal_amount ?? booking.total_amount;
        const movieId = booking.showtime_id?.movie_id?._id || booking.showtime_id?.movie_id || undefined;
        const isFirstBooking = false; // placeholder; derive via user history if needed in future
        const result = await evaluateBestOffer({ numTickets, subtotal, movieId, isFirstBooking }, promoCode);

        booking.discount_amount = result.discount || 0;
        booking.total_amount = result.finalTotal ?? subtotal;
        if (result.applied) booking.applied_offer = result.applied; else booking.applied_offer = undefined;
        await booking.save();

        res.json({ success: true, data: {
            bookingId: booking._id,
            subtotalAmount: booking.subtotal_amount,
            discountAmount: booking.discount_amount,
            totalAmount: booking.total_amount,
            appliedOffer: booking.applied_offer || null
        }});
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


