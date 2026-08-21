const mongoose = require("mongoose");

/* ---------- Seat Schema ---------- */

const seatSchema = new mongoose.Schema({

  seatNumber: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: ["Balcony", "First Class", "Second Class"],
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  isBooked: {
    type: Boolean,
    default: false
  }

});


/* ---------- Show Schema ---------- */

const showSchema = new mongoose.Schema({

  /* Movie Reference */
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true
  },

  /* Theatre Name */
  theatre: {
    type: String,
    required: true
  },

  /* Show Date + Time */
  date: {
    type: String,
    required: true
  },

  time: {
    type: String,
    required: true
  },

  /* Ticket Pricing */
  balconyPrice: {
    type: Number,
    required: true
  },

  firstClassPrice: {
    type: Number,
    required: true
  },

  secondClassPrice: {
    type: Number,
    required: true
  },

  /* Seat List */
  seats: [seatSchema]

},
{ timestamps: true });


module.exports = mongoose.model("Show", showSchema);
