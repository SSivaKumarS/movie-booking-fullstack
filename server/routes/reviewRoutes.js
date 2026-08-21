const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Review = require("../models/Review");
const User = require("../models/User");
require("../models/Movie");
const { authMiddleware } = require("../middleware/authMiddleware");

// GET reviews for a movie
router.get("/movie/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    if (!movieId || !mongoose.Types.ObjectId.isValid(movieId)) {
      return res.json({ reviews: [], avgRating: 0, totalRatings: 0 });
    }

    const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });
    const totalRatings = reviews.length;
    const avgRating =
      totalRatings > 0
        ? (reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalRatings).toFixed(1)
        : 0;

    return res.json({ reviews, avgRating: Number(avgRating), totalRatings });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return res.json({ reviews: [], avgRating: 0, totalRatings: 0 });
  }
});

// POST add a review
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { movieId, rating, comment } = req.body;

    if (!movieId || !rating || !comment) {
      return res.status(400).json({ message: "All fields (movie, rating, comment) are required" });
    }

    const rawUserId = req.user?.id || req.user?._id;
    let userId = rawUserId;
    if (!userId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
      userId = new mongoose.Types.ObjectId("661234567890123456789012");
    } else {
      userId = new mongoose.Types.ObjectId(rawUserId);
    }

    let userName = req.user?.name;
    if (!userName && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const dbUser = await User.findById(userId);
        if (dbUser) userName = dbUser.name;
      } catch (e) {}
    }

    let validMovieId = movieId;
    if (mongoose.Types.ObjectId.isValid(movieId)) {
      validMovieId = new mongoose.Types.ObjectId(movieId);
    }

    const review = new Review({
      movieId: validMovieId,
      userId,
      userName: userName || "Movie Enthusiast",
      rating: Number(rating) || 5,
      comment: String(comment).trim(),
    });

    await review.save();
    return res.status(201).json({ message: "Review posted successfully! 🎉", review });
  } catch (error) {
    console.error("Post review error:", error);
    return res.status(500).json({ message: "Failed to post review", error: error.message });
  }
});

module.exports = router;
