import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";
import TrailerModal from "../components/TrailerModal";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [activeHero, setActiveHero] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    API.get(`/api/movies`)
      .then((res) => {
        setMovies(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });

    if (token) {
      API.get(`/api/users/watchlist`)
        .then((res) => {
          const ids = (res.data || []).map((m) => m._id || m);
          setWatchlistIds(ids);
        })
        .catch(() => {});
    }
  }, [token]);

  const [backdropBrightness, setBackdropBrightness] = useState(75);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [showControls, setShowControls] = useState(false);

  /* ================= AUTO HERO ROTATION ================= */
  useEffect(() => {
    if (!movies.length) return;
    const interval = setInterval(() => {
      setActiveHero((prev) => (prev + 1) % Math.min(movies.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [movies]);

  /* ================= WATCHLIST TOGGLE ================= */
  const handleToggleWatchlist = async (e, movieId) => {
    e.stopPropagation();
    if (!token) {
      alert("Please log in to add movies to your watchlist!");
      return;
    }
    try {
      const res = await API.post(`/api/users/watchlist/toggle`, { movieId });
      const updatedList = (res.data.watchlist || []).map((m) => m._id || m);
      setWatchlistIds(updatedList);
    } catch (err) {
      console.log("Watchlist toggle error:", err);
    }
  };

  /* ================= GENRES ================= */
  const genres = useMemo(() => {
    const unique = ["All", ...new Set(movies.map((m) => m.genre))];
    return unique;
  }, [movies]);

  /* ================= FILTER LOGIC ================= */
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchSearch = movie.title.toLowerCase().includes(search.toLowerCase());
      const matchGenre = selectedGenre === "All" || movie.genre === selectedGenre;
      return matchSearch && matchGenre;
    });
  }, [movies, search, selectedGenre]);

  if (loading) {
    return (
      <div className="bg-[#050507] min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#050507] text-white min-h-screen selection:bg-red-600/30">
      {/* ================= HERO SECTION ================= */}
      <section className="relative h-[95vh] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {movies[activeHero] && (
            <motion.div
              key={activeHero}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <motion.img
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10, ease: "linear" }}
                src={movies[activeHero].poster}
                alt="Hero Background"
                className="w-full h-full object-cover transition-all duration-500"
                style={{ filter: `brightness(${backdropBrightness / 100}) contrast(1.08)` }}
              />
              {/* Dynamic Gradient Overlays - Feathered to keep backdrop visible while maintaining text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050507]/85 via-[#050507]/45 to-transparent" />

              {/* Ambient Neon Aura Backdrop Effect */}
              {ambientGlow && (
                <div 
                  className="absolute -bottom-20 left-10 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-40 transition-all duration-1000"
                  style={{
                    background: `radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(147,51,234,0.4) 50%, transparent 80%)`
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop Visual Enhancement Control Pill */}
        <div className="absolute top-8 right-8 z-30 flex items-center gap-3">
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full text-xs font-bold transition shadow-xl hover:scale-105"
          >
            <span></span>
            <span>Poster Lighting & FX</span>
            <span className="text-[10px] text-red-400">({backdropBrightness}%)</span>
          </button>

          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 top-12 bg-[#12121c]/95 border border-white/20 p-5 rounded-2xl backdrop-blur-2xl shadow-2xl w-72 space-y-4 text-xs z-40"
              >
                <div className="flex items-center justify-between font-bold border-b border-white/10 pb-2">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span></span> Poster Brightness
                  </span>
                  <span className="text-gray-300 font-mono">{backdropBrightness}%</span>
                </div>

                {/* Brightness Slider */}
                <div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={backdropBrightness}
                    onChange={(e) => setBackdropBrightness(Number(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-semibold">
                    <span>Dim (30%)</span>
                    <span>Standard (75%)</span>
                    <span>Vivid (100%)</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Cinema", val: 45 },
                    { label: "Clear", val: 75 },
                    { label: "Vivid ⚡", val: 95 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setBackdropBrightness(preset.val)}
                      className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${
                        backdropBrightness === preset.val
                          ? "bg-red-600 text-white border-red-500 shadow-md"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Ambient Aura Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-gray-300 font-medium">Ambient Cinema Glow</span>
                  <button
                    onClick={() => setAmbientGlow(!ambientGlow)}
                    className={`w-10 h-5 flex items-center rounded-full p-1 transition duration-300 ${
                      ambientGlow ? "bg-red-600 justify-end" : "bg-gray-700 justify-start"
                    }`}
                  >
                    <div className="w-3.5 h-3.5 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-24 max-w-5xl">
          <AnimatePresence mode="wait">
            {movies[activeHero] && (
              <motion.div
                key={`content-${activeHero}`}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 30, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-widest shadow-md shadow-red-600/40">
                    Hot Pick
                  </span>
                  <span className="text-gray-300 text-sm font-medium tracking-wide bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    {movies[activeHero].genre}
                  </span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none tracking-tighter drop-shadow-2xl">
                  {movies[activeHero].title}
                </h1>

                <p className="text-gray-200 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-light drop-shadow-lg bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
                  {movies[activeHero].description ||
                    "An epic journey awaits in this cinematic masterpiece. Experience the thrill, the emotion, and the action on the big screen."}
                </p>

                <div className="flex flex-wrap gap-5">
                  <button
                    onClick={() => navigate(`/movies/${movies[activeHero]._id}`)}
                    className="group relative px-10 py-4 bg-red-600 text-white font-bold rounded-full overflow-hidden transition-all hover:pr-14 shadow-xl shadow-red-600/30"
                  >
                    <span className="relative z-10">BOOK TICKETS</span>
                    <span className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all">
                      →
                    </span>
                  </button>

                  <button
                    onClick={() => setTrailerMovie(movies[activeHero])}
                    className="px-10 py-4 border border-white/30 bg-black/40 hover:bg-black/60 backdrop-blur-xl rounded-full font-bold transition shadow-lg flex items-center gap-2"
                  >
                    ▶ WATCH TRAILER
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hero Slider Dots */}
        <div className="absolute bottom-12 right-24 z-20 flex gap-3">
          {movies.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveHero(i)}
              className={`h-1.5 transition-all duration-500 rounded-full ${
                activeHero === i ? "w-12 bg-red-600 shadow-md shadow-red-600" : "w-3 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <div className="relative z-20 px-6 md:px-24 -mt-32 pb-32">
        {/* Filter Bar */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row gap-8 items-end justify-between bg-[#111115]/80 backdrop-blur-2xl p-8 rounded-3xl border border-white/5 shadow-2xl">
            <div className="w-full md:w-1/3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3 block">
                Search Universe
              </label>
              <input
                type="text"
                placeholder="Find a movie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border-b border-white/10 py-3 outline-none focus:border-red-600 transition text-xl font-light placeholder:text-gray-700 text-white"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${
                    selectedGenre === g
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:border-red-600 hover:text-white"
                  }`}
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Movie Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-16"
        >
          <AnimatePresence>
            {filteredMovies.map((movie, index) => {
              const isSaved = watchlistIds.includes(movie._id);
              return (
                <motion.div
                  key={movie._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group relative"
                >
                  <div
                    onClick={() => navigate(`/movies/${movie._id}`)}
                    className="relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-[#1a1a1f] shadow-2xl shadow-black"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      loading="lazy"
                      decoding="async"
                      width="300"
                      height="450"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                      <button className="w-full py-3 bg-red-600 text-white font-bold rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        QUICK BOOK
                      </button>
                    </div>

                    {/* Bookmark / Watchlist Heart Button */}
                    <button
                      onClick={(e) => handleToggleWatchlist(e, movie._id)}
                      className={`absolute top-4 left-4 p-2 rounded-full backdrop-blur-md border transition ${
                        isSaved
                          ? "bg-red-950/80 border-red-500 text-red-500"
                          : "bg-black/60 border-white/10 text-gray-300 hover:text-white"
                      }`}
                      title={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                    >
                      {isSaved ? "❤️" : "🤍"}
                    </button>

                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                      <span className="text-yellow-500 text-xs">★</span>
                      <span className="text-white text-[10px] font-bold">
                        {movie.rating || "4.8"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-bold truncate tracking-tight mb-1 group-hover:text-red-500 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold tracking-[0.1em] uppercase">
                      <span>{movie.genre}</span>
                      <span>{movie.duration ? `${movie.duration}m` : "2h 15m"}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredMovies.length === 0 && (
          <div className="py-40 text-center">
            <span className="text-8xl mb-8 block"></span>
            <h2 className="text-3xl font-light text-gray-600">No movies match your search.</h2>
          </div>
        )}
      </div>

      {/* ================= TRAILER MODAL ================= */}
      <TrailerModal
        isOpen={!!trailerMovie}
        onClose={() => setTrailerMovie(null)}
        trailerUrl={trailerMovie?.trailerUrl}
        movieTitle={trailerMovie?.title}
      />
    </div>
  );
}

export default Movies;
