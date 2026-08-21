import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import API from "../api";
import axios from "axios";
import { Link } from "react-router-dom";

function MyBookings() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [snackOrders, setSnackOrders] = useState([]);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const userId = user?._id || user?.id || localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  /* ---------- Load Bookings, Watchlist & Snack Orders ---------- */
  useEffect(() => {
    if (!userId) return;

    API.get(`/api/bookings/user/${userId}`)
      .then((res) => setBookings(res.data))
      .catch((err) => console.log("Bookings load error:", err));

    API.get(`/api/snack-orders/user/${userId}`)
      .then((res) => setSnackOrders(res.data))
      .catch((err) => console.log("Snack orders load error:", err));

    if (token) {
      axios
        .get(`${API_URL}/api/users/watchlist`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setWatchlist(res.data || []))
        .catch(() => {});
    }
  }, [userId, token]);

  const handleRemoveFromWatchlist = async (movieId) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/users/watchlist/toggle`,
        { movieId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWatchlist(res.data.watchlist || []);
    } catch {
      alert("Failed to update watchlist");
    }
  };

  /* ---------- Download Ticket ---------- */
  const downloadPDF = (id) => {
    const input = document.getElementById(`ticket-${id}`);

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`CineBook_Ticket_${id}.pdf`);
    });
  };

  /* ---------- Ticket Status ---------- */
  const getShowStatus = (booking) => {
    if (!booking.showId?.date || !booking.showId?.time) return "VALID";

    try {
      let [time, modifier] = booking.showId.time.split(" ");
      let [hours, minutes] = time.split(":");
      hours = parseInt(hours);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const showDateTime = new Date(booking.showId.date);
      showDateTime.setHours(hours);
      showDateTime.setMinutes(minutes || 0);

      const now = new Date();
      if (now > showDateTime) return "COMPLETED";
      if (booking.used) return "USED";

      return "VALID";
    } catch {
      return "VALID";
    }
  };

  return (
    <div className="bg-black min-h-screen text-white p-6 md:p-12">
      
      {/* Header & Tabs */}
      <div className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-6 tracking-wide">
          My Account Hub
        </h1>

        <div className="inline-flex bg-gray-900 border border-gray-800 p-1.5 rounded-2xl gap-2">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === "bookings"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
             My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("snacks")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === "snacks"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
             Snack Passes ({snackOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === "watchlist"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
             My Watchlist ({watchlist.length})
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === "bookings" ? (
          /* ---------- BOOKINGS TAB ---------- */
          <>
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-16 border border-dashed border-gray-800 rounded-3xl">
                No active bookings found. Explore movies to book tickets!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {bookings.map((b) => (
                  <div
                    key={b._id}
                    id={`ticket-${b._id}`}
                    className="bg-gradient-to-br from-[#0f172a] to-[#020617] border border-gray-800 p-6 rounded-2xl shadow-2xl space-y-4"
                  >
                    <div className="flex justify-between gap-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-4 items-center mb-3">
                          <img
                            src={b.showId?.movieId?.poster}
                            alt="poster"
                            className="w-16 h-24 rounded-lg object-cover border border-gray-800"
                          />
                          <div>
                            <h2 className="text-lg font-bold text-white">
                              {b.showId?.movieId?.title}
                            </h2>
                            <p className="text-xs text-red-400 font-semibold">
                              {b.showId?.movieId?.genre}
                            </p>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-500 font-mono">
                          ID: {b._id}
                        </p>
                        <p className="text-xs text-gray-300"> Theatre: {b.showId?.theatre}</p>
                        <p className="text-xs text-gray-300"> {b.showId?.date} —  {b.showId?.time}</p>
                        <p className="text-xs text-gray-300">
                           Seats: <span className="text-green-400 font-bold">{b.seats?.join(", ")}</span>
                        </p>
                        <p className="text-xs text-gray-300">
                           Snacks: {b.snacks?.length > 0 ? b.snacks.map((s) => `${s.name} x${s.qty}`).join(", ") : " None"}
                        </p>
                        <p className="text-xs text-gray-300">
                           Parking: {b.parking ? `${b.parking.type}` : " None"}
                        </p>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                          <p className="text-red-500 font-extrabold text-lg">
                            ₹ {b.totalPrice}
                          </p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              getShowStatus(b) === "COMPLETED"
                                ? "bg-gray-500/20 text-gray-400"
                                : getShowStatus(b) === "USED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {getShowStatus(b)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-between">
                        <div className="bg-white p-2.5 rounded-xl shadow-lg">
                          <QRCodeCanvas
                            value={`${window.location.origin}/verify/${b._id}`}
                            size={100}
                          />
                        </div>

                        <button
                          onClick={() => downloadPDF(b._id)}
                          className="mt-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                        >
                          Download Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === "snacks" ? (
          /* ---------- SNACK ORDERS TAB ---------- */
          <>
            {snackOrders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-3xl space-y-3">
                <p className="text-gray-400 font-semibold">
                  No food & beverage orders placed yet.
                </p>
                <Link
                  to="/snacks"
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-2xl transition shadow-lg shadow-red-600/30"
                >
                  Browse CinePantry & Order Food 
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {snackOrders.map((so) => (
                  <div
                    key={so._id}
                    id={`snack-pass-${so._id}`}
                    className="bg-gradient-to-br from-[#180e1a] to-[#090a14] border border-gray-800 p-6 rounded-2xl shadow-2xl space-y-4"
                  >
                    <div className="flex justify-between gap-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-red-950/80 border border-red-800/80 text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                             F&B Express Pass
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {so.orderPassId}
                          </span>
                        </div>

                        <h2 className="text-lg font-bold text-white">
                          {so.theatre} Multiplex
                        </h2>
                        <p className="text-xs text-red-400 font-semibold">
                           {so.movieTitle || "General Theater Order"}
                        </p>

                        <p className="text-xs text-gray-300">
                           Delivery: <span className="text-white font-semibold">{so.deliveryType}</span> {so.seatNumber ? `(Seat: ${so.seatNumber})` : ""}
                        </p>

                        <div className="text-xs text-gray-300">
                          <span className="font-bold text-gray-400">Items Ordered:</span>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-200">
                            {so.items?.map((item, idx) => (
                              <li key={idx}>
                                {item.name} x{item.qty} (₹{item.price * item.qty})
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                          <p className="text-red-500 font-extrabold text-lg">
                            ₹ {so.totalPrice}
                          </p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              so.status === "COMPLETED"
                                ? "bg-gray-500/20 text-gray-400"
                                : so.status === "READY_FOR_PICKUP"
                                ? "bg-green-500/20 text-green-400 animate-pulse"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {so.status || "CONFIRMED"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-between">
                        <div className="bg-white p-2.5 rounded-xl shadow-lg">
                          <QRCodeCanvas
                            value={`${window.location.origin}/verify-snack/${so.orderPassId}`}
                            size={100}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono mt-2">
                          Counter QR Pass
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ---------- WATCHLIST TAB ---------- */
          <>
            {watchlist.length === 0 ? (
              <p className="text-gray-500 text-center py-16 border border-dashed border-gray-800 rounded-3xl">
                Your watchlist is empty. Bookmark your favorite movies to see them here!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {watchlist.map((m) => (
                  <div
                    key={m._id}
                    className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                  >
                    <img
                      src={m.poster}
                      alt={m.title}
                      className="h-64 w-full object-cover"
                    />

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {m.title}
                        </h3>
                        <p className="text-xs text-red-400 font-semibold mt-1">
                          {m.genre} • {m.duration}m
                        </p>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                          {m.description}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link
                          to={`/movie/${m._id}`}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 text-center rounded-lg transition"
                        >
                          View & Book
                        </Link>
                        <button
                          onClick={() => handleRemoveFromWatchlist(m._id)}
                          className="px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs"
                          title="Remove from Watchlist"
                        >
                          
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MyBookings;