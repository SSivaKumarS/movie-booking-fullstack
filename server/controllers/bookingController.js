// // bookingController.js

// const Show = require("../models/Show");
// const Booking = require("../models/Booking");

// /* ---------------- BOOK SEATS ---------------- */

// exports.bookSeats = async (req, res) => {

//   try {

//     const {
//       showId,
//       seats,
//       userId,
//       snacks = [],
//       parking = null
//     } = req.body;

//     const show = await Show.findById(showId);

//     if (!show)
//       return res.status(404).json({ message: "Show not found" });

//     /* Check already booked seats */

//     const alreadyBooked = show.seats.filter(
//       seat => seats.includes(seat.seatNumber) && seat.isBooked
//     );

//     if (alreadyBooked.length > 0)
//       return res.status(400).json({
//         message: "Seats already booked"
//       });

//     /* Mark seats booked */

//     show.seats.forEach(seat => {
//       if (seats.includes(seat.seatNumber)) {
//         seat.isBooked = true;
//       }
//     });

//     await show.save();

//     /* ---------- Price Calculation ---------- */

//     const seatPrice = 200;
//     let totalPrice = seats.length * seatPrice;

//     let snacksTotal = 0;

//     snacks.forEach(snack => {
//       snacksTotal += snack.price * snack.qty;
//     });

//     const parkingPrice = parking?.price || 0;

//     totalPrice += snacksTotal + parkingPrice;

//     /* ---------- Save Booking ---------- */

//     const booking = await Booking.create({
//       showId,
//       seats,
//       userId,
//       snacks,
//       parking,
//       totalPrice,
//       paymentStatus: "Success"
//     });

//     res.json(booking);

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };


// /* ---------------- USER BOOKINGS ---------------- */

// exports.getUserBookings = async (req, res) => {

//   try {

//     const bookings = await Booking.find({
//       userId: req.params.userId
//     })
//       .populate({
//         path: "showId",
//         populate: { path: "movieId" }
//       })
//       .populate("userId");

//     res.json(bookings);

//   } catch (err) {
//     res.status(500).json({
//       message: "Booking fetch failed"
//     });
//   }
// };


// /* ---------------- GET BOOKING BY ID ---------------- */

// exports.getBookingById = async (req, res) => {

//   try {

//     const booking = await Booking.findById(req.params.id)
//       .populate({
//         path: "showId",
//         populate: { path: "movieId" }
//       });

//     res.json(booking);

//   } catch {
//     res.status(404).json({
//       message: "Booking not found"
//     });
//   }
// };


// /* ---------------- MARK TICKET USED ---------------- */

// exports.markAsUsed = async (req, res) => {

//   try {

//     const booking = await Booking.findById(req.params.id);

//     if (!booking)
//       return res.status(404).json({
//         message: "Booking not found"
//       });

//     if (booking.used)
//       return res.json({
//         message: "Already Used"
//       });

//     booking.used = true;
//     await booking.save();

//     res.json({
//       message: "Ticket marked as used"
//     });

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };


// /* ---------------- PARKING REVENUE ---------------- */

// exports.getParkingRevenue = async (req, res) => {

//   try {

//     const bookings = await Booking.find();

//     const revenue = {};

//     bookings.forEach(b => {

//       if (!b.parking) return;

//       const theatre = b.parking.theatre;

//       if (!revenue[theatre])
//         revenue[theatre] = 0;

//       revenue[theatre] += b.parking.price;
//     });

//     res.json(revenue);

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };













// bookingController.js

const Show = require("../models/Show");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");

/* ---------------- BOOK SEATS ---------------- */

exports.bookSeats = async (req, res) => {
  try {
    const {
      showId,
      seats,
      userId,
      snacks = [],
      parking = null
    } = req.body;

    /* ----------- Basic Validation ----------- */

    if (!mongoose.Types.ObjectId.isValid(showId))
      return res.status(400).json({ message: "Invalid show ID" });

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid user ID" });

    if (!Array.isArray(seats) || seats.length === 0)
      return res.status(400).json({ message: "No seats selected" });

    const show = await Show.findById(showId);

    if (!show)
      return res.status(404).json({ message: "Show not found" });

    /* ----------- Check Already Booked ----------- */

    const alreadyBooked = show.seats.filter(
      seat => seats.includes(seat.seatNumber) && seat.isBooked
    );

    if (alreadyBooked.length > 0)
      return res.status(400).json({
        message: "Some seats are already booked",
        seats: alreadyBooked.map(s => s.seatNumber)
      });

    /* ----------- Mark Seats as Booked ----------- */

    show.seats.forEach(seat => {
      if (seats.includes(seat.seatNumber)) {
        seat.isBooked = true;
      }
    });

    await show.save();

    /* ----------- Dynamic Price Calculation ----------- */

    let totalPrice = 0;

    const selectedSeatObjects = show.seats.filter(
      s => seats.includes(s.seatNumber)
    );

    selectedSeatObjects.forEach(s => {
      totalPrice += s.price;
    });

    let snacksTotal = 0;

    snacks.forEach(snack => {
      if (snack.qty > 0 && snack.price > 0) {
        snacksTotal += snack.price * snack.qty;
      }
    });

    const parkingPrice = parking?.price || 0;

    totalPrice += snacksTotal + parkingPrice;

    /* ----------- Create Booking ----------- */

    const booking = await Booking.create({
      showId,
      seats,
      userId,
      snacks,
      parking,
      totalPrice,
      paymentStatus: "Success",
      used: false
    });

    /* ----------- Populate Before Sending ----------- */

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "showId",
        populate: { path: "movieId" }
      })
      .populate("userId");

    res.status(201).json(populatedBooking);

  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({
      message: "Booking failed",
      error: err.message
    });
  }
};


/* ---------------- USER BOOKINGS ---------------- */

// exports.getUserBookings = async (req, res) => {
//   try {

//     if (!mongoose.Types.ObjectId.isValid(req.params.userId))
//       return res.status(400).json({ message: "Invalid user ID" });

//     const bookings = await Booking.find({
//       userId: req.params.userId
//     })
//       .populate({
//         path: "showId",
//         populate: { path: "movieId" }
//       })
//       .populate("userId")
//       .sort({ createdAt: -1 });

//     res.json(bookings);

//   } catch (err) {
//     res.status(500).json({
//       message: "Booking fetch failed",
//       error: err.message
//     });
//   }
// };


exports.getUserBookings = async (req, res) => {

  try {

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const bookings = await Booking.find({ userId })
      .populate({
        path: "showId",
        populate: { path: "movieId" }
      })
      .populate("userId")
      .sort({ createdAt: -1 });

    res.json(bookings);

  } catch (err) {

    res.status(500).json({
      message: "Booking fetch failed",
      error: err.message
    });

  }

};


/* ---------------- GET BOOKING BY ID ---------------- */

exports.getBookingById = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid booking ID" });

    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "showId",
        populate: { path: "movieId" }
      })
      .populate("userId");

    if (!booking)
      return res.status(404).json({
        message: "Booking not found"
      });

    res.json(booking);

  } catch (err) {
    res.status(500).json({
      message: "Error fetching booking",
      error: err.message
    });
  }
};


/* ---------------- MARK TICKET USED ---------------- */

exports.markAsUsed = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid booking ID" });

    const booking = await Booking.findById(req.params.id);

    if (!booking)
      return res.status(404).json({
        message: "Booking not found"
      });

    if (booking.used)
      return res.json({
        message: "Ticket already used"
      });

    booking.used = true;
    await booking.save();

    res.json({
      message: "Ticket marked as used"
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to mark ticket",
      error: err.message
    });
  }
};


/* ---------------- PARKING REVENUE ---------------- */

exports.getParkingRevenue = async (req, res) => {
  try {

    const bookings = await Booking.find();

    const revenue = {};

    bookings.forEach(b => {
      if (!b.parking) return;

      const theatre = b.parking.theatre;

      if (!revenue[theatre])
        revenue[theatre] = 0;

      revenue[theatre] += b.parking.price;
    });

    res.json(revenue);

  } catch (err) {
    res.status(500).json({
      message: "Failed to calculate parking revenue",
      error: err.message
    });
  }
};
