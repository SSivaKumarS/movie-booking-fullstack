// movieController.js

const Movie = require("../models/Movie");


// ➤ Add Movie
exports.addMovie = async (req, res) => {
    try {

        console.log("Incoming Movie Data:", req.body); // 🔥 Debug

        const movie = await Movie.create(req.body);

        res.json(movie);

    } catch (err) {

        console.error("Add Movie Error:", err); // 🔥 Shows real error

        res.status(500).json({
            message: err.message
        });
    }
};


// ➤ Get All Movies
exports.getMovies = async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// ➤ Get Single Movie
exports.getMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        res.json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// ➤ Update Movie
exports.updateMovie = async (req, res) => {
    try {
        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// ➤ Delete Movie
exports.deleteMovie = async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);
        res.json({ message: "Movie Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
