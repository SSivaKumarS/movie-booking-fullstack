import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";

const TrailerModal = lazy(() => import("../components/TrailerModal"));
const HeroTrailer = lazy(() => import("../components/HeroTrailer"));

function Home() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHero, setActiveHero] = useState(0);
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [toastMsg, setToastMsg] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch Movies
    API.get("/api/movies")
      .then((res) => {
        setMovies(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Home movies fetch error:", err);
        setLoading(false);
      });

    // Fetch Watchlist
    if (token) {
      API.get("/api/users/watchlist")
        .then((res) => {
          const ids = (res.data || []).map((m) => m._id || m);
          setWatchlistIds(ids);
        })
        .catch(() => {});
    }
  }, [token]);

  // Auto Rotation for Hero Banner
  useEffect(() => {
    if (!movies.length) return;
    const timer = setInterval(() => {
      setActiveHero((prev) => (prev + 1) % Math.min(movies.length, 5));
    }, 6000);
    return () => clearInterval(timer);
  }, [movies]);

  // Watchlist Toggle
  const handleToggleWatchlist = async (e, movieId, movieTitle) => {
    e.stopPropagation();
    if (!token) {
      setToastMsg("Please log in to save movies to your watchlist!");
      setTimeout(() => setToastMsg(""), 3500);
      return;
    }
    try {
      const res = await API.post("/api/users/watchlist/toggle", { movieId });
      const updated = (res.data.watchlist || []).map((m) => m._id || m);
      setWatchlistIds(updated);

      const isAdded = updated.includes(movieId);
      setToastMsg(isAdded ? ` Added "${movieTitle}" to Watchlist!` : `Removed "${movieTitle}" from Watchlist`);
      setTimeout(() => setToastMsg(""), 3500);
    } catch (err) {
      console.error("Watchlist error:", err);
    }
  };

  // Unique Genres
  const genres = useMemo(() => {
    return ["All", "Action", "Drama", "Sci-Fi", "Comedy", "Thriller", "Horror"];
  }, []);

  // Filtered Movies
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            movie.genre?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === "All" || movie.genre?.toLowerCase().includes(selectedGenre.toLowerCase());
      const matchesLang = selectedLanguage === "All" || (movie.language && movie.language.toLowerCase() === selectedLanguage.toLowerCase());
      return matchesSearch && matchesGenre && matchesLang;
    });
  }, [movies, searchQuery, selectedGenre, selectedLanguage]);

  const currentHero = movies[activeHero];

  return (
    <div className="relative min-h-screen text-white bg-[#06060A] overflow-hidden selection:bg-red-600/40">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-6 z-50 bg-[#161622] border border-red-500/40 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl shadow-red-950 flex items-center gap-3"
          >
            <span></span>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= HERO BACKDROP & CAROUSEL ================= */}
      <section className="relative h-[85vh] md:h-[90vh] w-full overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-950">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentHero && (
              <motion.div
                key={activeHero}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0"
              >
                <img
                  src={currentHero.poster}
                  alt={currentHero.title}
                  fetchpriority="high"
                  decoding="async"
                  className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
                />
                {/* Refined gradient overlays for clear background visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#06060A] via-[#06060A]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#06060A]/90 via-[#06060A]/50 to-transparent" />
                
                {/* Dynamic Ambient Backlight Glow - Lightweight blur on mobile for max GPU performance */}
                <div 
                  className="absolute bottom-10 left-10 md:left-20 w-64 h-64 md:w-[450px] md:h-[450px] rounded-full blur-2xl md:blur-[140px] pointer-events-none opacity-30"
                  style={{
                    background: `radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(219,39,119,0.3) 60%, transparent 80%)`
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Hero Info Overlay */}
        {!loading && currentHero && (
          <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end pb-20 px-6 md:px-12">
            <motion.div
              key={`text-${activeHero}`}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-red-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-lg shadow-red-600/40">
                   TOP BLOCKBUSTER
                </span>
                <span className="bg-white/10 backdrop-blur-md text-gray-200 border border-white/15 text-xs font-semibold px-3 py-1 rounded-full">
                  {currentHero.genre || "Action / Adventure"}
                </span>
                <span className="text-yellow-400 font-bold text-sm flex items-center gap-1">
                   {currentHero.rating || "4.9"} / 5
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight mb-4 drop-shadow-2xl">
                {currentHero.title}
              </h1>

              <p className="text-gray-300 text-sm md:text-base line-clamp-3 mb-8 max-w-2xl font-normal leading-relaxed">
                {currentHero.description ||
                  "Immerse yourself in cinematic greatness. Book early access tickets now for an unmissable experience with state-of-the-art Surround Sound and Recliner Comfort."}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate(`/movies/${currentHero._id}`)}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-2xl transition shadow-xl shadow-red-600/30 flex items-center gap-3 group"
                >
                  <span> BOOK TICKETS NOW</span>
                  <span className="group-hover:translate-x-1 transition">→</span>
                </button>

                <button
                  onClick={() => setTrailerMovie(currentHero)}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white font-bold text-sm rounded-2xl transition flex items-center gap-2"
                >
                  <span>▶</span> Watch Trailer
                </button>
              </div>
            </motion.div>

            {/* Slider Indicator Dots */}
            <div className="flex items-center gap-3 mt-12">
              {movies.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveHero(i)}
                  className={`h-2 transition-all duration-300 rounded-full ${
                    activeHero === i ? "w-10 bg-red-600" : "w-3 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ================= AI MOTION CONTROLLER 4K HERO LAUNCH TRAILER ================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 my-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs tracking-widest uppercase mb-1">
              <span></span> PRODUCT LAUNCH TRAILER
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              AI Motion-Controlled Cinema Booking
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              Experience the world's first touchless movie ticket booking system powered by MediaPipe LiDAR tracking.
            </p>
          </div>
          <a
            href="/hero-video.html"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs rounded-2xl border border-cyan-500/40 transition shrink-0 flex items-center gap-2"
          >
            <span>⛶ Launch Standalone 4K Trailer</span>
          </a>
        </div>

        {/* Hero Trailer Canvas Component */}
        <Suspense fallback={<div className="h-64 bg-gray-950/80 rounded-3xl animate-pulse flex items-center justify-center text-xs text-gray-500">Loading AI Motion Trailer...</div>}>
          <HeroTrailer />
        </Suspense>
      </section>

      {/* ================= SEARCH & CATEGORY BAR ================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 mb-20">
        <div className="bg-[#12121B]/90 backdrop-blur-2xl border border-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full md:w-1/2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search movies, genres, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Language Chips */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2 shrink-0">
                Language:
              </span>
              {["All", "English", "Hindi", "Tamil", "Telugu"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedLanguage === lang
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Pills */}
          <div className="flex items-center gap-3 overflow-x-auto pt-2 border-t border-gray-800/80 custom-scrollbar">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 shrink-0">
              Genre:
            </span>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                  selectedGenre === g
                    ? "bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold shadow-md shadow-red-600/30"
                    : "bg-gray-900/80 border border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ================= NOW SHOWING & EXPLORE GRID ================= */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 mb-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-500 font-extrabold text-xs tracking-widest uppercase mb-1">
              <span></span> EXPLORE SHOWTIMES
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Now Showing in Theatres
            </h2>
          </div>

          <Link
            to="/movies"
            className="text-xs font-bold text-gray-400 hover:text-red-400 transition flex items-center gap-1 bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-2xl w-fit"
          >
            <span>View All {movies.length} Movies</span>
            <span>→</span>
          </Link>
        </div>

        {/* Movie Cards Grid */}
        {filteredMovies.length === 0 ? (
          <div className="bg-[#12121A] border border-gray-800 rounded-3xl p-16 text-center">
            <span className="text-5xl mb-4 block">🎬</span>
            <h3 className="text-xl font-bold text-white mb-2">No movies match your filters</h3>
            <p className="text-gray-400 text-sm mb-6">Try searching for a different title or resetting genre filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("All");
                setSelectedLanguage("All");
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredMovies.map((movie) => {
              const isSaved = watchlistIds.includes(movie._id);
              return (
                <motion.div
                  key={movie._id}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#111119] border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-red-500/40 transition duration-300"
                >
                  {/* Poster Header */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      loading="lazy"
                      decoding="async"
                      width="300"
                      height="450"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111119] via-transparent to-transparent opacity-80" />

                    {/* Heart Watchlist Toggle */}
                    <button
                      onClick={(e) => handleToggleWatchlist(e, movie._id, movie.title)}
                      className={`absolute top-4 left-4 p-2.5 rounded-2xl backdrop-blur-xl border transition ${
                        isSaved
                          ? "bg-red-950/90 border-red-500 text-red-500"
                          : "bg-black/60 border-white/10 text-gray-300 hover:text-white hover:border-red-500/50"
                      }`}
                      title={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                    >
                      {isSaved ? "❤️" : "🤍"}
                    </button>

                    {/* Rating Pill */}
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-white text-xs font-bold">
                        {movie.rating || "4.8"}
                      </span>
                    </div>

                    {/* Play Trailer Button overlay */}
                    <button
                      onClick={() => setTrailerMovie(movie)}
                      className="absolute bottom-4 right-4 bg-red-600/90 hover:bg-red-600 text-white p-3 rounded-2xl shadow-lg transition opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                      title="Play Trailer"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20">
                          {movie.genre || "Action"}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">
                          ⏱ {movie.duration ? `${movie.duration}m` : "2h 15m"}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition line-clamp-1 mb-2">
                        {movie.title}
                      </h3>

                      <p className="text-gray-400 text-xs line-clamp-2 mb-6 leading-relaxed">
                        {movie.description || "Catch this blockbuster movie on the big screen today."}
                      </p>
                    </div>

                    <Link
                      to={`/movies/${movie._id}`}
                      className="w-full bg-gray-900 hover:bg-red-600 text-gray-200 hover:text-white font-bold text-xs py-3 rounded-2xl border border-gray-800 hover:border-red-500 transition text-center shadow-md block"
                    >
                      SELECT SHOWTIME →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= PROMO / EXPERIENCE CARDS ================= */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 mb-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-gradient-to-br from-red-950/40 via-[#13131D] to-[#0A0A0F] border border-red-500/20 p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="text-3xl mb-4">🛋️</div>
            <h3 className="text-xl font-bold text-white mb-2">VIP Recliner Experience</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              Plush luxury leather recliners with personal serving call buttons and Dolby Atmos audio setup.
            </p>
            <Link to="/movies" className="text-xs font-bold text-red-400 hover:text-red-300">
              Browse VIP Theatres →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-950/40 via-[#13131D] to-[#0A0A0F] border border-purple-500/20 p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="text-3xl mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Combos & Gourmet Snacks</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              Pre-order hot buttered popcorn, nachos, and cold drinks straight to your seat with no queue!
            </p>
            <Link to="/movies" className="text-xs font-bold text-purple-400 hover:text-purple-300">
              View Snack Menu →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-amber-950/40 via-[#13131D] to-[#0A0A0F] border border-amber-500/20 p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="text-3xl mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Digital QR Ticket</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              No paper printouts needed. Scan your QR code ticket at the theatre gates directly from your smartphone.
            </p>
            <Link to="/my-bookings" className="text-xs font-bold text-amber-400 hover:text-amber-300">
              Check My Tickets →
            </Link>
          </div>

        </div>
      </section>

      {/* Trailer Modal */}
      <Suspense fallback={null}>
        <TrailerModal
          isOpen={!!trailerMovie}
          onClose={() => setTrailerMovie(null)}
          trailerUrl={trailerMovie?.trailerUrl}
          movieTitle={trailerMovie?.title}
        />
      </Suspense>
    </div>
  );
}

export default Home;
