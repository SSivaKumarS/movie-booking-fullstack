import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import { QRCodeCanvas } from "qrcode.react";

export default function SnacksHub() {
  const navigate = useNavigate();
  const location = useLocation();

  // User details
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const userId = user?._id || user?.id || localStorage.getItem("userId");

  // Metadata states
  const [theatres, setTheatres] = useState(["IMAX", "PVR", "INOX", "Cinepolis"]);
  const [selectedTheatre, setSelectedTheatre] = useState("IMAX");
  const [moviesByTheatre, setMoviesByTheatre] = useState({});
  const [selectedMovie, setSelectedMovie] = useState("");

  // User's active bookings to attach snacks to
  const [userBookings, setUserBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");

  // Snacks & Cart
  const [snacks, setSnacks] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cart, setCart] = useState([]);

  // Checkout & Order Pass Modal
  const [deliveryType, setDeliveryType] = useState("Express Counter Pickup");
  const [seatNumber, setSeatNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);

  // Default snack icons/categories fallback generator
  const getCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes("popcorn") || n.includes("combo")) return "Popcorn & Combos";
    if (
      n.includes("coke") ||
      n.includes("pepsi") ||
      n.includes("drink") ||
      n.includes("soda") ||
      n.includes("water") ||
      n.includes("juice")
    )
      return "Beverages";
    if (
      n.includes("nacho") ||
      n.includes("burger") ||
      n.includes("fries") ||
      n.includes("hotdog") ||
      n.includes("pizza")
    )
      return "Hot Bites";
    return "Sweets & Extras";
  };

  const getSnackIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("popcorn") || n.includes("combo")) return "🍿";
    if (
      n.includes("coke") ||
      n.includes("pepsi") ||
      n.includes("soda") ||
      n.includes("drink") ||
      n.includes("water") ||
      n.includes("juice")
    )
      return "🥤";
    if (n.includes("nacho") || n.includes("fries")) return "🍟";
    if (n.includes("burger")) return "🍔";
    if (n.includes("hotdog")) return "🌭";
    if (n.includes("pizza")) return "🍕";
    if (n.includes("candy") || n.includes("sweet") || n.includes("ice")) return "🍦";
    return "🍿";
  };

  /* ---------- Fetch Metadata & Snacks ---------- */
  useEffect(() => {
    // 1. Fetch metadata (theatres & movies)
    API.get("/api/snack-orders/meta/theatres-movies")
      .then((res) => {
        if (res.data.theatres && res.data.theatres.length > 0) {
          setTheatres(res.data.theatres);
          setSelectedTheatre(res.data.theatres[0]);
        }
        if (res.data.moviesByTheatre) {
          setMoviesByTheatre(res.data.moviesByTheatre);
        }
      })
      .catch((err) => console.log("Meta load error", err));

    // 2. Fetch User Active Bookings if logged in
    if (userId) {
      API.get(`/api/bookings/user/${userId}`)
        .then((res) => {
          const active = res.data.filter((b) => b.status !== "CANCELLED");
          setUserBookings(active);
        })
        .catch(() => {});
    }
  }, [userId]);

  /* ---------- Load Snacks when Selected Theatre changes ---------- */
  useEffect(() => {
    if (!selectedTheatre) return;

    API.get(`/api/snacks/theatre/${selectedTheatre}`)
      .then((res) => {
        setSnacks(res.data || []);
      })
      .catch(() => {
        // Fallback to fetch all
        API.get("/api/snacks/all")
          .then((res) => {
            const filtered = res.data.filter(
              (s) => s.theatre.toLowerCase() === selectedTheatre.toLowerCase()
            );
            setSnacks(filtered.length > 0 ? filtered : res.data);
          })
          .catch(() => setSnacks([]));
      });
  }, [selectedTheatre]);

  /* ---------- Handle Booking Attachment Selection ---------- */
  const handleBookingSelect = (e) => {
    const bookingId = e.target.value;
    setSelectedBookingId(bookingId);

    if (bookingId) {
      const found = userBookings.find((b) => b._id === bookingId);
      if (found) {
        if (found.showId?.theatre) {
          setSelectedTheatre(found.showId.theatre);
        }
        if (found.showId?.movieId?.title) {
          setSelectedMovie(found.showId.movieId.title);
        }
        if (found.seats && found.seats.length > 0) {
          setSeatNumber(found.seats.join(", "));
          setDeliveryType("In-Seat Delivery");
        }
      }
    }
  };

  /* ---------- Cart Operations ---------- */
  const addToCart = (snack) => {
    setCart((prev) => {
      const exist = prev.find((item) => item._id === snack._id);
      if (exist) {
        return prev.map((item) =>
          item._id === snack._id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...snack, qty: 1 }];
    });
  };

  const removeFromCart = (snackId) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item._id === snackId ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const getItemQty = (snackId) => {
    const found = cart.find((item) => item._id === snackId);
    return found ? found.qty : 0;
  };

  const totalCartPrice = cart.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  /* ---------- Place Order ---------- */
  const handleCheckout = async () => {
    if (!userId) {
      alert("Please sign in to place a food & beverage order!");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty. Add some delicious snacks first!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId,
        theatre: selectedTheatre,
        movieTitle: selectedMovie || "General Theater Order",
        bookingId: selectedBookingId || null,
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
        totalPrice: totalCartPrice,
        deliveryType,
        seatNumber: deliveryType === "In-Seat Delivery" ? seatNumber : "",
      };

      const res = await API.post("/api/snack-orders", payload);

      if (res.data.success) {
        setCompletedOrder(res.data.order);
        setShowPassModal(true);
        setCart([]);
      }
    } catch (err) {
      console.error("Snack order failed", err);
      alert(err.response?.data?.message || "Failed to place snack order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["All", "Popcorn & Combos", "Beverages", "Hot Bites", "Sweets & Extras"];

  const filteredSnacks = snacks.filter((snack) => {
    if (categoryFilter === "All") return true;
    return getCategory(snack.name) === categoryFilter;
  });

  return (
    <div className="bg-[#050508] min-h-screen text-slate-100 pb-32 font-sans relative overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-rose-600/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[170px] pointer-events-none rounded-full" />

      {/* Hero Header */}
      <div className="relative border-b border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-rose-950/60 border border-rose-500/30 text-rose-400 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            CinePantry Express F&B
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Gourmet Movie <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400">Snacks & Beverages</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-medium">
            Pre-order artisanal popcorn, chilled beverages, and fresh movie combos. Enjoy fast-track express counter pickup or seamless in-seat delivery!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        
        {/* Interactive Filtering Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. Theater Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>🏬</span> Select Theater
              </label>
              <select
                value={selectedTheatre}
                onChange={(e) => {
                  setSelectedTheatre(e.target.value);
                  setSelectedMovie("");
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-rose-500 transition shadow-inner"
              >
                {theatres.map((t) => (
                  <option key={t} value={t}>
                    {t} Multiplex
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Movie Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>🎬</span> Respective Movie (Optional)
              </label>
              <select
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-rose-500 transition shadow-inner"
              >
                <option value="">-- All Movies at {selectedTheatre} --</option>
                {(moviesByTheatre[selectedTheatre] || []).map((m) => (
                  <option key={m._id} value={m.title}>
                    {m.title} ({m.genre})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Link to Active Ticket Booking */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>🎟️</span> Attach to My Movie Ticket
              </label>
              <select
                value={selectedBookingId}
                onChange={handleBookingSelect}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-rose-500 transition shadow-inner"
              >
                <option value="">-- Independent Order --</option>
                {userBookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.showId?.movieId?.title || "Movie"} @ {b.showId?.theatre} (Seats: {b.seats?.join(",")})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Quick Theatre Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mr-2">Multiplexes:</span>
            {theatres.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedTheatre(t);
                  setSelectedMovie("");
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-200 ${
                  selectedTheatre === t
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/30"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition duration-200 ${
                categoryFilter === cat
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/25 border border-rose-400/30"
                  : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Snacks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSnacks.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
              <span className="text-5xl block mb-3 opacity-60">🍿</span>
              <p className="text-slate-400 font-semibold text-sm">
                No snacks available for <span className="text-white font-bold">{selectedTheatre}</span> in this category.
              </p>
              <p className="text-xs text-slate-500 mt-1">Try selecting a different category or theater above.</p>
            </div>
          ) : (
            filteredSnacks.map((snack) => {
              const qty = getItemQty(snack._id);
              const icon = getSnackIcon(snack.name);

              return (
                <div
                  key={snack._id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 hover:shadow-2xl transition duration-300 flex flex-col justify-between group backdrop-blur-md"
                >
                  <div className="p-6 space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-rose-950/40 to-slate-950 border border-rose-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition duration-300">
                      {icon}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-950/50 px-2.5 py-0.5 rounded-md border border-rose-800/40">
                        {getCategory(snack.name)}
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-2.5 group-hover:text-rose-400 transition-colors">
                        {snack.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">
                        Freshly prepared for <span className="text-slate-300 font-semibold">{snack.theatre || selectedTheatre}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Price</span>
                      <span className="text-lg font-black text-rose-500">₹{snack.price}</span>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-2xl shadow-inner">
                        <button
                          onClick={() => removeFromCart(snack._id)}
                          className="text-slate-400 hover:text-white font-black text-base px-1 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-extrabold text-white min-w-[1.2rem] text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(snack)}
                          className="text-rose-500 hover:text-rose-400 font-black text-base px-1 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(snack)}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition duration-200 shadow-lg shadow-rose-600/20 active:scale-95"
                      >
                        + Add Item
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Floating Cart Drawer & Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl bg-slate-900/95 border border-rose-500/40 rounded-3xl p-4 sm:p-5 backdrop-blur-2xl shadow-2xl z-40 flex flex-col md:flex-row items-center justify-between gap-4 animate-slideUp">
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-rose-950/80 border border-rose-500/40 rounded-2xl flex items-center justify-center text-2xl text-rose-400 shadow-md">
              🍿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-sm sm:text-base">
                  {cart.reduce((sum, item) => sum + item.qty, 0)} Items Selected
                </span>
                <span className="text-[10px] text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/50">
                  {selectedTheatre}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                {cart.map((i) => `${i.name} (x${i.qty})`).join(", ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end">
            
            {/* Delivery Type Toggle */}
            <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-2xl text-xs">
              <button
                onClick={() => setDeliveryType("Express Counter Pickup")}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] ${
                  deliveryType === "Express Counter Pickup"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Express Counter
              </button>
              <button
                onClick={() => setDeliveryType("In-Seat Delivery")}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] ${
                  deliveryType === "In-Seat Delivery"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                In-Seat
              </button>
            </div>

            {deliveryType === "In-Seat Delivery" && (
              <input
                type="text"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                placeholder="Seat No (A5)"
                className="w-24 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500 font-mono"
              />
            )}

            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total</span>
              <span className="text-lg font-black text-rose-500">₹{totalCartPrice}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm px-5 sm:px-6 py-3 rounded-2xl transition duration-200 shadow-lg shadow-rose-600/30 whitespace-nowrap active:scale-95"
            >
              {isSubmitting ? "Processing..." : `Checkout ₹${totalCartPrice}`}
            </button>
          </div>
        </div>
      )}

      {/* Standalone Express Snack Pass Modal */}
      {showPassModal && completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-center relative overflow-hidden">
            
            <button
              onClick={() => setShowPassModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center border border-slate-700 transition-colors"
            >
              ✕
            </button>

            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto shadow-lg shadow-emerald-500/20">
              ✓
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                Order Confirmed
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                F&B Express Snack Pass
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Pass ID: <span className="text-white font-mono font-bold">{completedOrder.orderPassId}</span>
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-xl my-2">
              <QRCodeCanvas
                value={`${window.location.origin}/verify-snack/${completedOrder.orderPassId}`}
                size={140}
              />
            </div>

            {/* Details */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Theater:</span>
                <span className="text-white font-bold">{completedOrder.theatre}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Movie:</span>
                <span className="text-white font-bold">{completedOrder.movieTitle}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery:</span>
                <span className="text-rose-400 font-bold">
                  {completedOrder.deliveryType} {completedOrder.seatNumber ? `(Seat: ${completedOrder.seatNumber})` : ""}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white text-sm">
                <span>Total Paid:</span>
                <span className="text-rose-500">₹{completedOrder.totalPrice}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/my-bookings")}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-3 rounded-2xl transition shadow-lg shadow-rose-600/30"
              >
                View in My Account 
              </button>
              <button
                onClick={() => setShowPassModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-3 rounded-2xl transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}