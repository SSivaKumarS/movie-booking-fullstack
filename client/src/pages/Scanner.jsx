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
      qrCodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          const id = decodedText.split("/").pop();
          verifyTicketId(id);
        },
        () => {}
      ).catch((err) => {
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
    <div className="bg-[#07070B] min-h-screen text-white p-4 md:p-10 relative">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">
             Gate Verification Portal
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            Theater Entry Scanner
          </h1>
          <p className="text-xs text-gray-400">
            Scan customer QR pass or enter ticket booking ID to verify entry
          </p>
        </div>

        {/* Action Toggle Bar */}
        <div className="bg-gray-950 border border-gray-800 p-2 rounded-2xl flex justify-center gap-3">
          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
              cameraActive
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-gray-900 text-gray-300 hover:text-white"
            }`}
          >
            <span></span> {cameraActive ? "Stop Camera" : "Launch Camera Scanner"}
          </button>
        </div>

        {/* Camera Feed */}
        {cameraActive && (
          <div className="bg-gray-950 border border-red-500/30 p-4 rounded-3xl overflow-hidden shadow-2xl text-center space-y-3">
            <div id="reader" className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden" />
            <p className="text-[11px] text-gray-400">Point phone camera at customer ticket QR code</p>
          </div>
        )}

        {/* Manual Ticket ID Lookup */}
        <div className="bg-[#0F0F17]/90 border border-gray-800 p-6 rounded-3xl space-y-4 backdrop-blur-xl shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
            Manual Ticket ID Lookup
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Paste Ticket ID (e.g. 64b7f...)"
              value={inputTicketId}
              onChange={(e) => setInputTicketId(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-red-500 font-mono transition"
            />
            <button
              onClick={() => verifyTicketId()}
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition shadow-lg shadow-red-600/30 whitespace-nowrap"
            >
              {loading ? "Checking..." : "Verify Entry"}
            </button>
          </div>
        </div>

        {/* Verification Status Alert Badge */}
        {statusMessage.text && (
          <div
            className={`p-5 rounded-2xl border text-center font-black text-sm uppercase tracking-wider shadow-2xl animate-fadeIn ${
              statusMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                : statusMessage.type === "used"
                ? "bg-amber-950/80 border-amber-500 text-amber-300"
                : "bg-red-950/80 border-red-500 text-red-300"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Scanned Ticket Details Card */}
        {scannedTicket && (
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <span className="text-xs font-bold text-gray-400">Verified Ticket Details</span>
              <span className="text-xs font-mono text-red-400">ID: {scannedTicket._id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Movie Title</span>
                <span className="font-bold text-white text-sm">{scannedTicket.showId?.movieId?.title || "Cinema Movie"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Theater</span>
                <span className="font-bold text-white text-sm">{scannedTicket.showId?.theatre}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Date & Time</span>
                <span className="font-bold text-white">{scannedTicket.showId?.date} • {scannedTicket.showId?.time}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Admitted Seats</span>
                <span className="font-extrabold text-emerald-400 text-sm">{scannedTicket.seats?.join(", ")}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Scanner;
