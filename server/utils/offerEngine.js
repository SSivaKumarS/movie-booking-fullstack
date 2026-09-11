// backend/utils/offerEngine.js
const Offer = require('../models/Offer');

function computeDiscountAmount(subtotal, discountType, discountValue) {
    if (discountType === 'percentage') {
        return Math.max(0, (subtotal * discountValue) / 100);
    }
    if (discountType === 'flat') {
        return Math.min(subtotal, Math.max(0, discountValue));
    }
    return 0;
}

function isWithinValidity(offer) {
    const now = new Date();
    if (offer.startsAt && now < offer.startsAt) return false;
    if (offer.endsAt && now > offer.endsAt) return false;
    return true;
}

// Evaluate all active conditional offers and an optional promo code.
// cart = { numTickets: number, subtotal: number, movieId?: string, isFirstBooking?: boolean }
// promoCode = optional string
async function evaluateBestOffer(cart, promoCode) {
    const { numTickets, subtotal, movieId, isFirstBooking } = cart || {};
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
        return { applied: null, discount: 0, finalTotal: 0 };
    }

    const activeOffers = await Offer.find({ isActive: true }).lean();

    let candidates = [];

    for (const offer of activeOffers) {
        if (!isWithinValidity(offer)) continue;

        // Scope filtering
        if (offer.scope === 'movie') {
            if (!movieId) continue; // cannot apply movie-scoped offer without a movie context
            if (offer.movie_id?.toString() !== String(movieId)) continue;
        }
        if (offer.scope === 'first_time' && !isFirstBooking) continue;

        if (offer.type === 'conditional') {
            const minTickets = Number(offer?.condition?.minTickets || 0);
            if (minTickets > 0 && numTickets >= minTickets) {
                const discount = computeDiscountAmount(subtotal, offer.discountType, offer.discountValue);
                if (discount > 0) {
                    candidates.push({ offer, discount });
                }
            }
        } else if (offer.type === 'promocode') {
            const code = String(offer?.condition?.code || '').trim().toUpperCase();
            const minTicketsPromo = Number(offer?.condition?.minTickets || 0);
            if (promoCode && code && promoCode.trim().toUpperCase() === code) {
                if (minTicketsPromo > 0 && !(numTickets >= minTicketsPromo)) continue;
                const discount = computeDiscountAmount(subtotal, offer.discountType, offer.discountValue);
                if (discount > 0) {
                    candidates.push({ offer, discount });
                }
            }
        }
    }

    if (candidates.length === 0) {
        return { applied: null, discount: 0, finalTotal: subtotal };
    }

    // Highest benefit wins
    candidates.sort((a, b) => b.discount - a.discount);
    const best = candidates[0];
    const finalTotal = Math.max(0, subtotal - best.discount);

    return {
        applied: {
            id: best.offer._id,
            title: best.offer.title,
            type: best.offer.type,
            discountType: best.offer.discountType,
            discountValue: best.offer.discountValue,
            condition: best.offer.condition,
        },
        discount: best.discount,
        finalTotal,
    };
}

module.exports = {
    evaluateBestOffer,
    computeDiscountAmount,
};


