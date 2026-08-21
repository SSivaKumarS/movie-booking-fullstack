// SnackOrder.js

const mongoose = require("mongoose");

const snackOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderPassId: {
      type: String,
      required: true,
      unique: true,
    },

    theatre: {
      type: String,
      required: true,
    },

    movieTitle: {
      type: String,
      default: "General Theater Order",
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true, default: 1 },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },

    deliveryType: {
      type: String,
      enum: ["Express Counter Pickup", "In-Seat Delivery"],
      default: "Express Counter Pickup",
    },

    seatNumber: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"],
      default: "CONFIRMED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SnackOrder", snackOrderSchema);
