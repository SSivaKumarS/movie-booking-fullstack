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
  const [backdropBrightness, setBackdropBrightness] = useState(75);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [showControls, setShowControls] = useState(false);

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
      console.error("Watchlist toggle error:", err);
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
      <div className="bg-[#08070b] min-h-screen flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full shadow-lg shadow-red-600/30"
        />
        <p className="text-gray-400 font-mono text-sm tracking-widest animate-pulse uppercase">
          Loading Cinema Grid...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#08070b] text-white min-h-screen selection:bg-red-600 selection:text-white font-sans overflow-x-hidden">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative h-[90vh] md:h-[95vh] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {movies[activeHero] && (
            <motion.div
              key={activeHero}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: "easeOut" }}
                src={movies[activeHero].poster}
                alt={movies[activeHero].title}
                className="w-full h-full object-cover transition-all duration-300"
                style={{ filter: `brightness(${backdropBrightness / 100}) contrast(1.1)` }}
              />

              {/* Dynamic Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#08070b] via-[#08070b]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#08070b] via-[#08070b]/60 to-transparent" />

              {/* Ambient Glow */}
              {ambientGlow && (
                <div
                  className="absolute -bottom-10 -left-10 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-50"
                  style={{
                    background: `radial-gradient(circle, rgba(220,38,38,0.7) 0%, rgba(124,58,237,0.3) 60%, transparent 80%)`,
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Display FX Control Panel */}
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-2 bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition shadow-2xl active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Visual FX</span>
            <span className="text-[10px] text-red-400 font-mono">({backdropBrightness}%)</span>
          </button>

          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-12 bg-slate-900/90 border border-white/10 p-5 rounded-2xl backdrop-blur-2xl shadow-2xl w-72 space-y-4 text-xs z-40"
              >
                <div className="flex items-center justify-between font-bold border-b border-white/10 pb-2">
                  <span className="text-red-400">Backdrop Brightness</span>
                  <span className="text-gray-300 font-mono">{backdropBrightness}%</span>
                </div>

                <input
                  type="range"
                  min="30"
                  max="100"
                  value={backdropBrightness}
                  onChange={(e) => setBackdropBrightness(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
                />

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Cinema", val: 45 },
                    { label: "Default", val: 75 },
                    { label: "Vivid", val: 95 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setBackdropBrightness(preset.val)}
                      className={`py-1.5 px-2 rounded-lg font-bold text-[10px] border transition ${
                        backdropBrightness === preset.val
                          ? "bg-red-600 text-white border-red-500 shadow-md"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-gray-300">Ambient Aura</span>
                  <button
                    onClick={() => setAmbientGlow(!ambientGlow)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                      ambientGlow ? "bg-red-600 justify-end" : "bg-gray-700 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hero Banner Details */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-6 md:px-16 lg:px-24 max-w-6xl">
          <AnimatePresence mode="wait">
            {movies[activeHero] && (
              <motion.div
                key={`content-${activeHero}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded tracking-widest uppercase shadow-lg shadow-red-600/20">
                    FEATURED
                  </span>
                  <span className="text-gray-300 text-xs font-semibold tracking-wider bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    {movies[activeHero].genre}
                  </span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 tracking-tight drop-shadow-xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400">
                  {movies[activeHero].title}
                </h1>

                <p className="text-gray-300 text-sm md:text-base max-w-xl mb-8 leading-relaxed line-clamp-3 font-normal drop-shadow-sm">
                  {movies[activeHero].description ||
                    "An epic journey awaits in this cinematic masterpiece. Experience the thrill, the emotion, and the action on the big screen."}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => navigate(`/movies/${movies[activeHero]._id}`)}
                    className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl tracking-wider transition-all duration-300 shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95"
                  >
                    BOOK TICKETS
                  </button>

                  <button
                    onClick={() => setTrailerMovie(movies[activeHero])}
                    className="px-8 py-3.5 border border-white/20 bg-white/5 hover:bg-white/15 backdrop-blur-md text-white text-xs font-bold rounded-xl tracking-wider transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <span>▶</span> WATCH TRAILER
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hero Slider Navigation Dots */}
        <div className="absolute bottom-8 right-8 md:right-16 z-20 flex gap-2">
          {movies.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveHero(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeHero === i ? "w-8 bg-red-600 shadow-lg shadow-red-600/50" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ================= MAIN CONTENT SECTION ================= */}
      <main className="relative z-20 px-6 md:px-16 lg:px-24 -mt-10 pb-32">
        {/* Search & Filter Bar */}
        <div className="mb-14">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-[#0f0e17]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
            {/* Search Input */}
            <div className="w-full lg:w-96 relative">
              <input
                type="text"
                placeholder="Search movies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-red-600 transition text-sm font-light placeholder:text-gray-500 text-white"
              />
            </div>

            {/* Genre Filters */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                    selectedGenre === g
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Movie Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
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
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  className="group relative flex flex-col"
                >
                  <div
                    onClick={() => navigate(`/movies/${movie._id}`)}
                    className="relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-white/5 shadow-lg group-hover:shadow-2xl group-hover:shadow-red-600/10 transition-all duration-500"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Dark Hover Mask */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <button className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition-transform duration-300 transform translate-y-2 group-hover:translate-y-0">
                        QUICK BOOK
                      </button>
                    </div>

                    {/* Watchlist Bookmark */}
                    <button
                      onClick={(e) => handleToggleWatchlist(e, movie._id)}
                      className={`absolute top-3 left-3 p-2 rounded-xl backdrop-blur-md border transition-all duration-200 ${
                        isSaved
                          ? "bg-red-600/80 border-red-500 text-white"
                          : "bg-black/40 border-white/10 text-gray-300 hover:text-white hover:bg-black/60"
                      }`}
                      title={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={isSaved ? "currentColor" : "none"}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-4.5-4.5-4.5 4.5 0 00-3.374 1.948R12 10.364l-1.808-1.73a4.5 4.5 0 00-5.874 0z"
                        />
                      </svg>
                    </button>

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-white text-[11px] font-bold">
                        {movie.rating || "4.8"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="mt-3 px-1">
                    <h3 className="text-sm font-semibold truncate tracking-tight text-gray-200 group-hover:text-red-500 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between text-gray-400 text-[11px] mt-1 font-medium">
                      <span>{movie.genre}</span>
                      <span>{movie.duration ? `${movie.duration}m` : "2h 15m"}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredMovies.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-4xl mb-4"></p>
            <h2 className="text-xl font-medium text-gray-400">No movies found</h2>
            <p className="text-xs text-gray-600 mt-1">Try searching for a different title or genre.</p>
          </div>
        )}
      </main>

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