const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");

// Default initial coupons array for seeding/fallback
const defaultCoupons = [
  { code: "CINE50", description: "Get ₹50 flat off on bookings above ₹200", discountType: "FIXED", discountValue: 50, minBookingAmount: 200, isActive: true },
  { code: "WELCOME20", description: "Get 20% off on your booking", discountType: "PERCENTAGE", discountValue: 20, minBookingAmount: 100, isActive: true },
  { code: "SUPER100", description: "Flat ₹100 discount for movie buffs", discountType: "FIXED", discountValue: 100, minBookingAmount: 500, isActive: true }
];

// GET available active coupons
router.get("/active", async (req, res) => {
  try {
    let coupons = await Coupon.find({ isActive: true });
    if (!coupons || coupons.length === 0) {
      coupons = defaultCoupons;
    }
    res.json(coupons);
  } catch (error) {
    res.json(defaultCoupons);
  }
});

// POST validate coupon code
router.post("/validate", async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const uppercaseCode = code.trim().toUpperCase();
    let coupon = await Coupon.findOne({ code: uppercaseCode, isActive: true });

    // Fallback search in default coupons if DB returns empty
    if (!coupon) {
      const found = defaultCoupons.find(c => c.code === uppercaseCode && c.isActive);
      if (found) coupon = found;
    }

    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired promo code" });
    }

    if (totalAmount < coupon.minBookingAmount) {
      return res.status(400).json({
        message: `Minimum total of ₹${coupon.minBookingAmount} required to apply this code.`
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === "FIXED") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "PERCENTAGE") {
      discountAmount = Math.round((totalAmount * coupon.discountValue) / 100);
    }

    // Ensure discount does not exceed total amount
    discountAmount = Math.min(discountAmount, totalAmount);

    res.json({
      success: true,
      message: `Promo code '${coupon.code}' applied successfully!`,
      code: coupon.code,
      discountAmount,
      finalPrice: totalAmount - discountAmount
    });
  } catch (error) {
    res.status(500).json({ message: "Error validating coupon", error: error.message });
  }
});

module.exports = router;