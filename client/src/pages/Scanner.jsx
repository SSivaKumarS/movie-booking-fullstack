import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API from "../api";

function Scanner() {
  const [inputTicketId, setInputTicketId] = useState("");
  const [scannedTicket, setScannedTicket] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  /* Verify & Process Ticket */
  const verifyTicketId = async (idToVerify) => {
    const id = idToVerify || inputTicketId;
    if (!id.trim()) return;

    setLoading(true);
    setStatusMessage({ text: "", type: "" });
    setScannedTicket(null);

    try {
      const res = await API.get(`/api/bookings/${id}`);
      const ticket = res.data;
      setScannedTicket(ticket);

      if (ticket.used) {
        setStatusMessage({
          text: " TICKET ALREADY USED & ADMITTED",
          type: "used",
        });
      } else {
        // Mark as used
        await API.put(`/api/bookings/use/${id}`);
        setStatusMessage({
          text: " TICKET VERIFIED & ENTRY ALLOWED!",
          type: "success",
        });
      }
    } catch {
      setStatusMessage({
        text: " INVALID TICKET OR BOOKING ID NOT FOUND",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* Start Camera Scanner */
  useEffect(() => {
    let qrCodeScanner = null;

    if (cameraActive) {
      qrCodeScanner = new Html5Qrcode("reader");
      qrCodeScanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            const id = decodedText.split("/").pop();
            verifyTicketId(id);
          },
          () => {}
        )
        .catch((err) => {
          console.log("Camera access error:", err);
        });
    }

    return () => {
      if (qrCodeScanner) {
        qrCodeScanner.stop().catch(() => {});
      }
    };
  }, [cameraActive]);

  return (
    <div className="bg-[#050508] min-h-screen text-slate-100 p-4 sm:p-6 md:p-12 relative font-sans overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-rose-950/60 border border-rose-500/30 px-3.5 py-1 rounded-full text-rose-400 text-[11px] font-bold tracking-widest uppercase shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Gate Verification Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Theater Entry Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md mx-auto">
            Scan customer QR pass or enter ticket booking ID to verify and allow entrance.
          </p>
        </div>

        {/* Action Toggle Bar */}
        <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-2xl backdrop-blur-xl shadow-xl flex gap-3">
          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2.5 ${
              cameraActive
                ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/30 border border-rose-400/30"
                : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <span>{cameraActive ? "" : ""}</span>
            <span>{cameraActive ? "Stop Camera" : "Launch Camera Scanner"}</span>
          </button>
        </div>

        {/* Camera Feed Container */}
        {cameraActive && (
          <div className="bg-slate-900/90 border border-rose-500/40 p-5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl text-center space-y-3 transition-all">
            <div
              id="reader"
              className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-inner"
            />
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Point device camera directly at the ticket QR code
            </p>
          </div>
        )}

        {/* Manual Ticket ID Lookup */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 sm:p-6 rounded-3xl space-y-4 backdrop-blur-xl shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span></span> Manual Ticket ID Lookup
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Paste Ticket ID (e.g. 64b7f...)"
              value={inputTicketId}
              onChange={(e) => setInputTicketId(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-3.5 text-xs sm:text-sm focus:outline-none focus:border-rose-500 font-mono transition-colors shadow-inner placeholder:text-slate-600"
            />
            <button
              onClick={() => verifyTicketId()}
              disabled={loading || !inputTicketId.trim()}
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-rose-600/25 whitespace-nowrap active:scale-95"
            >
              {loading ? "Checking..." : "Verify Entry"}
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {statusMessage.text && (
          <div
            className={`p-5 rounded-2xl border text-center font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl backdrop-blur-md transition-all duration-300 ${
              statusMessage.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/80 text-emerald-300 shadow-emerald-950/50"
                : statusMessage.type === "used"
                ? "bg-amber-950/70 border-amber-500/80 text-amber-300 shadow-amber-950/50"
                : "bg-rose-950/70 border-rose-500/80 text-rose-300 shadow-rose-950/50"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Scanned Ticket Details Card */}
        {scannedTicket && (
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800/80 gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Verified Ticket Pass
              </span>
              <span className="text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2.5 py-1 rounded-lg">
                ID: {scannedTicket._id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                  Movie Title
                </span>
                <span className="font-extrabold text-white text-sm block">
                  {scannedTicket.showId?.movieId?.title || "Cinema Movie"}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                  Theater / Hall
                </span>
                <span className="font-extrabold text-white text-sm block">
                  {scannedTicket.showId?.theatre || "Standard Screen"}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                  Date & Time
                </span>
                <span className="font-bold text-slate-200 block">
                  {scannedTicket.showId?.date} • {scannedTicket.showId?.time}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                  Admitted Seats
                </span>
                <span className="font-extrabold text-emerald-400 text-sm block">
                  {scannedTicket.seats?.join(", ") || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scanner;