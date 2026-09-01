import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";

function VerifyTicket() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(undefined);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      return;
    }

    const verifyTicket = async () => {
      try {
        const res = await API.get(`/api/bookings/verify/${bookingId}`);

        if (!res.data) {
          setBooking(null);
          return;
        }

        setBooking(res.data);

        if (res.data.used) {
          setStatus("USED");
        } else {
          await API.put(`/api/bookings/use/${bookingId}`);
          setStatus("VALID");
        }
      } catch (err) {
        console.log(err);
        setBooking(null);
      }
    };

    verifyTicket();
  }, [bookingId]);

  /* ---------- Loading State ---------- */
  if (booking === undefined)
    return (
      <div className="bg-[#050508] min-h-screen flex flex-col justify-center items-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">
          Verifying Digital Pass...
        </p>
      </div>
    );

  /* ---------- Invalid State ---------- */
  if (!booking)
    return (
      <div className="bg-[#050508] min-h-screen flex justify-center items-center p-4">
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 bg-rose-600/20 border border-rose-500/40 rounded-full flex items-center justify-center text-rose-500 text-3xl mx-auto">
            ✕
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            INVALID TICKET
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            This pass code is unverified or does not exist in the active ticketing database.
          </p>
        </div>
      </div>
    );

  const snacks =
    booking.snacks?.length > 0
      ? booking.snacks.map((s) => `${s.name} (x${s.qty})`).join(", ")
      : "None";

  const parking = booking.parking ? `${booking.parking.type}` : "None";

  const isEntryAllowed = status === "VALID";

  return (
    <div className="bg-[#050508] min-h-screen flex justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 blur-[140px] pointer-events-none rounded-full transition-colors duration-700 ${
          isEntryAllowed ? "bg-emerald-600/20" : "bg-rose-600/20"
        }`}
      />

      <div className="max-w-md w-full relative z-10">
        {/* Pass Header Badge */}
        <div className="text-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-900/80 px-4 py-1 rounded-full border border-slate-800 backdrop-blur-md">
            Official Multiplex Scanner Portal
          </span>
        </div>

        {/* Ticket Card Container */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl relative">
          
          {/* Top Status Banner */}
          <div
            className={`py-3 px-6 text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
              isEntryAllowed
                ? "bg-emerald-500 text-slate-950"
                : "bg-rose-600 text-white"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isEntryAllowed ? "bg-slate-950" : "bg-white"
              } animate-ping`}
            />
            {isEntryAllowed ? "ENTRY PERMITTED" : "ACCESS DENIED / TICKET USED"}
          </div>

          {/* Movie Media Frame */}
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={booking.showId?.movieId?.poster}
              alt="Movie Poster"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            <div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/50">
                  {booking.showId?.movieId?.genre || "Cinema"}
                </span>
                <h1 className="text-2xl font-black text-white mt-1 leading-tight drop-shadow-md">
                  {booking.showId?.movieId?.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Ticket Body Details */}
          <div className="p-6 space-y-5">
            {/* Primary Grid Details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Multiplex
                </span>
                <span className="text-white font-bold text-sm truncate block mt-0.5">
                  {booking.showId?.theatre || "Standard Screen"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Date & Time
                </span>
                <span className="text-white font-bold text-sm block mt-0.5">
                  {booking.showId?.date} • {booking.showId?.time}
                </span>
              </div>
            </div>

            {/* Ticket Tear Notches (Visual Effect) */}
            <div className="relative flex items-center justify-between py-1">
              <div className="w-5 h-5 bg-[#050508] rounded-full -ml-8 border-r border-slate-800" />
              <div className="flex-1 border-b-2 border-dashed border-slate-800 mx-2" />
              <div className="w-5 h-5 bg-[#050508] rounded-full -mr-8 border-l border-slate-800" />
            </div>

            {/* Itemized Info Rows */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 font-semibold">Allocated Seats</span>
                <span className="text-emerald-400 font-mono font-black text-base px-2.5 py-0.5 bg-emerald-950/50 rounded-lg border border-emerald-800/40">
                  {booking.seats?.join(", ")}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-800/60 pt-2.5">
                <span className="text-slate-400 font-semibold">F&B Add-ons</span>
                <span className="text-slate-200 font-medium text-right max-w-[200px] truncate">
                  {snacks}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-800/60 pt-2.5">
                <span className="text-slate-400 font-semibold">Parking Slot</span>
                <span className="text-slate-200 font-medium">{parking}</span>
              </div>
            </div>

            {/* Total Paid & Verification Status */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Total Paid
                </span>
                <span className="text-2xl font-black text-rose-500">
                  ₹{booking.totalPrice}
                </span>
              </div>

              <div>
                {isEntryAllowed ? (
                  <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-4 py-2 rounded-2xl text-center shadow-lg shadow-emerald-950/50">
                    <span className="block text-xs font-black tracking-wide">
                      ENTRY ALLOWED
                    </span>
                    <span className="text-[9px] text-emerald-500 font-medium block">
                      Pass marked as used
                    </span>
                  </div>
                ) : (
                  <div className="bg-rose-950/80 border border-rose-500/40 text-rose-400 px-4 py-2 rounded-2xl text-center shadow-lg shadow-rose-950/50">
                    <span className="block text-xs font-black tracking-wide">
                      ALREADY USED
                    </span>
                    <span className="text-[9px] text-rose-500 font-medium block">
                      Previously checked in
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Verification Timestamp Footer */}
          <div className="bg-slate-950 p-3 text-center border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-500">
              Pass ID: {booking._id || bookingId}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default VerifyTicket;