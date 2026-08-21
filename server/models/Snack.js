//  Snack.js

const mongoose = require("mongoose");

const snackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: String,

    theatre: {
      type: String,
      required: true   // PVR / IMAX
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Snack", snackSchema);
