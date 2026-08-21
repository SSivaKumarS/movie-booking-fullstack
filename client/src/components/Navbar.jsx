import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import SpotlightSearch from "./SpotlightSearch";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Modal State Controls (All render directly IN FRONT OF SCREEN in center)
  const [menuOpen, setMenuOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // City Search Filter
  const [citySearchQuery, setCitySearchQuery] = useState("");

  const allCities = [
    { name: "Mumbai", state: "Maharashtra", popular: true, icon: "" },
    { name: "Delhi NCR", state: "Delhi", popular: true, icon: "" },
    { name: "Bengaluru", state: "Karnataka", popular: true, icon: "" },
    { name: "Chennai", state: "Tamil Nadu", popular: true, icon: "" },
    { name: "Hyderabad", state: "Telangana", popular: true, icon: "" },
    { name: "Kochi", state: "Kerala", popular: true, icon: "" },
    { name: "Pune", state: "Maharashtra", popular: false, icon: "" },
    { name: "Kolkata", state: "West Bengal", popular: false, icon: "" },
    { name: "Ahmedabad", state: "Gujarat", popular: false, icon: "" },
    { name: "Jaipur", state: "Rajasthan", popular: false, icon: "" },
    { name: "Goa", state: "Goa", popular: false, icon: "" },
    { name: "Chandigarh", state: "Punjab/Haryana", popular: false, icon: "" },
  ];

  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem("selectedCity") || "Mumbai"
  );

  const [watchlistItems, setWatchlistItems] = useState([]);

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token && token !== "null" && token !== "undefined" && !!userId && userId !== "null" && userId !== "undefined";

  const isAdmin =
    isLoggedIn &&
    (role === "admin" ||
     role === "theaterOwner" ||
     sessionStorage.getItem("admin_bypass") === "true");

  // Web Audio Synthesizer for tactile feedback
  const playAudioFeedback = (type = "pop") => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "pop") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "close") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // Audio context fallbacks ignored if muted by browser policy
    }
  };

  const closeAllModals = () => {
    playAudioFeedback("close");
    setCityOpen(false);
    setWatchlistOpen(false);
    setUserMenuOpen(false);
    setMenuOpen(false);
    setSpotlightOpen(false);
  };

  // Global Keybindings (Ctrl+K for Spotlight, Esc to close centered modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        playAudioFeedback("pop");
        setSpotlightOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        closeAllModals();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch Watchlist Items
  useEffect(() => {
    if (token) {
      API.get("/api/users/watchlist")
        .then((res) => setWatchlistItems(res.data || []))
        .catch(() => {});
    }
  }, [token, location.pathname]);

  const handleCitySelect = (cityName) => {
    playAudioFeedback("pop");
    setSelectedCity(cityName);
    localStorage.setItem("selectedCity", cityName);
    setCityOpen(false);
  };

  const handleRemoveFromWatchlist = async (e, movieId) => {
    e.stopPropagation();
    playAudioFeedback("pop");
    try {
      const res = await API.post("/api/users/watchlist/toggle", { movieId });
      setWatchlistItems(res.data.watchlist || []);
    } catch (err) {
      console.error("Remove watchlist error:", err);
    }
  };

  const handleLogout = () => {
    playAudioFeedback("close");
    localStorage.clear();
    sessionStorage.removeItem("admin_bypass");
    setWatchlistItems([]);
    setUserMenuOpen(false);
    setMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const filteredCities = allCities.filter(
    (c) =>
      c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  return (
    <>
      <nav className="bg-[#0B0B0F]/95 backdrop-blur-2xl border-b border-gray-800/80 sticky top-0 z-40 shadow-2xl transition-all w-full max-w-full">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/*  Brand Logo & City Trigger */}
            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
              <Link
                to="/"
                onClick={closeAllModals}
                className="flex items-center gap-2.5 group shrink-0"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-tr from-red-600 via-pink-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-lg sm:text-2xl font-black shadow-lg shadow-red-600/30 group-hover:scale-105 transition transform">
                  
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-lg sm:text-2xl tracking-tight leading-none group-hover:text-red-400 transition">
                    Xaviercinema
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-0.5 hidden xs:block">
                    XavierCinema Booking
                  </span>
                </div>
              </Link>

              {/*  City Selector Button */}
              <button
                onClick={() => {
                  playAudioFeedback("pop");
                  setCityOpen(true);
                }}
                className="flex items-center gap-1.5 bg-gray-900/90 hover:bg-gray-800 border border-gray-800 hover:border-red-500/40 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-bold text-gray-200 hover:text-white transition shadow-sm"
                title="Select City (Opens in Center Screen)"
              >
                <span className="text-red-500 text-sm animate-pulse"></span>
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{selectedCity}</span>
                <span className="text-[10px] text-gray-500 font-mono">▼</span>
              </button>
            </div>

            {/*  Desktop Links */}
            <div className="hidden xl:flex items-center gap-2">
              <Link
                to="/"
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition ${
                  isActive("/")
                    ? "bg-red-600/15 text-red-400 border border-red-500/40 shadow-inner"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                Home
              </Link>
              <Link
                to="/movies"
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition ${
                  isActive("/movies")
                    ? "bg-red-600/15 text-red-400 border border-red-500/40 shadow-inner"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                Movies & Shows
              </Link>

              <button
                onClick={() => {
                  playAudioFeedback("pop");
                  setWatchlistOpen(true);
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive("/watchlist")
                    ? "bg-red-600/15 text-red-400 border border-red-500/40"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                <span></span> Watchlist
                {watchlistItems.length > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                    {watchlistItems.length}
                  </span>
                )}
              </button>

              <Link
                to="/snacks"
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive("/snacks") || isActive("/food-beverages")
                    ? "bg-red-600/15 text-red-400 border border-red-500/40"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                <span></span> Snacks
              </Link>

              <Link
                to="/gift-cards"
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive("/gift-cards")
                    ? "bg-red-600/15 text-red-400 border border-red-500/40"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                <span></span> Gift Cards
              </Link>

              <Link
                to="/loyalty"
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive("/loyalty")
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-amber-400 hover:text-amber-200 hover:bg-amber-500/10"
                }`}
              >
                <span></span> Xaviercinema
              </Link>

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    location.pathname.startsWith("/admin")
                      ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-md"
                      : "bg-amber-500/10 text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 border border-amber-500/30"
                  }`}
                >
                  <span></span> Admin Portal
                </Link>
              )}
            </div>

            {/*  Action Hub Controls (Search, Watchlist, Profile, Menu) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Spotlight Search Trigger */}
              <button
                onClick={() => {
                  playAudioFeedback("pop");
                  setSpotlightOpen(true);
                }}
                className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-cyan-500/40 px-3 py-2 rounded-2xl text-xs font-bold text-gray-300 hover:text-white transition shadow-sm"
                title="Search (Ctrl + K)"
              >
                <span className="text-cyan-400">🔍</span>
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden lg:inline bg-gray-800 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-gray-700">
                  ⌘K
                </kbd>
              </button>

              {/* Watchlist Center Trigger Button */}
              {isLoggedIn && (
                <button
                  onClick={() => {
                    playAudioFeedback("pop");
                    setWatchlistOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-1.5 bg-gray-900 border border-gray-800 hover:border-red-500/40 px-3 py-2 rounded-2xl text-xs font-bold text-gray-300 hover:text-white transition shadow-sm"
                >
                  <span className="text-red-500">❤️</span>
                  <span className="hidden md:inline">Watchlist</span>
                  {watchlistItems.length > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {watchlistItems.length}
                    </span>
                  )}
                </button>
              )}

              {/* Admin Quick Entry */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex px-3 py-2 rounded-2xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition items-center gap-1.5 shadow-sm"
                  title="Open Admin Command Center"
                >
                  <span></span> Admin
                </Link>
              )}

              {/* User Avatar Command Hub Trigger */}
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    playAudioFeedback("pop");
                    setUserMenuOpen(true);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-950 border border-gray-800 hover:border-purple-500/40 px-2.5 py-1.5 rounded-2xl transition shadow-md group"
                  title="Open Account Command Center (Center Screen)"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-red-600 via-pink-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-purple-600/30 group-hover:scale-105 transition">
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="text-gray-200 text-xs font-bold truncate max-w-[80px] hidden sm:inline">
                    {userName || "Account"}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">▼</span>
                </button>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white text-xs font-bold px-3 py-2 rounded-2xl border border-gray-800 hover:border-gray-700 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-black px-4 py-2 rounded-2xl transition shadow-lg shadow-red-600/30 hidden xs:inline"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* ☰ Full Navigation Menu Modal Trigger */}
              <button
                onClick={() => {
                  playAudioFeedback("pop");
                  setMenuOpen(true);
                }}
                className="xl:hidden p-2 rounded-2xl bg-gray-900 border border-gray-800 text-gray-200 hover:text-white hover:border-gray-700 transition"
                aria-label="Open Navigation Hub"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

            </div>

          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/*  CENTERED CITY SELECTION OVERLAY MODAL (DIRECTLY IN FRONT OF SCREEN)     */}
      {/* ========================================================================= */}
      {cityOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D0D15] border border-red-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-modalScaleIn flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-800/80 flex items-center justify-between bg-[#12121D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-xl text-red-500">
                  
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Select Booking Location</h3>
                  <p className="text-xs text-gray-400">Choose your city to explore nearby showtimes & multiplexes</p>
                </div>
              </div>
              <button
                onClick={() => setCityOpen(false)}
                className="w-9 h-9 rounded-2xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* City Search Bar */}
            <div className="p-4 bg-[#0A0A0F] border-b border-gray-800/80 flex items-center gap-3">
              <span className="text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                autoFocus
                placeholder="Search city (e.g. Mumbai, Delhi, Bengaluru)..."
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
              />
              <button
                onClick={() => handleCitySelect(selectedCity)}
                className="shrink-0 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                Auto-Detect GPS
              </button>
            </div>

            {/* City Grid */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                  <span></span> Major Metros ({filteredCities.length})
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredCities.map((city) => {
                    const isSelected = selectedCity === city.name;
                    return (
                      <button
                        key={city.name}
                        onClick={() => handleCitySelect(city.name)}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-24 ${
                          isSelected
                            ? "bg-gradient-to-br from-red-950/80 to-purple-950/60 border-red-500 text-white shadow-lg shadow-red-950/40"
                            : "bg-gray-900/60 hover:bg-gray-800/80 border-gray-800 text-gray-300 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{city.icon}</span>
                          {isSelected && <span className="text-red-400 font-extrabold text-sm">✓</span>}
                        </div>
                        <div>
                          <div className="text-xs font-black truncate">{city.name}</div>
                          <div className="text-[10px] text-gray-400">{city.state}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#0A0A0F] border-t border-gray-800 text-center text-xs text-gray-500 flex items-center justify-between">
              <span>Current City: <strong className="text-red-400">{selectedCity}</strong></span>
              <button
                onClick={() => setCityOpen(false)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-2 rounded-xl text-xs border border-gray-800"
              >
                Confirm Location
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CENTERED WATCHLIST OVERLAY MODAL (DIRECTLY IN FRONT OF SCREEN)          */}
      {/* ========================================================================= */}
      {watchlistOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D0D15] border border-red-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-modalScaleIn flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-800/80 flex items-center justify-between bg-[#12121D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-xl text-red-500">
                  ❤️
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    My Watchlist ({watchlistItems.length})
                  </h3>
                  <p className="text-xs text-gray-400">Your bookmarked blockbusters ready for showtime</p>
                </div>
              </div>
              <button
                onClick={() => setWatchlistOpen(false)}
                className="w-9 h-9 rounded-2xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Watchlist Movie List */}
            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
              {watchlistItems.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="text-5xl">🎬</div>
                  <h4 className="text-base font-bold text-white">Your Watchlist is Empty</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Click the  icon on any movie poster across Xaviercinema to save it here for instant booking.
                  </p>
                  <button
                    onClick={() => {
                      setWatchlistOpen(false);
                      navigate("/movies");
                    }}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-red-600/30"
                  >
                    Browse Trending Movies →
                  </button>
                </div>
              ) : (
                watchlistItems.map((item) => {
                  const movieObj = item._id ? item : { _id: item, title: "Saved Movie" };
                  return (
                    <div
                      key={movieObj._id}
                      className="p-3 bg-gray-900/80 border border-gray-800 hover:border-red-500/40 rounded-2xl flex items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {movieObj.poster ? (
                          <img
                            src={movieObj.poster}
                            alt=""
                            className="w-12 h-16 object-cover rounded-xl border border-gray-800 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-xl shrink-0">
                            
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{movieObj.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded-md border border-red-500/20">
                              {movieObj.genre || "Action"}
                            </span>
                            <span className="text-xs text-yellow-400 font-bold">
                              ★ {movieObj.rating || "4.8"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setWatchlistOpen(false);
                            navigate(`/movies/${movieObj._id}`);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-red-600/20"
                        >
                          Book →
                        </button>
                        <button
                          onClick={(e) => handleRemoveFromWatchlist(e, movieObj._id)}
                          className="p-2 bg-gray-950 hover:bg-red-950 text-gray-400 hover:text-red-400 border border-gray-800 rounded-xl text-xs transition"
                          title="Remove from Watchlist"
                        >
                          
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#0A0A0F] border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <span>Saved Items: <strong className="text-white">{watchlistItems.length}</strong></span>
              <button
                onClick={() => setWatchlistOpen(false)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-2 rounded-xl text-xs border border-gray-800"
              >
                Close Portal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CENTERED USER ACCOUNT COMMAND CENTER (DIRECTLY IN FRONT OF SCREEN)    */}
      {/* ========================================================================= */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D0D15] border border-purple-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-modalScaleIn flex flex-col">
            
            {/* User Profile Banner */}
            <div className="p-6 bg-gradient-to-br from-purple-950/80 via-[#131320] to-[#0A0A0F] border-b border-gray-800 relative">
              <button
                onClick={() => setUserMenuOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-gray-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-pink-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-purple-600/30">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{userName || "CineBook User"}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                       Xaviercinema VIP Member
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="bg-black/50 border border-white/10 p-2.5 rounded-2xl text-center">
                  <div className="text-xs text-gray-400 font-bold">Tickets</div>
                  <div className="text-sm font-black text-white mt-0.5">Active</div>
                </div>
                <div className="bg-black/50 border border-white/10 p-2.5 rounded-2xl text-center">
                  <div className="text-xs text-gray-400 font-bold">Points</div>
                  <div className="text-sm font-black text-amber-400 mt-0.5">1,250 PTS</div>
                </div>
                <div className="bg-black/50 border border-white/10 p-2.5 rounded-2xl text-center">
                  <div className="text-xs text-gray-400 font-bold">City</div>
                  <div className="text-sm font-black text-cyan-400 mt-0.5 truncate">{selectedCity}</div>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/my-bookings");
                }}
                className="w-full p-3 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 rounded-2xl text-left flex items-center justify-between text-xs font-bold text-gray-200 hover:text-white transition"
              >
                <span className="flex items-center gap-3">
                  <span className="text-base"></span> My Bookings & Tickets Passbook
                </span>
                <span>→</span>
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/loyalty");
                }}
                className="w-full p-3 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 rounded-2xl text-left flex items-center justify-between text-xs font-bold text-amber-300 hover:text-amber-200 transition"
              >
                <span className="flex items-center gap-3">
                  <span className="text-base"></span> CineClub VIP Rewards & Perks
                </span>
                <span>→</span>
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/gift-cards");
                }}
                className="w-full p-3 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 rounded-2xl text-left flex items-center justify-between text-xs font-bold text-gray-200 hover:text-white transition"
              >
                <span className="flex items-center gap-3">
                  <span className="text-base"></span> CineBook Gift Cards & Vouchers
                </span>
                <span>→</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/admin/dashboard");
                  }}
                  className="w-full p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl text-left flex items-center justify-between text-xs font-black text-amber-400 transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base"></span> Admin Operational Console
                  </span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* Logout Button */}
            <div className="p-4 bg-[#0A0A0F] border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
              >
                <span></span> Sign Out of Account
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ☰ CENTERED FULL NAVIGATION HUB MODAL (FOR MOBILE & TABLET SCREENS)        */}
      {/* ========================================================================= */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D0D15] border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-modalScaleIn flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#12121D]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white text-base font-black">
                  
                </div>
                <span className="text-white font-black text-lg">Navigation Hub</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-900 text-gray-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Navigation Grid Tiles */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/");
                  }}
                  className="p-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 rounded-2xl text-left flex flex-col justify-between h-24 transition"
                >
                  <span className="text-2xl"></span>
                  <span className="text-xs font-black text-white">Home</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/movies");
                  }}
                  className="p-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 rounded-2xl text-left flex flex-col justify-between h-24 transition"
                >
                  <span className="text-2xl"></span>
                  <span className="text-xs font-black text-white">Movies & Shows</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/snacks");
                  }}
                  className="p-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 rounded-2xl text-left flex flex-col justify-between h-24 transition"
                >
                  <span className="text-2xl"></span>
                  <span className="text-xs font-black text-white">Snacks Pantry</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setWatchlistOpen(true);
                  }}
                  className="p-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 rounded-2xl text-left flex flex-col justify-between h-24 transition"
                >
                  <span className="text-2xl">❤️</span>
                  <span className="text-xs font-black text-white">Watchlist ({watchlistItems.length})</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/gift-cards");
                  }}
                  className="p-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 rounded-2xl text-left flex flex-col justify-between h-24 transition"
                >
                  <span className="text-2xl"></span>
                  <span className="text-xs font-black text-white">Gift Cards</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/loyalty");
                  }}
                  className="p-4 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30 rounded-2xl text-left flex flex-col justify-between h-24 transition"
                >
                  <span className="text-2xl"></span>
                  <span className="text-xs font-black text-amber-300">CineClub VIP</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/admin/dashboard");
                    }}
                    className="p-4 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-500/40 rounded-2xl text-left flex flex-col justify-between h-24 transition"
                  >
                    <span className="text-2xl">⚙️</span>
                    <span className="text-xs font-black text-amber-300">Admin Portal</span>
                  </button>
                )}
              </div>

              {isLoggedIn ? (
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/my-bookings");
                    }}
                    className="w-full p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-left flex items-center justify-between text-xs font-bold text-red-300 transition hover:bg-red-950/50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">🎟️</span> My Digital Tickets & QR Pass
                    </span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-3.5 bg-red-950/20 hover:bg-red-900/30 border border-red-800/40 text-red-300 font-extrabold text-xs rounded-2xl transition text-center"
                  >
                    Sign Out of Account
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl text-center text-xs font-bold text-white transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/register");
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-black rounded-2xl transition shadow-lg shadow-red-600/30"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#0A0A0F] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span>Location: <strong className="text-white">{selectedCity}</strong></span>
              <button
                onClick={() => setMenuOpen(false)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-2 rounded-xl text-xs border border-gray-800"
              >
                Close Hub
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Spotlight Search Modal */}
      <SpotlightSearch
        isOpen={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
      />
    </>
  );
}