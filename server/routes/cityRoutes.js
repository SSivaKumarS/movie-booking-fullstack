// backend/routes/cityRoutes.js
const express = require('express');
const router = express.Router();
const theaterController = require('../controllers/theaterController'); // Adjust path if necessary

// Public route to get cities (NO AUTHENTICATION)
router.get('/', theaterController.getCities); // Route for /api/v1/cities

module.exports = router;