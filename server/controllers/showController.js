const Show = require("../models/Show");
const Parking = require("../models/Parking");

/* ---------- Seat Generator ---------- */
const generateSeats = (balconyPrice, firstPrice, secondPrice) => {

  const seats = [];

  // BALCONY (A–D)
  ["A","B","C","D"].forEach(row => {
    for (let i = 1; i <= 10; i++) {
      seats.push({
        seatNumber: `${row}${i}`,
        category: "Balcony",
        price: Number(balconyPrice),
        isBooked: false
      });
    }
  });

  // FIRST CLASS (E–H)
  ["E","F","G","H"].forEach(row => {
    for (let i = 1; i <= 12; i++) {
      seats.push({
        seatNumber: `${row}${i}`,
        category: "First Class",
        price: Number(firstPrice),
        isBooked: false
      });
    }
  });

  // SECOND CLASS (I–L)
  ["I","J","K","L"].forEach(row => {
    for (let i = 1; i <= 12; i++) {
      seats.push({
        seatNumber: `${row}${i}`,
        category: "Second Class",
        price: Number(secondPrice),
        isBooked: false
      });
    }
  });

  return seats;
};

/* ---------- ADD SHOW ---------- */
exports.addShow = async (req, res) => {
  try {

    const {
      movieId,
      theatre,
      date,
      time,
      balconyPrice,
      firstClassPrice,
      secondClassPrice
    } = req.body;

    const seats = generateSeats(
      balconyPrice,
      firstClassPrice,
      secondClassPrice
    );

    const show = await Show.create({
      movieId,
      theatre,
      date,
      time,
      balconyPrice,
      firstClassPrice,
      secondClassPrice,
      seats
    });

    // Auto create parking if not exists
    const exists = await Parking.findOne({ theatre });

    if (!exists) {
      await Parking.create({
        theatre,
        priceBike: 20,
        priceCar: 50
      });
    }

    res.json(show);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

/* ---------- GET SHOW BY ID ---------- */
exports.getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.showId);
    res.json(show);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- GET SHOWS BY MOVIE ---------- */
exports.getShowsByMovie = async (req, res) => {
  try {
    const shows = await Show.find({
      movieId: req.params.movieId
    });
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- GET ALL SHOWS ---------- */
exports.getAllShows = async (req, res) => {
  try {
    const shows = await Show.find().populate("movieId");
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE SHOW ---------- */
exports.deleteShow = async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE SHOW ---------- */
exports.updateShow = async (req, res) => {
  try {
    const updated = await Show.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
