// Parking.js

const mongoose = require("mongoose");

const parkingSchema = new mongoose.Schema(
  {
    theatre: {
      type: String,
      required: true
    },

    bikeSlots: Number,
    carSlots: Number,

    priceBike: Number,
    priceCar: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Parking", parkingSchema);
