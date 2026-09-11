// backend/routes/movieRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator'); // Import validation tools
const movieController = require('../controllers/movieController');
const { authenticateJWT, authorizeAdmin } = require('../middleware/authMiddleware'); // Import auth middleware

const router = express.Router();

// --- Reusable Validation Middleware ---
// (Contains fixes for 'languages' and optional 'rating'/'trailer_url')
const validateMovie = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('genre').trim().notEmpty().withMessage('Genre is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('release_date').isISO8601().toDate().withMessage('Valid release date is required'),
    body('languages')
        .isArray({ min: 1 }).withMessage('At least one language is required')
        .custom((langs) => langs.every(lang => typeof lang === 'string' && lang.trim() !== ''))
        .withMessage('Each language must be a non-empty string'),
    body('rating')
        .optional({ checkFalsy: true }) // Make rating optional
        .trim()
        .isIn(['U', 'UA', 'A', 'S']) // Validate if provided
        .withMessage('Invalid rating value provided. Allowed values: U, UA, A, S.'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('poster_url').isURL().withMessage('Valid Poster URL is required'),
    body('trailer_url')
        .optional({ checkFalsy: true }) // Keep trailer optional
        .isURL()
        .withMessage('Valid Trailer URL is required if provided'),

    // Middleware function to handle validation results
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return validation errors
            return res.status(400).json({
                message: errors.array()[0].msg, // Send first error message
                errors: errors.array() // Send all errors
            });
        }
        next(); // Proceed to controller if validation passes
    }
];


// --- Public GET Routes ---

// GET all movies
router.get('/', movieController.getAllMovies);

// GET "Now in Cinemas" movies
router.get('/now-in-cinemas', movieController.getNowInCinemasMovies);

// GET "Coming Soon" movies
router.get('/coming-soon-page', movieController.getComingSoonMoviesPage);

// GET popular movies
router.get('/popular', movieController.getPopularMovies);

// GET upcoming movies
router.get('/upcoming', movieController.getUpcomingMovies);

// GET movies by search query
router.get('/search', movieController.searchMovies); // Should come before /:id

// **NEW ROUTE ADDED HERE**
// GET booking stats for a specific movie
router.get('/:id/booking-stats', movieController.getBookingStatsForMovie);

// GET a single movie by ID
router.get('/:id', movieController.getMovieById);


// --- Protected POST/PUT/DELETE Routes (Admin Only) ---

// POST (Create) a new movie
router.post(
    '/',
    authenticateJWT,  // 1. Check if user is logged in
    authorizeAdmin,   // 2. Check if user has 'admin' role
    validateMovie,    // 3. Validate request body
    movieController.createMovie // 4. Proceed to controller if all pass
);

// PUT (Update) an existing movie by ID
router.put(
    '/:id',
    authenticateJWT,
    authorizeAdmin,
    // Optional: Add validation for update? Often relies on Mongoose validation in controller
    // validateMovieUpdate, // You might create a separate, less strict validation set for updates
    movieController.updateMovie
);

// DELETE a movie by ID
router.delete(
    '/:id',
    authenticateJWT,
    authorizeAdmin,
    movieController.deleteMovie
);

module.exports = router;