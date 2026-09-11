// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Import authMiddleware

// --- OTP Related ---
// POST /auth/send-otp - Request OTP for signup verification
router.post('/send-otp', authController.sendSignupOtp);

// --- Signup/Login ---
// POST /auth/complete-signup - Verify OTP and complete user registration
router.post('/complete-signup', authController.completeSignup); // Changed from /signup

// POST /auth/adminsignup - Admin registration (No OTP assumed)
router.post('/adminsignup', authController.adminsignup);

// POST /auth/theatreadminsignup - Theatre Admin registration (No OTP assumed)
router.post('/theatreadminsignup', authController.theatreAdminSignup);

// POST /auth/login - User login
router.post('/login', authController.login);

// --- User Profile/Settings (Protected) ---
// GET /auth/me - Get logged in user's profile
router.get('/me', authMiddleware.authenticateJWT, authController.getMe);

// PUT /auth/profile - Update logged in user's profile
router.put('/profile', authMiddleware.authenticateJWT, authController.updateProfile);

// PUT /auth/password - Change user password
router.put('/password', authMiddleware.authenticateJWT, authController.changePassword);

module.exports = router;