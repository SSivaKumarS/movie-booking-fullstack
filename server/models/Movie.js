// Movie.js

const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    poster: {
      type: String,
      required: true
    },
    genre: {
      type: String,
      required: true
    },
    trailerUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
