const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeAdmin } = require('../middleware/authMiddleware');
const controller = require('../controllers/offerController');

// Admin-protected CRUD
router.post('/', authenticateJWT, authorizeAdmin, controller.createOffer);
router.get('/', authenticateJWT, authorizeAdmin, controller.getOffers);
router.get('/:id', authenticateJWT, authorizeAdmin, controller.getOffer);
router.put('/:id', authenticateJWT, authorizeAdmin, controller.updateOffer);
router.delete('/:id', authenticateJWT, authorizeAdmin, controller.deleteOffer);

// Public evaluate endpoint (auth not required for pricing preview)
router.post('/evaluate', controller.evaluate);
router.post('/apply-to-booking', authenticateJWT, controller.applyToBooking);

module.exports = router;


