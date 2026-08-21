const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Show = require("../models/Show");

exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchStage = {};

    if (startDate && endDate) {
      matchStage = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    /* ---------------- MOVIE COLLECTION ---------------- */

    const movieStats = await Booking.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "shows",
          localField: "showId",
          foreignField: "_id",
          as: "show",
        },
      },
      { $unwind: "$show" },
      {
        $lookup: {
          from: "movies",
          localField: "show.movieId",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      {
        $addFields: {
          bookedSeats: {
            $filter: {
              input: "$show.seats",
              as: "s",
              cond: { $in: ["$$s.seatNumber", "$seats"] },
            },
          },
        },
      },
      {
        $addFields: {
          ticketRevenue: { $sum: "$bookedSeats.price" },
        },
      },
      {
        $group: {
          _id: "$movie._id",
          title: { $first: "$movie.title" },
          poster: { $first: "$movie.poster" },
          ticketsSold: { $sum: { $size: "$seats" } },
          ticketRevenue: { $sum: "$ticketRevenue" },
        },
      },
    ]);

    /* ---------------- THEATRE COLLECTION ---------------- */

    const theatreStats = await Booking.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "shows",
          localField: "showId",
          foreignField: "_id",
          as: "show",
        },
      },
      { $unwind: "$show" },
      {
        $lookup: {
          from: "movies",
          localField: "show.movieId",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      {
        $addFields: {
          bookedSeats: {
            $filter: {
              input: "$show.seats",
              as: "s",
              cond: { $in: ["$$s.seatNumber", "$seats"] },
            },
          },
        },
      },
      {
        $addFields: {
          seatRevenue: { $sum: "$bookedSeats.price" },
          snackRevenue: {
            $reduce: {
              input: "$snacks",
              initialValue: 0,
              in: {
                $add: ["$$value", { $multiply: ["$$this.price", "$$this.qty"] }],
              },
            },
          },
          parkingRevenue: {
            $ifNull: ["$parking.price", 0],
          },
        },
      },
      {
        $group: {
          _id: {
            theatre: "$show.theatre",
            movie: "$movie.title",
          },
          movieRevenue: { $sum: "$seatRevenue" },
          snackRevenue: { $sum: "$snackRevenue" },
          parkingRevenue: { $sum: "$parkingRevenue" },
        },
      },
      {
        $group: {
          _id: "$_id.theatre",
          movies: {
            $push: {
              title: "$_id.movie",
              revenue: "$movieRevenue",
            },
          },
          ticketRevenue: { $sum: "$movieRevenue" },
          snackRevenue: { $sum: "$snackRevenue" },
          parkingRevenue: { $sum: "$parkingRevenue" },
        },
      },
      {
        $addFields: {
          totalRevenue: {
            $add: ["$ticketRevenue", "$snackRevenue", "$parkingRevenue"],
          },
        },
      },
    ]);

    /* ---------------- SUMMARY ---------------- */

    const totalMovies = await Movie.countDocuments();
    const totalShows = await Show.countDocuments();
    
    const ticketCounts = await Booking.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalSeats: { $sum: { $size: "$seats" } } } }
    ]);
    const totalTickets = ticketCounts[0]?.totalSeats || 0;

    const totalRevenueResult = await Booking.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({
      movieStats,
      theatreStats,
      summary: {
        totalMovies,
        totalShows,
        totalTickets,
        totalBookings: await Booking.countDocuments(matchStage),
        totalRevenue: totalRevenueResult[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Analytics fetch failed", error: err.message });
  }
};
