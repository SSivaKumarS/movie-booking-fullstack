import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import API from "../api";
import axios from "axios";

const PRESET_COMBOS = [
  {
    id: "combo-1",
    name: " Movie Night Duo",
    items: [
      { name: "Jumbo Butter Popcorn", price: 220, qty: 1 },
      { name: "Cold Beverage (Large)", price: 120, qty: 2 },
    ],
    originalPrice: 460,
    comboPrice: 380,
    savings: 80,
    badge: " Best Seller",
  },
  {
    id: "combo-2",
    name: " VIP Gourmet Feast",
    items: [
      { name: "Extra Large Popcorn", price: 260, qty: 1 },
      { name: "Loaded Cheese Nachos", price: 180, qty: 1 },
      { name: "Cold Beverage (Large)", price: 120, qty: 2 },
    ],
    originalPrice: 680,
    comboPrice: 550,
    savings: 130,
    badge: " 20% OFF",
  },
];

function AddOns() {
  const { showId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const selectedSeats = location.state?.selectedSeats || [];
  const initialShow = location.state?.show;

  const [snacks, setSnacks] = useState([]);
  const [parking, setParking] = useState(null);
  const [selectedSnacks, setSelectedSnacks] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [show, setShow] = useState(initialShow || null);

  // Promo code state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMsg, setCouponMsg] = useState({ text: "", type: "" });
  const [activeCoupons, setActiveCoupons] = useState([]);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const userId = user?._id || user?.id || localStorage.getItem("userId");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  /* Protect Refresh */
  useEffect(() => {
    if (!showId || selectedSeats.length === 0) {
      navigate("/");
    }
  }, [showId, selectedSeats, navigate]);

  /* Fetch Show + AddOns + Coupons */
  useEffect(() => {
    if (!showId) return;

    const loadData = async () => {
      try {
        let currentShow = show;
        if (!currentShow) {
          const res = await API.get(`/api/shows/single/${showId}`);
          currentShow = res.data;
          setShow(currentShow);
        }

        const theatre = currentShow.theatre;

        // Fetch Snacks
        API.get(`/api/snacks/theatre/${theatre}`)
          .then((r) => setSnacks(r.data))
          .catch(() => setSnacks([]));

        // Fetch Parking
        API.get(`/api/parking/theatre/${theatre}`)
          .then((r) => setParking(r.data))
          .catch(() => setParking(null));

        // Fetch available coupons
        axios
          .get(`${API_URL}/api/coupons/active`)
          .then((r) => setActiveCoupons(r.data))
          .catch(() => {});
      } catch (err) {
        console.error("Data load error", err);
      }
    };

    loadData();
  }, [showId]);

  /* Snack Add & Remove */
  const addSnack = (snack) => {
    setSelectedSnacks((prev) => {
      const exist = prev.find((s) => s._id === snack._id || s.name === snack.name);
      if (exist) {
        return prev.map((s) =>
          s._id === snack._id || s.name === snack.name ? { ...s, qty: s.qty + 1 } : s
        );
      }
      return [...prev, { ...snack, qty: 1 }];
    });
  };

  const addComboToCart = (combo) => {
    combo.items.forEach((item) => {
      setSelectedSnacks((prev) => {
        const exist = prev.find((s) => s.name === item.name);
        if (exist) {
          return prev.map((s) => (s.name === item.name ? { ...s, qty: s.qty + item.qty } : s));
        }
        return [...prev, { _id: item.name, name: item.name, price: item.price, qty: item.qty }];
      });
    });
  };

  const removeSnack = (snack) => {
    setSelectedSnacks((prev) =>
      prev
        .map((s) => (s.name === snack.name ? { ...s, qty: s.qty - 1 } : s))
        .filter((s) => s.qty > 0)
    );
  };

  const calculateSubtotal = () => {
    if (!show) return 0;
    const seatTotal = show.seats
      .filter((s) => selectedSeats.includes(s.seatNumber))
      .reduce((acc, s) => acc + s.price, 0);

    const snackTotal = selectedSnacks.reduce(
      (acc, s) => acc + s.price * s.qty,
      0
    );

    const parkingTotal = selectedParking?.price || 0;
    return seatTotal + snackTotal + parkingTotal;
  };

  const subtotal = calculateSubtotal();
  const finalTotal = Math.max(0, subtotal - discountAmount);

  /* Apply Coupon */
  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponCode;
    if (!code.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/api/coupons/validate`, {
        code,
        totalAmount: subtotal,
      });

      if (res.data.success) {
        setAppliedCoupon(res.data.code);
        setDiscountAmount(res.data.discountAmount);
        setCouponMsg({ text: res.data.message, type: "success" });
      }
    } catch (err) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponMsg({
        text: err.response?.data?.message || "Invalid coupon code",
        type: "error",
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    setCouponMsg({ text: "Coupon removed", type: "info" });
    setTimeout(() => setCouponMsg({ text: "", type: "" }), 2000);
  };

  /* Confirm Booking */
  const confirmBooking = async () => {
    try {
      await API.post(`/api/bookings`, {
        showId,
        seats: selectedSeats,
        userId,
        snacks: selectedSnacks,
        parking: selectedParking,
        totalPrice: finalTotal,
      });
      navigate("/my-bookings");
    } catch (err) {
      console.error("Booking failed", err);
      alert("Booking failed");
    }
  };

  const skipBooking = async () => {
    try {
      await API.post(`/api/bookings`, {
        showId,
        seats: selectedSeats,
        userId,
        totalPrice: finalTotal,
      });
      navigate("/my-bookings");
    } catch (err) {
      console.error("Booking failed", err);
      alert("Booking failed");
    }
  };

  if (!show) {
    return <p className="text-white text-center mt-10">Loading...</p>;
  }

  return (
    <div className="bg-[#07070B] min-h-screen text-white p-4 md:p-10 relative">
      <div className="max-w-4xl mx-auto bg-[#0F0F17]/90 border border-gray-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-8">
        
        <div className="border-b border-gray-800/80 pb-4 text-center">
          <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase">
            Step 2 of 2: Extras & Checkout
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
            Customize Refreshments & Parking
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Theater: <span className="text-red-400 font-bold">{show.theatre}</span> &nbsp;•&nbsp; Seats: <span className="text-white font-bold">{selectedSeats.join(", ")}</span>
          </p>
        </div>

        {/*  PRE-PACKAGED COMBOS */}
        <div>
          <h2 className="text-base font-extrabold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
             Recommended Cinema Combos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRESET_COMBOS.map((combo) => (
              <div
                key={combo.id}
                className="bg-gray-950 border border-amber-500/30 p-4 rounded-2xl flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-amber-400 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {combo.badge}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1">{combo.name}</h3>
                    <p className="text-[11px] text-gray-400">
                      {combo.items.map((i) => `${i.name} x${i.qty}`).join(" + ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <div>
                    <span className="text-xs text-gray-500 line-through mr-1">₹{combo.originalPrice}</span>
                    <span className="text-sm font-extrabold text-amber-400">₹{combo.comboPrice}</span>
                  </div>
                  <button
                    onClick={() => addComboToCart(combo)}
                    className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition"
                  >
                    + Add Combo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/*  SINGLE SNACKS */}
        <div>
          <h2 className="text-base font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
             À La Carte Food & Snacks
          </h2>

          {snacks.length === 0 ? (
            <p className="text-gray-500 text-xs italic">No snacks available for this theater.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {snacks.map((snack) => {
                const qty = selectedSnacks.find((s) => s.name === snack.name)?.qty || 0;
                return (
                  <div
                    key={snack._id}
                    className="flex justify-between items-center bg-gray-950 p-3.5 rounded-2xl border border-gray-800"
                  >
                    <div>
                      <span className="font-semibold text-white text-xs block">{snack.name}</span>
                      <span className="text-xs text-red-400 font-bold">₹{snack.price}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-3 py-1 rounded-xl">
                      <button
                        onClick={() => removeSnack(snack)}
                        className="text-gray-400 hover:text-white font-bold text-base"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-white min-w-[1rem] text-center">{qty}</span>
                      <button
                        onClick={() => addSnack(snack)}
                        className="text-red-500 hover:text-red-400 font-bold text-base"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/*  PARKING */}
        {parking && (
          <div>
            <h2 className="text-base font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
               Vehicle Parking Pass
            </h2>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setSelectedParking(
                    selectedParking?.type === "Bike"
                      ? null
                      : { type: "Bike", price: parking.priceBike }
                  )
                }
                className={`flex-1 p-3.5 rounded-2xl border transition text-center font-semibold text-xs ${
                  selectedParking?.type === "Bike"
                    ? "bg-red-950/80 border-red-500 text-red-400 shadow-lg"
                    : "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                 Bike Parking (₹{parking.priceBike})
              </button>

              <button
                onClick={() =>
                  setSelectedParking(
                    selectedParking?.type === "Car"
                      ? null
                      : { type: "Car", price: parking.priceCar }
                  )
                }
                className={`flex-1 p-3.5 rounded-2xl border transition text-center font-semibold text-xs ${
                  selectedParking?.type === "Car"
                    ? "bg-red-950/80 border-red-500 text-red-400 shadow-lg"
                    : "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                 Car Parking (₹{parking.priceCar})
              </button>
            </div>
          </div>
        )}

        {/*  PROMO DISCOUNT */}
        <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-3">
          <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider">
             Apply Promo Code
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. CINE50)"
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-red-500 transition"
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
              <button
                onClick={handleRemoveCoupon}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2.5 rounded-xl text-xs transition"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={() => handleApplyCoupon()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition"
              >
                Apply
              </button>
            )}
          </div>

          {couponMsg.text && (
            <p className={`text-xs font-bold ${couponMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {couponMsg.text}
            </p>
          )}

          {activeCoupons.length > 0 && !appliedCoupon && (
            <div className="pt-1 flex flex-wrap gap-2">
              {activeCoupons.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCouponCode(c.code);
                    handleApplyCoupon(c.code);
                  }}
                  className="text-[11px] bg-red-950/60 border border-red-800/80 text-red-300 px-3 py-1 rounded-xl hover:bg-red-900/60 transition"
                >
                   <span className="font-bold">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/*  SUMMARY & TOTAL */}
        <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Subtotal:</span>
            <span className="font-semibold text-white">₹{subtotal}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400 font-bold">
              <span>Discount ({appliedCoupon}):</span>
              <span>- ₹{discountAmount}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-black text-white border-t border-gray-800 pt-3">
            <span>Total Payable:</span>
            <span className="text-red-500 text-xl font-black">₹{finalTotal}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={confirmBooking}
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold py-4 rounded-2xl transition text-center shadow-xl shadow-red-600/30 text-sm"
          >
            Confirm & Pay (₹{finalTotal})
          </button>
          <button
            onClick={skipBooking}
            className="bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold py-4 px-6 rounded-2xl transition text-center text-xs border border-gray-800"
          >
            Skip Extras & Checkout
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddOns;