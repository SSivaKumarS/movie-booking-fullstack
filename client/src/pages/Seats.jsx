import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";

export default function Seats() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [hoveredSeat, setHoveredSeat] = useState(null);

  useEffect(() => {
    const fetchShow = async () => {
      try {
        const { data } = await API.get(`/api/shows/single/${showId}`);
        setShow(data);
      } catch {
        setError("Failed to load seat data. Please go back and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchShow();
  }, [showId]);

  const toggleSeat = (seat) => {
    if (seat.isBooked) return;
    setSelectedSeats((prev) =>
      prev.includes(seat.seatNumber)
        ? prev.filter((s) => s !== seat.seatNumber)
        : [...prev, seat.seatNumber]
    );
  };

  /* Quick auto-select contiguous available seats */
  const autoSelectSeats = (count) => {
    if (!show) return;
    const available = show.seats.filter((s) => !s.isBooked).map((s) => s.seatNumber);
    if (available.length >= count) {
      setSelectedSeats(available.slice(0, count));
    }
  };

  const calculateTotal = () => {
    if (!show) return 0;
    return show.seats
      .filter((s) => selectedSeats.includes(s.seatNumber))
      .reduce((acc, s) => acc + s.price, 0);
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;
    navigate(`/addons/${showId}`, {
      state: { selectedSeats, totalPrice: calculateTotal(), show },
    });
  };

  // Group seats by Category, and then by Row
  const getGroupedLayout = () => {
    if (!show || !show.seats) return [];
    
    // Maintain category order: Balcony, First Class, Second Class (or as defined)
    const categoryMap = {};
    show.seats.forEach((seat) => {
      const cat = seat.category || "Standard";
      if (!categoryMap[cat]) categoryMap[cat] = {};
      
      // Extract Row letter (e.g. "A" from "A1") or default
      const rowMatch = seat.seatNumber.match(/^[A-Za-z]+/);
      const row = rowMatch ? rowMatch[0].toUpperCase() : "R";
      
      if (!categoryMap[cat][row]) categoryMap[cat][row] = [];
      categoryMap[cat][row].push(seat);
    });

    return categoryMap;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080C] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-red-600/50" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Loading Cinema Seating Floorplan...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#08080C] text-white flex items-center justify-center p-4">
        <div className="bg-red-950/60 border border-red-800 text-red-300 rounded-3xl p-8 text-center max-w-md shadow-2xl space-y-4">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-2xl transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const categoryMap = getGroupedLayout();

  return (
    <div className="min-h-screen bg-[#08080E] text-white pb-36 font-sans relative overflow-x-hidden selection:bg-red-600 selection:text-white">
      
      {/* Glow Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/*  HEADER BAR */}
      <div className="bg-[#0D0D14]/90 backdrop-blur-2xl border-b border-gray-800/80 sticky top-0 z-40 py-4 px-4 sm:px-8 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl flex items-center justify-center text-gray-300 hover:text-white transition"
              title="Go Back"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{show?.theatre}</span>
                <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  AUDI 1
                </span>
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                 {show?.date} &nbsp;•&nbsp;  {show?.time}
              </p>
            </div>
          </div>

          {/* Quick Seat Selection Chips & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert(" Group Booking Link copied! Send it to your friends so they can pick adjacent seats.");
              }}
              className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
              title="Share Booking Link with Friends"
            >
              <span></span> Share Seats Link
            </button>

            <button
              onClick={() => {
                const query = encodeURIComponent(`${show?.theatre || "PVR Cinema"}`);
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
              }}
              className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
              title="Get GPS Directions"
            >
              <span></span> GPS Directions
            </button>

            <span className="text-[11px] font-bold text-gray-400 uppercase hidden sm:inline ml-2">Quick Select:</span>
            {[1, 2, 3, 4, 6].map((count) => (
              <button
                key={count}
                onClick={() => autoSelectSeats(count)}
                className="bg-gray-900/90 hover:bg-red-950/80 border border-gray-800 hover:border-red-800 text-gray-300 hover:text-red-400 font-bold text-xs px-3 py-1.5 rounded-xl transition"
              >
                {count} {count === 1 ? "Seat" : "Seats"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/*  IMAX CURVED SCREEN CANVAS */}
      <div className="max-w-4xl mx-auto mt-8 mb-10 px-4">
        <div className="relative text-center">
          {/* Light Glow Projection Rays */}
          <div className="w-full h-16 bg-gradient-to-b from-red-600/20 via-red-600/5 to-transparent rounded-t-[100%] blur-sm pointer-events-none" />

          {/* Curved Screen Curve Line */}
          <div className="relative -mt-8 h-3.5 bg-gradient-to-r from-gray-600 via-white to-gray-600 rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.45)] border border-white/30 transform -perspective-500 rotate-x-12" />

          <p className="text-[10px] text-gray-400 font-black tracking-[0.4em] uppercase mt-3">
             SCREEN THIS WAY ✨
          </p>
        </div>
      </div>

      {/*  UNIFIED THEATER AUDITORIUM CONTAINER */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#0E0E16]/80 border border-gray-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl space-y-10">
          
          {Object.entries(categoryMap).map(([category, rows]) => {
            const firstSeatPrice = Object.values(rows)[0]?.[0]?.price || 250;

            return (
              <div key={category} className="space-y-4">
                
                {/* Category Divider Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-500/50" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-200">
                      {category}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      — ₹{firstSeatPrice}
                    </span>
                  </div>
                </div>

                {/* Rows Grid */}
                <div className="space-y-3">
                  {Object.entries(rows).map(([rowLabel, seats]) => {
                    // Split seats into left block and right block for center walkway aisle
                    const half = Math.ceil(seats.length / 2);
                    const leftBlock = seats.slice(0, half);
                    const rightBlock = seats.slice(half);

                    return (
                      <div key={rowLabel} className="flex items-center justify-center gap-4 sm:gap-6">
                        
                        {/* Left Row Letter Marker */}
                        <span className="w-5 text-center text-xs font-black text-gray-400 select-none">
                          {rowLabel}
                        </span>

                        {/* Left Seating Block */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {leftBlock.map((seat) => {
                            const isSelected = selectedSeats.includes(seat.seatNumber);
                            
                            let btnStyle = "w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-[11px] font-extrabold transition-all duration-150 flex items-center justify-center select-none ";
                            
                            if (seat.isBooked) {
                              btnStyle += "bg-gray-900 border border-gray-800 text-gray-700 cursor-not-allowed opacity-40";
                            } else if (isSelected) {
                              btnStyle += "bg-gradient-to-r from-red-600 to-pink-600 border border-white text-white shadow-lg shadow-red-600/50 scale-110";
                            } else {
                              btnStyle += "bg-gray-900/90 border border-gray-700/60 text-gray-200 hover:border-red-500 hover:text-white hover:scale-105";
                            }

                            return (
                              <button
                                key={seat.seatNumber}
                                onClick={() => toggleSeat(seat)}
                                onMouseEnter={() => setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                disabled={seat.isBooked}
                                className={btnStyle}
                                title={seat.isBooked ? "Booked" : `${seat.seatNumber} - ₹${seat.price}`}
                              >
                                {seat.seatNumber}
                              </button>
                            );
                          })}
                        </div>

                        {/* Center Walkway Aisle Spacer */}
                        <div className="w-4 sm:w-8 border-t border-dashed border-gray-800/80 my-auto text-[9px] text-gray-600 font-mono text-center hidden sm:block">
                          AISLE
                        </div>

                        {/* Right Seating Block */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {rightBlock.map((seat) => {
                            const isSelected = selectedSeats.includes(seat.seatNumber);
                            
                            let btnStyle = "w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-[11px] font-extrabold transition-all duration-150 flex items-center justify-center select-none ";
                            
                            if (seat.isBooked) {
                              btnStyle += "bg-gray-900 border border-gray-800 text-gray-700 cursor-not-allowed opacity-40";
                            } else if (isSelected) {
                              btnStyle += "bg-gradient-to-r from-red-600 to-pink-600 border border-white text-white shadow-lg shadow-red-600/50 scale-110";
                            } else {
                              btnStyle += "bg-gray-900/90 border border-gray-700/60 text-gray-200 hover:border-red-500 hover:text-white hover:scale-105";
                            }

                            return (
                              <button
                                key={seat.seatNumber}
                                onClick={() => toggleSeat(seat)}
                                onMouseEnter={() => setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                disabled={seat.isBooked}
                                className={btnStyle}
                                title={seat.isBooked ? "Booked" : `${seat.seatNumber} - ₹${seat.price}`}
                              >
                                {seat.seatNumber}
                              </button>
                            );
                          })}
                        </div>

                        {/* Right Row Letter Marker */}
                        <span className="w-5 text-center text-xs font-black text-gray-400 select-none">
                          {rowLabel}
                        </span>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/*  LEGEND & HOVER DETAILS */}
      <div className="max-w-xl mx-auto px-4 mt-8 space-y-4">
        {hoveredSeat && (
          <div className="bg-red-950/50 border border-red-800/80 rounded-2xl p-3 text-center text-xs text-white animate-fadeIn">
            <span className="font-bold text-red-400">Seat {hoveredSeat.seatNumber}</span> ({hoveredSeat.category}) — <span className="font-extrabold text-white">₹{hoveredSeat.price}</span> {hoveredSeat.isBooked ? "• ❌ Booked" : "• ✅ Available"}
          </div>
        )}

        <div className="flex items-center justify-around bg-[#0D0D14]/90 border border-gray-800/80 rounded-2xl p-4 text-xs text-gray-400 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-gray-900 border border-gray-700" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 border border-white" />
            <span>Selected ({selectedSeats.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-gray-900 border border-gray-800 opacity-40" />
            <span>Booked</span>
          </div>
        </div>
      </div>

      {/*  STICKY BOTTOM CHECKOUT DRAWER */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A10]/95 border-t border-gray-800/90 p-4 sm:p-5 backdrop-blur-2xl z-40 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600/15 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 font-black text-2xl">
              
            </div>
            <div>
              <p className="text-xs text-gray-400">
                Selected Seats ({selectedSeats.length}):{" "}
                <span className="text-white font-bold">
                  {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                </span>
              </p>
              <p className="text-xl font-black text-white">
                Total: <span className="text-red-500 text-2xl font-black">₹{calculateTotal()}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleProceed}
            disabled={selectedSeats.length === 0}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-40 text-white font-extrabold px-9 py-4 rounded-2xl transition shadow-xl shadow-red-600/30 text-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {selectedSeats.length === 0
              ? "Select Seats to Proceed"
              : `Proceed to F&B Addons (₹${calculateTotal()}) →`}
          </button>
        </div>
      </div>

    </div>
  );
}
