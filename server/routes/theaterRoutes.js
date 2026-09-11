// backend/routes/theaterRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeTheatreAdmin, authorizeAdmin, authorizeRoles } = require('../middleware/authMiddleware'); // Import necessary middleware
const theaterController = require('../controllers/theaterController');
// NOTE: Do NOT import showtimeController here unless absolutely necessary for a specific route handled *in this file*.

// --- Theater Resource Routes ---

// GET all theaters (accessible to logged-in users, filtered for theatre_admin)
router.get('/', authenticateJWT, theaterController.getAllTheaters);

// POST a new theater (Admin only)
router.post('/', authenticateJWT, authorizeAdmin, theaterController.createTheater);

// GET theaters by search query (must be before /:theaterId route)
router.get('/search', theaterController.searchTheaters);

// GET a specific theater by ID (accessible to logged-in users)
router.get('/:theaterId', authenticateJWT, theaterController.getTheaterById);

// PUT/update a specific theater (Admin can update any, Theatre Admin can update their own)
// Use authorizeRoles to allow both, controller/middleware logic handles ownership check
// Note: authorizeTheatreAdmin *already* checks ownership if theaterId is present
router.put('/:theaterId', authenticateJWT, authorizeRoles('admin', 'theatre_admin'), theaterController.updateTheater);

// DELETE a specific theater (Admin only - highly destructive)
router.delete('/:theaterId', authenticateJWT, authorizeAdmin, theaterController.deleteTheater);


// --- Screen Sub-Resource Routes (Nested under Theater) ---

// GET screens for a specific theater (accessible to logged-in users)
router.get('/:theaterId/screens', authenticateJWT, theaterController.getScreensByTheater);

// POST a new screen for a specific theater (Theatre Admin for that theater only)
router.post('/:theaterId/screens', authenticateJWT, authorizeTheatreAdmin, theaterController.createScreen);

// PUT/update a specific screen belonging to a specific theater (Theatre Admin for that theater only)
router.put('/:theaterId/screens/:screenId', authenticateJWT, authorizeTheatreAdmin, theaterController.updateScreen);

// DELETE a specific screen belonging to a specific theater (Theatre Admin for that theater only)
// ** Corrected route path to include :theaterId for authorization **
router.delete('/:theaterId/screens/:screenId', authenticateJWT, authorizeTheatreAdmin, theaterController.deleteScreen);


// --- Other Routes (Potentially Moved or Removed) ---

// GET showtimes by theater - This logic belongs in showtimeRoutes.js
// REMOVED: router.get('/:theaterId/showtimes', theaterController.getShowtimesByTheater);

module.exports = router;