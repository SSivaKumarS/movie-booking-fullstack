import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import API from "../api";
import axios from "axios";

const PRESET_COMBOS = [
  {
    id: "combo-1",
    name: "Movie Night Duo",
    items: [
      { name: "Jumbo Butter Popcorn", price: 220, qty: 1 },
      { name: "Cold Beverage (Large)", price: 120, qty: 2 },
    ],
    originalPrice: 460,
    comboPrice: 380,
    savings: 80,
    badge: "Best Seller",
  },
  {
    id: "combo-2",
    name: "VIP Gourmet Feast",
    items: [
      { name: "Extra Large Popcorn", price: 260, qty: 1 },
      { name: "Loaded Cheese Nachos", price: 180, qty: 1 },
      { name: "Cold Beverage (Large)", price: 120, qty: 2 },
    ],
    originalPrice: 680,
    comboPrice: 550,
    savings: 130,
    badge: "20% OFF",
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
    return (
      <div className="min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="animate-pulse text-red-500 font-semibold tracking-wide">
          Loading booking details...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#090A0F] min-h-screen text-slate-100 p-4 md:p-8 selection:bg-red-500 selection:text-white">
      <div className="max-w-4xl mx-auto bg-[#12141D]/80 border border-slate-800/80 p-6 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />
        
        {/* HEADER */}
        <div className="border-b border-slate-800/80 pb-6 text-center space-y-2">
          <span className="inline-block bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold tracking-widest px-3.5 py-1 rounded-full uppercase">
            Step 2 of 2: Extras & Checkout
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Customize Refreshments & Extras
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Theater: <span className="text-red-400 font-medium">{show.theatre}</span> &nbsp;•&nbsp; Seats: <span className="text-slate-200 font-medium">{selectedSeats.join(", ")}</span>
          </p>
        </div>

        {/* PRE-PACKAGED COMBOS */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            🍿 Recommended Cinema Combos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRESET_COMBOS.map((combo) => (
              <div
                key={combo.id}
                className="bg-[#181B26] border border-amber-500/20 hover:border-amber-400/50 p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-amber-500/5"
              >
                <div className="space-y-1.5">
                  <span className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {combo.badge}
                  </span>
                  <h3 className="font-bold text-white text-base">{combo.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {combo.items.map((i) => `${i.name} ×${i.qty}`).join(" + ")}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-amber-400">₹{combo.comboPrice}</span>
                    <span className="text-xs text-slate-500 line-through">₹{combo.originalPrice}</span>
                  </div>
                  <button
                    onClick={() => addComboToCart(combo)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-colors duration-200 active:scale-95"
                  >
                    + Add Combo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SINGLE SNACKS */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            🥤 À La Carte Food & Snacks
          </h2>

          {snacks.length === 0 ? (
            <p className="text-slate-500 text-xs italic bg-[#181B26] p-4 rounded-xl text-center border border-slate-800/50">
              No snacks available for this theater.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {snacks.map((snack) => {
                const qty = selectedSnacks.find((s) => s.name === snack.name)?.qty || 0;
                return (
                  <div
                    key={snack._id}
                    className="flex justify-between items-center bg-[#181B26] p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-slate-200 text-sm block">{snack.name}</span>
                      <span className="text-xs text-red-400 font-bold">₹{snack.price}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-[#12141D] border border-slate-800 px-3 py-1.5 rounded-xl">
                      <button
                        onClick={() => removeSnack(snack)}
                        className="text-slate-400 hover:text-white font-bold text-sm w-5 h-5 flex items-center justify-center transition-colors active:scale-90"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-white min-w-[1.2rem] text-center">{qty}</span>
                      <button
                        onClick={() => addSnack(snack)}
                        className="text-red-500 hover:text-red-400 font-bold text-sm w-5 h-5 flex items-center justify-center transition-colors active:scale-90"
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

        {/* PARKING */}
        {parking && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              🚗 Vehicle Parking Pass
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setSelectedParking(
                    selectedParking?.type === "Bike"
                      ? null
                      : { type: "Bike", price: parking.priceBike }
                  )
                }
                className={`p-4 rounded-2xl border transition-all text-center font-semibold text-xs flex flex-col items-center justify-center gap-1 ${
                  selectedParking?.type === "Bike"
                    ? "bg-gradient-to-br from-red-950/60 to-red-900/30 border-red-500/80 text-red-300 ring-2 ring-red-500/20 shadow-lg shadow-red-950/40"
                    : "bg-[#181B26] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                <span>🏍️ Bike Parking</span>
                <span className="font-bold text-slate-200">₹{parking.priceBike}</span>
              </button>

              <button
                onClick={() =>
                  setSelectedParking(
                    selectedParking?.type === "Car"
                      ? null
                      : { type: "Car", price: parking.priceCar }
                  )
                }
                className={`p-4 rounded-2xl border transition-all text-center font-semibold text-xs flex flex-col items-center justify-center gap-1 ${
                  selectedParking?.type === "Car"
                    ? "bg-gradient-to-br from-red-950/60 to-red-900/30 border-red-500/80 text-red-300 ring-2 ring-red-500/20 shadow-lg shadow-red-950/40"
                    : "bg-[#181B26] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                <span>🚗 Car Parking</span>
                <span className="font-bold text-slate-200">₹{parking.priceCar}</span>
              </button>
            </div>
          </div>
        )}

        {/* PROMO DISCOUNT */}
        <div className="bg-[#181B26] p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            🏷️ Apply Promo Code
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. CINE50)"
              className="flex-1 bg-[#12141D] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-red-500/80 transition-colors disabled:opacity-50"
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
              <button
                onClick={handleRemoveCoupon}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={() => handleApplyCoupon()}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-red-600/20"
              >
                Apply
              </button>
            )}
          </div>

          {couponMsg.text && (
            <p className={`text-xs font-medium ${couponMsg.type === "success" ? "text-emerald-400" : couponMsg.type === "error" ? "text-red-400" : "text-slate-400"}`}>
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
                  className="text-[11px] bg-red-950/40 border border-red-800/50 text-red-300 px-3 py-1 rounded-xl hover:bg-red-900/50 hover:border-red-700/80 transition-all font-mono"
                >
                  <span className="font-bold">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SUMMARY & TOTAL */}
        <div className="bg-[#181B26] p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-200">₹{subtotal}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400 font-semibold">
              <span>Discount ({appliedCoupon}):</span>
              <span>- ₹{discountAmount}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline text-white border-t border-slate-800/80 pt-3">
            <span className="text-sm font-bold">Total Payable:</span>
            <span className="text-red-400 text-2xl font-black">₹{finalTotal}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={confirmBooking}
            className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-200 text-center shadow-lg shadow-red-600/25 text-sm active:scale-[0.99]"
          >
            Confirm & Pay (₹{finalTotal})
          </button>
          <button
            onClick={skipBooking}
            className="bg-[#181B26] hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 text-center text-xs border border-slate-800"
          >
            Skip Extras & Checkout
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddOns;