import { useState, useEffect } from "react";
import API from "../../api";
import AdminNavbar from "../../components/AdminNavbar";

export default function AdminIoTConsole() {
  // Gate Turnstile State
  const [selectedGate, setSelectedGate] = useState("Gate 01 - Audi 1");
  const [ticketInput, setTicketInput] = useState("");
  const [gateStatus, setGateStatus] = useState({
    state: "IDLE", // IDLE, ALLOWED, DENIED
    message: "Awaiting QR Scan / NFC Badge signal...",
    booking: null,
  });

  // ANPR Parking Barrier State
  const [plateInput, setPlateInput] = useState("");
  const [parkingBarrier, setParkingBarrier] = useState({
    state: "IDLE",
    message: "Awaiting vehicle optical sensor trigger...",
  });

  // Smart HVAC & Lighting State
  const [lightingLevel, setLightingLevel] = useState(85);
  const [acTemp, setAcTemp] = useState(21);
  const [automationMode, setAutomationMode] = useState(true);

  // Seat Sensor Grid Telemetry Simulation
  const [seatSensors, setSeatSensors] = useState([
    { id: "A1", status: "occupied", booked: true },
    { id: "A2", status: "occupied", booked: true },
    { id: "A3", status: "empty", booked: false },
    { id: "A4", status: "empty", booked: false },
    { id: "B1", status: "occupied", booked: true },
    { id: "B2", status: "alert", booked: false }, // Unbooked seat occupied!
    { id: "B3", status: "empty", booked: false },
    { id: "B4", status: "occupied", booked: true },
  ]);

  // Turnstile Gate Trigger Simulation
  const handleSimulateScan = async (e) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    setGateStatus({
      state: "PROCESSING",
      message: "Validating IoT Sensor Token with MongoDB Database...",
      booking: null,
    });

    try {
      const res = await API.get(`/api/bookings/verify/${ticketInput.trim()}`);
      if (res.data && res.data.status === "VALID") {
        setGateStatus({
          state: "ALLOWED",
          message: "SERVO BARRIER UNLOCKED: Entry Permitted",
          booking: res.data.booking,
        });
      } else {
        setGateStatus({
          state: "DENIED",
          message: "BARRIER LOCKED: Ticket already scanned or invalid",
          booking: res.data?.booking || null,
        });
      }
    } catch {
      setGateStatus({
        state: "DENIED",
        message: "SIGNAL FAILURE: Booking ID not found in system database",
        booking: null,
      });
    }
  };

  // ANPR License Plate Barrier Trigger Simulation
  const handleSimulateParking = (e) => {
    e.preventDefault();
    if (!plateInput.trim()) return;

    setParkingBarrier({
      state: "PROCESSING",
      message: "ANPR Camera Analyzing License Plate...",
    });

    setTimeout(() => {
      if (plateInput.toUpperCase().includes("MH") || plateInput.length > 5) {
        setParkingBarrier({
          state: "ALLOWED",
          message: `LICENSE PLATE [${plateInput.toUpperCase()}] CONFIRMED — BARRIER LIFTED`,
        });
      } else {
        setParkingBarrier({
          state: "DENIED",
          message: `NO ACTIVE PARKING PASS FOUND FOR VEHICLE [${plateInput.toUpperCase()}]`,
        });
      }
    }, 1000);
  };

  // Random Sensor Pulse Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSeatSensors((prev) =>
        prev.map((s) => {
          if (s.id === "A3" && Math.random() > 0.6) {
            return {
              ...s,
              status: s.status === "empty" ? "occupied" : "empty",
              booked: true,
            };
          }
          return s;
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#06060A] min-h-screen text-white relative selection:bg-cyan-500 selection:text-black font-sans">
      <AdminNavbar />

      <div className="p-4 md:p-10 relative">
        {/* Ambient Glow Backdrop */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Main Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  IoT Hardware Mesh Network
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  MQTT Telemetry Broker Active
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Smart Cinema IoT Command Module
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Hardware relay control, automatic turnstiles, ANPR parking
                barriers & seat sensor telemetry
              </p>
            </div>
          </div>

          {/* TOP ROW: GATE SCANNER & ANPR PARKING BARRIER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MODULE 1: AUTOMATED TURNSTILE GATE */}
            <div className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-800/80">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                      />
                    </svg>
                    Automated Gate Turnstile Relay
                  </h2>
                  <select
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value)}
                    className="bg-gray-950 border border-gray-800 text-xs text-cyan-400 font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option>Gate 01 - Audi 1</option>
                    <option>Gate 02 - Audi 2 (IMAX)</option>
                    <option>Gate 03 - VIP Lounge</option>
                  </select>
                </div>

                {/* Hardware Status Display */}
                <div
                  className={`mt-5 p-5 rounded-2xl border transition-all duration-300 space-y-3 ${
                    gateStatus.state === "ALLOWED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10"
                      : gateStatus.state === "DENIED"
                      ? "bg-red-950/40 border-red-500/50 text-red-300 shadow-lg shadow-red-500/10"
                      : "bg-gray-950/70 border-gray-800/80 text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      Turnstile Relay State
                    </span>
                    <span className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          gateStatus.state === "ALLOWED"
                            ? "bg-emerald-400 animate-pulse"
                            : gateStatus.state === "DENIED"
                            ? "bg-red-500"
                            : "bg-gray-600"
                        }`}
                      />
                      {gateStatus.state}
                    </span>
                  </div>
                  <p className="text-xs font-medium font-mono tracking-wide">
                    {gateStatus.message}
                  </p>

                  {gateStatus.booking && (
                    <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-gray-500">Movie:</span>{" "}
                        {gateStatus.booking.movieTitle}
                      </div>
                      <div>
                        <span className="text-gray-500">Seats:</span>{" "}
                        {gateStatus.booking.seats?.join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulation Trigger Form */}
              <form onSubmit={handleSimulateScan} className="space-y-3 pt-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Simulate QR Code Scan / NFC Signal
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Booking ID (e.g. CINE-891234)"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs px-5 py-3 rounded-2xl transition shadow-lg shadow-cyan-500/20 whitespace-nowrap active:scale-[0.98]"
                  >
                    Trigger Sensor
                  </button>
                </div>
              </form>
            </div>

            {/* MODULE 2: ANPR PARKING BARRIER */}
            <div className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-800/80">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    ANPR Optical License Plate Barrier
                  </h2>
                  <span className="text-[10px] font-mono bg-blue-950/80 border border-blue-800/80 text-blue-400 px-3 py-1 rounded-full font-bold">
                    Entry Gate 01
                  </span>
                </div>

                {/* Barrier Output */}
                <div
                  className={`mt-5 p-5 rounded-2xl border transition-all duration-300 space-y-3 ${
                    parkingBarrier.state === "ALLOWED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10"
                      : parkingBarrier.state === "DENIED"
                      ? "bg-red-950/40 border-red-500/50 text-red-300 shadow-lg shadow-red-500/10"
                      : "bg-gray-950/70 border-gray-800/80 text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      Optical Barrier Motor State
                    </span>
                    <span className="text-xs font-mono font-bold">
                      {parkingBarrier.state}
                    </span>
                  </div>
                  <p className="text-xs font-medium font-mono tracking-wide">
                    {parkingBarrier.message}
                  </p>
                </div>
              </div>

              {/* Simulation Form */}
              <form onSubmit={handleSimulateParking} className="space-y-3 pt-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Simulate Camera License Plate Capture
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Car Plate (e.g. MH-02-CB-1234)"
                    value={plateInput}
                    onChange={(e) => setPlateInput(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition shadow-lg shadow-blue-600/20 whitespace-nowrap active:scale-[0.98]"
                  >
                    Read Plate
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* BOTTOM ROW: UNDER-SEAT PRESSURE SENSOR GRID & HVAC CONTROLS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MODULE 3: REAL-TIME SEAT PRESSURE SENSOR GRID */}
            <div className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-800/80">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Under-Seat Pressure Sensor Telemetry
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live 4s Polling
                </span>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                FSR402 Pressure sensors beneath seat cushions measure occupant
                weight in real-time.
              </p>

              <div className="grid grid-cols-4 gap-3">
                {seatSensors.map((s) => {
                  let statusBg = "bg-gray-950/80 border-gray-800 text-gray-500";
                  if (s.status === "occupied" && s.booked) {
                    statusBg =
                      "bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/10";
                  } else if (s.status === "alert") {
                    statusBg =
                      "bg-red-950/80 border-red-500/60 text-red-300 animate-pulse shadow-sm shadow-red-500/20";
                  }

                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-2xl border text-center space-y-1 transition-all ${statusBg}`}
                    >
                      <span className="font-mono font-black text-sm block">
                        {s.id}
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider block">
                        {s.status === "alert" ? "UNBOOKED" : s.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-around text-[10px] text-gray-400 pt-4 border-t border-gray-800/80 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Legitimate Buyer</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Unbooked Occupation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-700" />
                  <span>Empty Seat</span>
                </div>
              </div>
            </div>

            {/* MODULE 4: SMART HVAC & AMBIENT LIGHTING CONTROLLER */}
            <div className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-800/80">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Smart Screen Lighting & HVAC Automation
                </h2>
                <button
                  onClick={() => setAutomationMode(!automationMode)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors ${
                    automationMode
                      ? "bg-amber-950/80 border-amber-500/60 text-amber-300"
                      : "bg-gray-900 border-gray-800 text-gray-500"
                  }`}
                >
                  {automationMode
                    ? "Auto-Showtime Sync ON"
                    : "Manual Control"}
                </button>
              </div>

              <div className="space-y-6">
                {/* Lighting Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">
                      Auditorium Ambient Dimmer
                    </span>
                    <span className="text-amber-400 font-mono">
                      {lightingLevel}% Intensity
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={lightingLevel}
                    onChange={(e) => setLightingLevel(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-gray-950 rounded-lg cursor-pointer h-2 border border-gray-800"
                  />
                </div>

                {/* HVAC Temperature Controller */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">
                      Occupancy Thermostat (AC)
                    </span>
                    <span className="text-cyan-400 font-mono">
                      {acTemp}°C Active
                    </span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="28"
                    value={acTemp}
                    onChange={(e) => setAcTemp(Number(e.target.value))}
                    className="w-full accent-cyan-500 bg-gray-950 rounded-lg cursor-pointer h-2 border border-gray-800"
                  />
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setLightingLevel(15);
                      setAcTemp(20);
                    }}
                    className="bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 font-bold text-xs py-3 rounded-2xl transition active:scale-[0.98]"
                  >
                    Trigger Showtime Dim (15%)
                  </button>

                  <button
                    onClick={() => {
                      setLightingLevel(100);
                      setAcTemp(23);
                    }}
                    className="bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 font-bold text-xs py-3 rounded-2xl transition active:scale-[0.98]"
                  >
                    Trigger Intermission Full (100%)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}