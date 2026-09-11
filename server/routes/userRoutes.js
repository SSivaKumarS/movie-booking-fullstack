const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');
const { authenticateJWT } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const User = require('../models/User');
const Theater = require('../models/Theater');
const Movie = require('../models/Movie');

// Upload profile picture
router.post('/upload-profile-picture', authenticateJWT, upload.single('profile_picture'), async (req, res) => {
    try {
        console.log('Received profile picture upload request');
        
        if (!req.file) {
            console.error('No file received in the request');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Get the full Cloudinary URL
        const cloudinaryUrl = cloudinary.url(req.file.filename, {
            secure: true,
            transformation: [{ width: 500, height: 500, crop: 'fill' }]
        });

        console.log('File uploaded successfully to Cloudinary:', cloudinaryUrl);

        // Update the user's profile picture in the database with the full URL
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { profile_picture: cloudinaryUrl },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the complete Cloudinary URL
        res.json({
            success: true,
            profile_picture: cloudinaryUrl
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        
        // Check if it's a Cloudinary error
        if (error.http_code) {
            return res.status(error.http_code).json({
                message: `Cloudinary error: ${error.message}`
            });
        }

        res.status(500).json({ 
            message: 'Error uploading profile picture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 

// --- Like/Unlike Theater ---
router.post('/liked-theaters/:theaterId', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { theaterId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(theaterId)) {
            return res.status(400).json({ message: 'Invalid theater ID' });
        }
        const theater = await Theater.findById(theaterId).select('_id');
        if (!theater) return res.status(404).json({ message: 'Theater not found' });

        const updated = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { likedTheaters: theater._id } },
            { new: true }
        ).select('likedTheaters movieNotifications');

        return res.json({ likedTheaters: updated.likedTheaters || [], movieNotifications: updated.movieNotifications || [] });
    } catch (err) {
        console.error('Error liking theater:', err);
        res.status(500).json({ message: 'Failed to like theater' });
    }
});

router.delete('/liked-theaters/:theaterId', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { theaterId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(theaterId)) {
            return res.status(400).json({ message: 'Invalid theater ID' });
        }

        const updated = await User.findByIdAndUpdate(
            userId,
            { $pull: { likedTheaters: theaterId } },
            { new: true }
        ).select('likedTheaters movieNotifications');

        return res.json({ likedTheaters: updated.likedTheaters || [], movieNotifications: updated.movieNotifications || [] });
    } catch (err) {
        console.error('Error unliking theater:', err);
        res.status(500).json({ message: 'Failed to unlike theater' });
    }
});

// --- Movie Notifications toggle ---
router.post('/movie-notifications/:movieId', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { movieId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({ message: 'Invalid movie ID' });
        }
        const movie = await Movie.findById(movieId).select('_id');
        if (!movie) return res.status(404).json({ message: 'Movie not found' });

        const updated = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { movieNotifications: movie._id } },
            { new: true }
        ).select('likedTheaters movieNotifications');

        return res.json({ likedTheaters: updated.likedTheaters || [], movieNotifications: updated.movieNotifications || [] });
    } catch (err) {
        console.error('Error enabling movie notification:', err);
        res.status(500).json({ message: 'Failed to enable notification' });
    }
});

router.delete('/movie-notifications/:movieId', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { movieId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({ message: 'Invalid movie ID' });
        }

        const updated = await User.findByIdAndUpdate(
            userId,
            { $pull: { movieNotifications: movieId } },
            { new: true }
        ).select('likedTheaters movieNotifications');

        return res.json({ likedTheaters: updated.likedTheaters || [], movieNotifications: updated.movieNotifications || [] });
    } catch (err) {
        console.error('Error disabling movie notification:', err);
        res.status(500).json({ message: 'Failed to disable notification' });
    }
});