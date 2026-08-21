// Booking.js

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    seats: [String],

    snacks: [
      {
        name: String,
        price: Number,
        qty: Number,
      },
    ],

    parking: {
      type: {
        type: String,
      },
      price: Number,
      theatre: String,
    },

    totalPrice: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Success", "Failed", "Pending"],
      default: "Success",
    },

    // ── Ticket lifecycle ──────────────────────────────
    used: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["VALID", "USED", "COMPLETED"],
      default: "VALID",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
