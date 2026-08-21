import { useState } from "react";
import API from "../api";
import AdminNavbar from "../components/AdminNavbar";

export default function AdminScan() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyTicket = () => {
    if (!bookingId.trim()) return;
    setLoading(true);
    setMessage("");
    
    API.get(`/api/bookings/verify/${bookingId.trim()}`)
      .then((res) => {
        setBooking(res.data?.booking || res.data);
        if (res.data?.message) {
          setMessage(res.data.message);
        }
      })
      .catch(() => {
        setBooking(null);
        setMessage("❌ Invalid Ticket ID or Ticket not found in system database.");
      })
      .finally(() => setLoading(false));
  };

  const markUsed = () => {
    if (!bookingId.trim()) return;
    API.put(`/api/bookings/use/${bookingId.trim()}`)
      .then((res) => {
        setMessage(" " + (res.data?.message || "Ticket marked as redeemed successfully!"));
      })
      .catch((err) => {
        setMessage(" Error: " + (err.response?.data?.message || err.message));
      });
  };

  return (
    <div className="bg-[#07070B] min-h-screen text-white relative selection:bg-red-600 selection:text-white">
      <AdminNavbar />

      <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8 relative z-10">
        
        {/* Header */}
        <div className="bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl text-center space-y-2">
          <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black px-3 py-0.5 rounded-full uppercase inline-block">
             Gate QR & Digital Verification
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Ticket Entry Scanner & Validator
          </h1>
          <p className="text-xs text-gray-400 max-w-lg mx-auto">
            Scan user mobile QR pass or enter booking reference ID to permit cinema hall entry
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#0F0F17]/80 border border-gray-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="Enter or Scan Booking ID (e.g. 64b7f...)"
              className="flex-1 bg-gray-950 border border-gray-800 text-white font-mono text-sm px-5 py-4 rounded-2xl focus:outline-none focus:border-red-500 transition"
            />

            <button
              onClick={verifyTicket}
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-sm px-8 py-4 rounded-2xl transition shadow-xl shadow-red-600/30 whitespace-nowrap disabled:opacity-50"
            >
              {loading ? "Verifying..." : "⚡ Verify Pass"}
            </button>
          </div>

          {message && (
            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 text-center font-bold text-xs text-amber-400 animate-fadeIn">
              {message}
            </div>
          )}

          {/* Ticket Result Display */}
          {booking && (
            <div className="p-6 bg-gray-950/80 border border-emerald-500/40 rounded-3xl space-y-4 animate-modalScaleIn shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    Verified Booking Ticket
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    {booking.showId?.movieId?.title || booking.movieTitle || "Movie Ticket"}
                  </h2>
                </div>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/80 text-[11px] font-black px-3 py-1 rounded-full">
                  VALID PASS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#0F0F17] p-3 rounded-2xl border border-gray-800">
                  <span className="text-gray-500 text-[10px] block">Seats Allocated</span>
                  <span className="font-extrabold text-white">
                    {Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seats || "N/A"}
                  </span>
                </div>

                <div className="bg-[#0F0F17] p-3 rounded-2xl border border-gray-800">
                  <span className="text-gray-500 text-[10px] block">Theater Hall</span>
                  <span className="font-extrabold text-white">
                    {booking.showId?.theatre || booking.theatre || "Main Auditorium"}
                  </span>
                </div>

                <div className="bg-[#0F0F17] p-3 rounded-2xl border border-gray-800 col-span-2 sm:col-span-1">
                  <span className="text-gray-500 text-[10px] block">Total Amount</span>
                  <span className="font-extrabold text-emerald-400">
                    ₹{booking.totalPrice || booking.amount || 0}
                  </span>
                </div>
              </div>

              <button
                onClick={markUsed}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
              >
                <span></span> Mark Pass as Redeemed / Admitted
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
