// backend/routes/reviewRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateJWT } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

const validateReview = [
    body('rating').isFloat({ min: 0.5, max: 5 }).withMessage('Rating must be between 0.5 and 5'),
    body('comment').optional().isString().trim(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
        }
        next();
    }
];

// Add or update current user's review (upsert)
router.post('/movies/:movieId/reviews', authenticateJWT, validateReview, reviewController.addReview);

// Explicit update by reviewId (optional)
router.put('/movies/:movieId/reviews/:reviewId', authenticateJWT, validateReview, reviewController.updateReview);

// List reviews for a movie
router.get('/movies/:movieId/reviews', reviewController.getReviewsForMovie);

// Delete current user's review
router.delete('/movies/:movieId/reviews/me', authenticateJWT, reviewController.deleteMyReview);

// Get current user's review (for prefill)
router.get('/movies/:movieId/reviews/me', authenticateJWT, reviewController.getMyReview);

module.exports = router;


