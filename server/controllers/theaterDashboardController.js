const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Screen = require('../models/Screen');
const Theater = require('../models/Theater');

// Helper function to calculate occupancy rate
const calculateOccupancyRate = (bookedSeats, totalSeats) => {
    return totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
};

// Get today's statistics
exports.getTodayStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all shows running today
        const todayShows = await Showtime.find({
            theater_id: req.user.theater_id,
            start_time: {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('movie_id screen_id');

        // Get all bookings for today
        const todayBookings = await Booking.find({
            showtime_id: { $in: todayShows.map(show => show._id) },
            status: 'active',
            payment_status: 'paid'
        });

        // Calculate statistics
        const ticketsSold = todayBookings.reduce((total, booking) => 
            total + booking.booked_seats.length, 0);

        const revenue = todayBookings.reduce((total, booking) => 
            total + booking.total_amount, 0);

        // Calculate occupancy rate
        const totalSeats = todayShows.reduce((total, show) => 
            total + show.screen_id.total_seats, 0);
        const occupancyRate = calculateOccupancyRate(ticketsSold, totalSeats);

        // Find top performing movie
        const movieStats = {};
        todayBookings.forEach(booking => {
            const show = todayShows.find(s => s._id.equals(booking.showtime_id));
            if (show) {
                const movieId = show.movie_id._id.toString();
                if (!movieStats[movieId]) {
                    movieStats[movieId] = {
                        tickets: 0,
                        revenue: 0
                    };
                }
                movieStats[movieId].tickets += booking.booked_seats.length;
                movieStats[movieId].revenue += booking.total_amount;
            }
        });

        const topMovie = Object.entries(movieStats)
            .sort(([, a], [, b]) => b.tickets - a.tickets)[0];

        res.json({
            ticketsSold,
            revenue,
            showsRunning: todayShows.length,
            occupancyRate,
            topMovie: topMovie ? {
                _id: topMovie[0],
                tickets: topMovie[1].tickets,
                revenue: topMovie[1].revenue
            } : null
        });
    } catch (error) {
        console.error('Error fetching today stats:', error);
        res.status(500).json({ message: 'Error fetching today statistics' });
    }
};

// Get weekly statistics
exports.getWeekStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weekBookings = await Booking.find({
            theater_id: req.user.theater_id,
            booking_date: {
                $gte: weekAgo,
                $lt: today
            },
            status: 'active',
            payment_status: 'paid'
        });

        const ticketsSold = weekBookings.reduce((total, booking) => 
            total + booking.booked_seats.length, 0);

        const revenue = weekBookings.reduce((total, booking) => 
            total + booking.total_amount, 0);

        res.json({
            ticketsSold,
            revenue
        });
    } catch (error) {
        console.error('Error fetching week stats:', error);
        res.status(500).json({ message: 'Error fetching weekly statistics' });
    }
};

// Get monthly statistics
exports.getMonthStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const monthBookings = await Booking.find({
            theater_id: req.user.theater_id,
            booking_date: {
                $gte: monthAgo,
                $lt: today
            },
            status: 'active',
            payment_status: 'paid'
        });

        const ticketsSold = monthBookings.reduce((total, booking) => 
            total + booking.booked_seats.length, 0);

        const revenue = monthBookings.reduce((total, booking) => 
            total + booking.total_amount, 0);

        res.json({
            ticketsSold,
            revenue
        });
    } catch (error) {
        console.error('Error fetching month stats:', error);
        res.status(500).json({ message: 'Error fetching monthly statistics' });
    }
};

// Get today's shows with details
exports.getTodayShows = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const shows = await Showtime.find({
            theater_id: req.user.theater_id,
            start_time: {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('movie_id screen_id');

        const showsWithStats = await Promise.all(shows.map(async (show) => {
            const bookings = await Booking.find({
                showtime_id: show._id,
                status: 'active',
                payment_status: 'paid'
            });

            const bookedSeats = bookings.reduce((total, booking) => 
                total + booking.booked_seats.length, 0);

            const revenue = bookings.reduce((total, booking) => 
                total + booking.total_amount, 0);

            const occupancy = calculateOccupancyRate(
                bookedSeats,
                show.screen_id.total_seats
            );

            return {
                _id: show._id,
                start_time: show.start_time,
                movie: {
                    _id: show.movie_id._id,
                    title: show.movie_id.title
                },
                screen: {
                    _id: show.screen_id._id,
                    screen_number: show.screen_id.screen_number
                },
                occupancy,
                revenue
            };
        }));

        res.json(showsWithStats);
    } catch (error) {
        console.error('Error fetching today shows:', error);
        res.status(500).json({ message: 'Error fetching today shows' });
    }
};

// Get movie-wise statistics
exports.getMovieStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const shows = await Showtime.find({
            theater_id: req.user.theater_id,
            start_time: { $gte: thirtyDaysAgo }
        }).populate('movie_id');

        const movieStats = {};
        for (const show of shows) {
            const movieId = show.movie_id._id.toString();
            if (!movieStats[movieId]) {
                movieStats[movieId] = {
                    _id: movieId,
                    title: show.movie_id.title,
                    ticketsSold: 0,
                    revenue: 0,
                    totalShows: 0,
                    totalSeats: 0,
                    bookedSeats: 0
                };
            }

            const bookings = await Booking.find({
                showtime_id: show._id,
                status: 'active',
                payment_status: 'paid'
            });

            movieStats[movieId].ticketsSold += bookings.reduce((total, booking) => 
                total + booking.booked_seats.length, 0);
            movieStats[movieId].revenue += bookings.reduce((total, booking) => 
                total + booking.total_amount, 0);
            movieStats[movieId].totalShows += 1;
        }

        const movieStatsArray = Object.values(movieStats).map(stats => ({
            ...stats,
            avgOccupancy: calculateOccupancyRate(stats.ticketsSold, stats.totalSeats)
        }));

        res.json(movieStatsArray);
    } catch (error) {
        console.error('Error fetching movie stats:', error);
        res.status(500).json({ message: 'Error fetching movie statistics' });
    }
};

// Get screen-wise statistics
exports.getScreenStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const screens = await Screen.find({ theater_id: req.user.theater_id });
        const screenStats = await Promise.all(screens.map(async (screen) => {
            const shows = await Showtime.find({
                screen_id: screen._id,
                start_time: {
                    $gte: today,
                    $lt: tomorrow
                }
            });

            const bookings = await Booking.find({
                showtime_id: { $in: shows.map(show => show._id) },
                status: 'active',
                payment_status: 'paid'
            });

            const bookedSeats = bookings.reduce((total, booking) => 
                total + booking.booked_seats.length, 0);

            const revenue = bookings.reduce((total, booking) => 
                total + booking.total_amount, 0);

            return {
                _id: screen._id,
                screen_number: screen.screen_number,
                showsToday: shows.length,
                utilization: calculateOccupancyRate(bookedSeats, screen.total_seats * shows.length),
                revenue
            };
        }));

        res.json(screenStats);
    } catch (error) {
        console.error('Error fetching screen stats:', error);
        res.status(500).json({ message: 'Error fetching screen statistics' });
    }
}; 