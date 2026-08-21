// snackOrderController.js

const SnackOrder = require("../models/SnackOrder");
const Show = require("../models/Show");
const Snack = require("../models/Snack");

// ➤ Create Standalone Snack Order
exports.createSnackOrder = async (req, res) => {
  try {
    const { userId, theatre, movieTitle, bookingId, items, totalPrice, deliveryType, seatNumber } = req.body;

    if (!userId || !theatre || !items || items.length === 0) {
      return res.status(400).json({ message: "User ID, Theatre, and at least 1 item are required." });
    }

    const orderPassId = "SNK-" + Math.floor(100000 + Math.random() * 900000);

    const order = await SnackOrder.create({
      userId,
      orderPassId,
      theatre,
      movieTitle: movieTitle || "General Theater Order",
      bookingId: bookingId || null,
      items,
      totalPrice: totalPrice || items.reduce((sum, item) => sum + item.price * item.qty, 0),
      deliveryType: deliveryType || "Express Counter Pickup",
      seatNumber: seatNumber || "",
      status: "CONFIRMED",
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("Snack Order Error:", err);
    res.status(500).json({ message: err.message || "Failed to place snack order" });
  }
};

// ➤ Get User Snack Orders
exports.getUserSnackOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await SnackOrder.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ Get Single Snack Order by ID or orderPassId
exports.getSnackOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await SnackOrder.findOne({
      $or: [{ _id: orderId }, { orderPassId: orderId }],
    }).populate("userId", "name email");

    if (!order) {
      return res.status(404).json({ message: "Snack order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ Get Available Theatres and Movies metadata for F&B filtering
exports.getTheatresAndMovies = async (req, res) => {
  try {
    const shows = await Show.find().populate("movieId", "title genre poster");
    const snacks = await Snack.find();

    const snackTheatres = Array.from(new Set(snacks.map((s) => s.theatre)));
    const showTheatres = Array.from(new Set(shows.map((s) => s.theatre)));
    const allTheatres = Array.from(new Set([...snackTheatres, ...showTheatres]));

    const moviesByTheatre = {};

    shows.forEach((s) => {
      if (s.theatre && s.movieId) {
        if (!moviesByTheatre[s.theatre]) {
          moviesByTheatre[s.theatre] = [];
        }
        const exists = moviesByTheatre[s.theatre].some(
          (m) => m._id.toString() === s.movieId._id.toString()
        );
        if (!exists) {
          moviesByTheatre[s.theatre].push({
            _id: s.movieId._id,
            title: s.movieId.title,
            genre: s.movieId.genre,
            poster: s.movieId.poster,
          });
        }
      }
    });

    res.json({
      theatres: allTheatres,
      moviesByTheatre,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ Get All Snack Orders (Admin)
exports.getAllSnackOrders = async (req, res) => {
  try {
    const orders = await SnackOrder.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ Update Snack Order Status (Admin)
exports.updateSnackOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await SnackOrder.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
