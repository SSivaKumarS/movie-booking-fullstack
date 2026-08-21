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
    if (n.includes("coke") || n.includes("pepsi") || n.includes("drink") || n.includes("soda") || n.includes("water") || n.includes("juice")) return "Beverages";
    if (n.includes("nacho") || n.includes("burger") || n.includes("fries") || n.includes("hotdog") || n.includes("pizza")) return "Hot Bites";
    return "Sweets & Extras";
  };

  const getSnackIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("popcorn") || n.includes("combo")) return "";
    if (n.includes("coke") || n.includes("pepsi") || n.includes("soda") || n.includes("drink") || n.includes("water") || n.includes("juice")) return "🥤";
    if (n.includes("nacho") || n.includes("fries")) return "";
    if (n.includes("burger") || n.includes("hotdog")) return "";
    if (n.includes("pizza")) return "";
    if (n.includes("candy") || n.includes("sweet") || n.includes("ice")) return "";
    return "";
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
    <div className="bg-[#09090D] min-h-screen text-white pb-24">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-red-950/40 via-gray-950 to-[#09090D] border-b border-gray-800/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
            <span></span> CinePantry Express F&B
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Order Food & Drinks <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">By Theater & Movie</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Pre-order gourmet popcorn, crisp beverages, and fresh movie snacks anytime for express counter pickup or direct in-seat delivery!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Interactive Filtering Toolbar */}
        <div className="bg-gray-900/80 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Theater Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span></span> Select Theater
              </label>
              <select
                value={selectedTheatre}
                onChange={(e) => {
                  setSelectedTheatre(e.target.value);
                  setSelectedMovie("");
                }}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-red-500 transition"
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
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span></span> Respective Movie (Optional)
              </label>
              <select
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-red-500 transition"
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
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span></span> Attach to My Movie Ticket
              </label>
              <select
                value={selectedBookingId}
                onChange={handleBookingSelect}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-red-500 transition"
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
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/80">
            <span className="text-xs text-gray-500 font-bold mr-2">Quick Select:</span>
            {theatres.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedTheatre(t);
                  setSelectedMovie("");
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTheatre === t
                    ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                    : "bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-600/20"
                  : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Snacks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSnacks.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl">
              <span className="text-4xl block mb-3">🍿</span>
              <p className="text-gray-400 font-semibold">
                No snacks available for <span className="text-white font-bold">{selectedTheatre}</span> in this category.
              </p>
              <p className="text-xs text-gray-500 mt-1">Try selecting a different category or theater above.</p>
            </div>
          ) : (
            filteredSnacks.map((snack) => {
              const qty = getItemQty(snack._id);
              const icon = getSnackIcon(snack.name);

              return (
                <div
                  key={snack._id}
                  className="bg-gray-900/90 border border-gray-800 rounded-3xl overflow-hidden shadow-xl hover:border-gray-700 transition flex flex-col justify-between group"
                >
                  <div className="p-6 space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-950/60 to-gray-950 border border-red-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition transform">
                      {icon}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-800/40">
                        {getCategory(snack.name)}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">
                        {snack.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Freshly prepared for <span className="text-gray-300 font-semibold">{snack.theatre || selectedTheatre}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-950/80 border-t border-gray-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block font-semibold">Price</span>
                      <span className="text-lg font-black text-red-500">₹{snack.price}</span>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-2xl">
                        <button
                          onClick={() => removeFromCart(snack._id)}
                          className="text-gray-400 hover:text-white font-black text-base px-1"
                        >
                          -
                        </button>
                        <span className="text-sm font-extrabold text-white min-w-[1rem] text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(snack)}
                          className="text-red-500 hover:text-red-400 font-black text-base px-1"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(snack)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition shadow-lg shadow-red-600/20"
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
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-4xl bg-[#12121A]/95 border border-red-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl z-40 flex flex-col md:flex-row items-center justify-between gap-4 animate-slideUp">
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-red-600/20 border border-red-500/40 rounded-2xl flex items-center justify-center text-2xl text-red-400 shadow-md">
              
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-base">
                  {cart.reduce((sum, item) => sum + item.qty, 0)} Items Selected
                </span>
                <span className="text-xs text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/40">
                  {selectedTheatre}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                {cart.map((i) => `${i.name} (x${i.qty})`).join(", ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            
            {/* Delivery Type Toggle */}
            <div className="flex bg-gray-950 border border-gray-800 p-1 rounded-2xl text-xs">
              <button
                onClick={() => setDeliveryType("Express Counter Pickup")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  deliveryType === "Express Counter Pickup"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Express Counter
              </button>
              <button
                onClick={() => setDeliveryType("In-Seat Delivery")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  deliveryType === "In-Seat Delivery"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
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
                placeholder="Seat No (e.g. A5)"
                className="w-24 bg-gray-950 border border-gray-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              />
            )}

            <div className="text-right">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Total</span>
              <span className="text-xl font-black text-red-500">₹{totalCartPrice}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-sm px-6 py-3 rounded-2xl transition shadow-xl shadow-red-600/30 whitespace-nowrap"
            >
              {isSubmitting ? "Processing..." : "Confirm & Get Snack Pass 🍿"}
            </button>
          </div>
        </div>
      )}

      {/* Standalone Express Snack Pass Modal */}
      {showPassModal && completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#111118] border border-gray-800 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-center relative overflow-hidden">
            
            <button
              onClick={() => setShowPassModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg bg-gray-900 rounded-full w-8 h-8 flex items-center justify-center border border-gray-800"
            >
              ✕
            </button>

            <div className="w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto shadow-lg shadow-green-500/20">
              ✓
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-green-400 bg-green-950/60 px-3 py-1 rounded-full border border-green-800/40">
                Order Confirmed
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                F&B Express Snack Pass
              </h2>
              <p className="text-xs text-gray-400 mt-1">
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
            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-left space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Theater:</span>
                <span className="text-white font-bold">{completedOrder.theatre}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Movie:</span>
                <span className="text-white font-bold">{completedOrder.movieTitle}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery:</span>
                <span className="text-red-400 font-bold">
                  {completedOrder.deliveryType} {completedOrder.seatNumber ? `(Seat: ${completedOrder.seatNumber})` : ""}
                </span>
              </div>
              <div className="border-t border-gray-800 pt-2 flex justify-between font-bold text-white text-sm">
                <span>Total Paid:</span>
                <span className="text-red-500">₹{completedOrder.totalPrice}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/my-bookings")}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-2xl transition shadow-lg shadow-red-600/30"
              >
                View in My Account 
              </button>
              <button
                onClick={() => setShowPassModal(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs px-5 py-3 rounded-2xl transition"
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