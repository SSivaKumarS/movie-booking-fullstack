// backend/controllers/movieController.js
const mongoose = require('mongoose');

// Import Mongoose Models
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment'); // Needed for cascading deletes
const Theater = require('../models/Theater');

// Helper function to get the start of the current day
const getStartOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    return today;
};


// --- Get all movies ---
exports.getAllMovies = async (req, res, next) => {
    try {
        // Find all movies, optionally sort by title or release date
        const movies = await Movie.find().sort({ title: 1 }); // Example: Sort by title ascending
        res.status(200).json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        next(error); // Pass error to central error handler
    }
};

// --- Get a single movie by ID along with upcoming showtimes ---
exports.getMovieById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid movie ID format' });
        }

        // Fetch movie details
        const movie = await Movie.findById(id);

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Fetch showtimes for the movie from the start of the current day onwards
        const todayStart = getStartOfToday();
        const showtimes = await Showtime.find({
            movie_id: id,
            start_time: { $gte: todayStart } // Use $gte (greater than or equal to)
        })
            .select('start_time theater_id screen_id language') // Select only necessary fields
            .populate('theater_id', 'name city') // Populate theater name/city
            .populate('screen_id', 'screen_number') // Populate screen number
            .sort({ start_time: 1 }); // Sort by start_time ascending

        // Combine movie details and showtimes
        res.status(200).json({ movie, showtimes });

    } catch (error) {
        console.error('Error fetching movie and showtimes:', error);
        next(error);
    }
};

// --- Search movies by title (case-insensitive) ---
exports.searchMovies = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({ message: 'Search query is required and must be a non-empty string' });
        }

        // Use a regular expression for case-insensitive search
        const searchRegex = new RegExp(query.trim(), 'i'); // 'i' for case-insensitive

        // Find movies matching the title, select only necessary fields
        const movies = await Movie.find({ title: { $regex: searchRegex } })
            .select('_id title poster_url'); // Select fields for search results

        res.status(200).json(movies);
    } catch (error) {
        console.error('Error searching movies:', error);
        next(error);
    }
};


// --- Create a new movie ---
exports.createMovie = async (req, res, next) => { // Ensure next is passed
    try {
        // This should now expect req.body.languages instead of req.body.language
        const newMovie = await Movie.create(req.body);
        res.status(201).json({ message: 'Movie created successfully', movie: newMovie });
    } catch (error) {
        console.error('Error creating movie:', error); // Log the actual error first

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') }); // Added return
        }

        // Handle specific MongoServerError codes
        if (error instanceof mongoose.mongo.MongoServerError) {
            if (error.code === 17261 || error.code === 17262) { // Handle both language override errors
                // Provide a generic message as the field is now 'languages'
                return res.status(400).json({ message: `Invalid data format/type for languages field: ${error.errorResponse?.errmsg || 'Check data.'}` }); // Added return
            }
            if (error.code === 11000) { // Duplicate key
                const field = Object.keys(error.keyValue)[0];
                return res.status(409).json({ message: `Duplicate field value entered for '${field}'. Please use another value.` }); // Added return
            }
        }

        // If none of the specific errors matched, pass to global handler
        next(error);
    }
};

// --- Update an existing movie ---
exports.updateMovie = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid movie ID format' });
        }

        // Find by ID and update with request body, run validators, return updated doc
        const updatedMovie = await Movie.findByIdAndUpdate(
            id,
            req.body, // Mongoose handles $set implicitly here for fields in body
            { new: true, runValidators: true } // Options: return updated, run schema validation
        );

        if (!updatedMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.status(200).json({ message: 'Movie updated successfully', movie: updatedMovie });
    } catch (error) {
        console.error('Error updating movie:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        // Handle potential duplicate key errors if updating a field with a unique index
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Update failed due to duplicate key constraint.' });
        }
        next(error);
    }
};


// --- Get "Now in Cinemas" Movies (with active shows, using Aggregation) ---
exports.getNowInCinemasMovies = async (req, res, next) => {
    try {
        const todayStart = getStartOfToday();
        const { city } = req.query; // Get city from query params

        // First, get all theaters in the specified city
        const theatersInCity = await Theater.find({ city }).select('_id').lean();
        if (!theatersInCity.length) {
            return res.status(200).json([]); // Return empty array if no theaters in city
        }
        const theaterIdsInCity = theatersInCity.map(t => t._id);

        const nowInCinemasMovies = await Showtime.aggregate([
            // 1. Match showtimes from today onwards and in the specified city
            {
                $match: {
                    start_time: { $gte: todayStart },
                    theater_id: { $in: theaterIdsInCity }
                }
            },
            // 2. Group by movie_id to count shows
            {
                $group: {
                    _id: "$movie_id", // Group by the movie ObjectId
                    show_count: { $sum: 1 } // Count the number of showtimes per movie
                }
            },
            // 3. Sort by show_count descending
            {
                $sort: { show_count: -1 }
            },
            // 4. Lookup movie details from the 'movies' collection
            {
                $lookup: {
                    from: "movies", // The name of the movies collection
                    localField: "_id", // Field from the $group stage (the movie_id)
                    foreignField: "_id", // Field in the movies collection
                    as: "movieDetails" // Name of the new array field to add
                }
            },
            // 5. Deconstruct the movieDetails array (since $lookup returns an array)
            {
                $unwind: "$movieDetails"
            },
            // 6. Reshape the output document (optional but cleaner)
            {
                $project: {
                    _id: "$movieDetails._id", // Use movie's original _id
                    title: "$movieDetails.title",
                    genre: "$movieDetails.genre",
                    duration: "$movieDetails.duration",
                    release_date: "$movieDetails.release_date",
                    language: "$movieDetails.language",
                    rating: "$movieDetails.rating",
                    description: "$movieDetails.description",
                    poster_url: "$movieDetails.poster_url",
                    trailer_url: "$movieDetails.trailer_url",
                    createdAt: "$movieDetails.createdAt",
                    updatedAt: "$movieDetails.updatedAt",
                    show_count: "$show_count" // Include the calculated show_count
                }
            }
        ]);

        res.status(200).json(nowInCinemasMovies);
    } catch (error) {
        console.error('Error fetching "Now in Cinemas" movies:', error);
        next(error);
    }
};


// --- Get "Coming Soon" Movies for Movies Page ---
exports.getComingSoonMoviesPage = async (req, res, next) => {
    try {
        const today = new Date(); // Use current date for comparison

        // 1. Find all distinct movie IDs that have *any* showtimes
        const movieIdsWithShowtimes = await Showtime.distinct('movie_id');

        // 2. Find movies that are NOT in the list above AND have a release date in the future
        const comingSoonMovies = await Movie.find({
            _id: { $nin: movieIdsWithShowtimes }, // $nin: not in the array
            release_date: { $gt: today }          // $gt: greater than today
        })
            .sort({ release_date: -1 }); // Order by release date descending

        res.status(200).json(comingSoonMovies);
    } catch (error) {
        console.error('Error fetching "Coming Soon" movies for Movies page:', error);
        next(error);
    }
};


// --- Delete a movie and its related data (Showtimes, Bookings, Payments) ---
exports.deleteMovie = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid movie ID format' });
    }

    // Use a transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find showtimes associated with the movie
        const showtimesToDelete = await Showtime.find({ movie_id: id }).select('_id').session(session);
        const showtimeIds = showtimesToDelete.map(st => st._id);

        if (showtimeIds.length > 0) {
            // 2. Find bookings associated with these showtimes
            const bookingsToDelete = await Booking.find({ showtime_id: { $in: showtimeIds } }).select('_id').session(session);
            const bookingIds = bookingsToDelete.map(b => b._id);

            if (bookingIds.length > 0) {
                // 3. Delete Payments associated with these bookings (if applicable)
                await Payment.deleteMany({ booking_id: { $in: bookingIds } }).session(session);
                console.log(`Deleted payments for bookings: ${bookingIds.join(', ')}`);

                // 4. Delete Bookings
                await Booking.deleteMany({ _id: { $in: bookingIds } }).session(session);
                console.log(`Deleted bookings: ${bookingIds.join(', ')}`);
            }

            // 5. Delete Showtimes
            await Showtime.deleteMany({ _id: { $in: showtimeIds } }).session(session);
            console.log(`Deleted showtimes: ${showtimeIds.join(', ')}`);
        }

        // 6. Delete the Movie itself
        const deletedMovie = await Movie.findByIdAndDelete(id).session(session);

        if (!deletedMovie) {
            // If movie wasn't found initially
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Commit the transaction if all deletions were successful
        await session.commitTransaction();
        console.log(`Successfully deleted movie ${id} and related data.`);

        res.status(200).json({ message: 'Movie and associated data deleted successfully', movieId: id });

    } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        console.error(`Error deleting movie ${id}:`, error);
        next(error);
    } finally {
        // End session regardless of outcome
        session.endSession();
    }
};


// --- Get Popular Movies (Top 5 with active shows) ---
exports.getPopularMovies = async (req, res, next) => {
    try {
        const todayStart = getStartOfToday();
        const { city } = req.query; // Get city from query params

        // First, get all theaters in the specified city
        const theatersInCity = await Theater.find({ city }).select('_id').lean();
        if (!theatersInCity.length) {
            return res.status(200).json([]); // Return empty array if no theaters in city
        }
        const theaterIdsInCity = theatersInCity.map(t => t._id);

        // Use the same aggregation pipeline as getNowInCinemasMovies, adding a limit
        const popularMovies = await Showtime.aggregate([
            // 1. Match showtimes from today onwards and in the specified city
            {
                $match: {
                    start_time: { $gte: todayStart },
                    status: 'scheduled',
                    theater_id: { $in: theaterIdsInCity }
                }
            },
            // 2. Group by movie_id to count shows
            {
                $group: {
                    _id: "$movie_id",
                    show_count: { $sum: 1 }
                }
            },
            // 3. Sort by show_count descending
            {
                $sort: { show_count: -1 }
            },
            // 4. Limit to top 5
            {
                $limit: 5
            },
            // 5. Lookup movie details
            {
                $lookup: {
                    from: "movies",
                    localField: "_id",
                    foreignField: "_id",
                    as: "movieDetails"
                }
            },
            // 6. Deconstruct movieDetails array
            {
                $unwind: "$movieDetails"
            },
            // 7. Project the desired output fields
            {
                $project: {
                    // Include all fields from movieDetails using $$ROOT
                    _id: "$movieDetails._id",
                    title: "$movieDetails.title",
                    genre: "$movieDetails.genre",
                    poster_url: "$movieDetails.poster_url",
                    // ... include other movie fields as needed ...
                    show_count: "$show_count"
                }
            }
        ]);

        res.status(200).json(popularMovies);
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        next(error);
    }
};

// --- Get Upcoming Movies (No shows, release date > today, limit 5) ---
exports.getUpcomingMovies = async (req, res, next) => {
    try {
        const today = new Date(); // Get current date/time for comparison

        // 1. Find all distinct movie ObjectIds that exist in the Showtimes collection
        const movieIdsWithShowtimes = await Showtime.distinct('movie_id');

        // 2. Find movies that meet the following criteria:
        //    - Their _id is NOT IN the array of IDs found above ($nin operator)
        //    - Their release_date is strictly GREATER THAN today ($gt operator)
        const upcomingMovies = await Movie.find({
            _id: { $nin: movieIdsWithShowtimes }, // Find movies whose _id is NOT IN the array
            release_date: { $gt: today }          // Find movies with release_date after today
        })
            .sort({ release_date: 1 }) // Sort by release_date ASCENDING (earliest first)
            .limit(5)                   // Limit the results to 5
            .select('_id title poster_url release_date genre'); // Select needed fields including genre

        // 3. Send the results
        res.status(200).json(upcomingMovies);

    } catch (error) {
        console.error('Error fetching upcoming movies:', error);
        next(error); // Pass the error to the central error handler
    }
};

// --- **UPDATED** Get Booking Stats for a Movie ---
exports.getBookingStatsForMovie = async (req, res, next) => {
    try {
        const { id: movieId } = req.params;
        const { timeframe } = req.query; // Expect '1h' or '24h'

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({ message: 'Invalid movie ID format' });
        }
        
        // Determine the start date for the query based on the timeframe
        let startDate;
        if (timeframe === '1h') {
            startDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        } else {
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
        }

        const showtimes = await Showtime.find({ movie_id: movieId }).select('_id').lean();
        const showtimeIds = showtimes.map(st => st._id);

        if (showtimeIds.length === 0) {
            return res.status(200).json({ ticketCount: 0 });
        }

        const stats = await Booking.aggregate([
            {
                $match: {
                    showtime_id: { $in: showtimeIds },
                    status: 'active',
                    booking_date: { $gte: startDate } // Use the dynamic start date
                }
            },
            {
                $group: {
                    _id: null,
                    totalTickets: { $sum: { $size: "$booked_seats" } }
                }
            }
        ]);

        const ticketCount = stats.length > 0 ? stats[0].totalTickets : 0;
        res.status(200).json({ ticketCount });

    } catch (error) {
        console.error('Error fetching booking stats for movie:', error);
        next(error);
    }
};