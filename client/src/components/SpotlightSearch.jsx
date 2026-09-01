import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function SpotlightSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  /* Fetch Data */
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const fetchSearchData = async () => {
      setLoading(true);
      try {
        const [movieResponse, snackResponse] = await Promise.all([
          API.get("/api/movies").catch(() => ({ data: [] })),
          API.get("/api/snacks").catch(() => ({ data: [] })),
        ]);

        if (cancelled) return;

        setMovies(Array.isArray(movieResponse?.data) ? movieResponse.data : []);
        setSnacks(Array.isArray(snackResponse?.data) ? snackResponse.data : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSearchData();

    // Prevent body scrolling when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  /* Reset on Close */
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const normalizedQuery = query.trim().toLowerCase();

  /* Filter Lists */
  const filteredMovies = useMemo(() => {
    if (!normalizedQuery) return movies.slice(0, 6);
    return movies.filter((m) =>
      `${m?.title} ${m?.genre}`.toLowerCase().includes(normalizedQuery)
    ).slice(0, 6);
  }, [movies, normalizedQuery]);

  const filteredSnacks = useMemo(() => {
    if (!normalizedQuery) return snacks.slice(0, 6);
    return snacks.filter((s) =>
      `${s?.name} ${s?.category}`.toLowerCase().includes(normalizedQuery)
    ).slice(0, 6);
  }, [snacks, normalizedQuery]);

  const combinedResults = useMemo(() => [
    ...filteredMovies.map((item) => ({ ...item, _type: "movie" })),
    ...filteredSnacks.map((item) => ({ ...item, _type: "snack" })),
  ], [filteredMovies, filteredSnacks]);

  /* Reset Selected Index when query changes */
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  /* Navigation Handler */
  const handleSelect = (item) => {
    if (!item) return;
    onClose();
    if (item._type === "movie" || item.title) {
      navigate(`/movie/${item._id}`);
    } else {
      navigate("/snacks");
    }
  };

  /* Keyboard Controls (Escape, Arrows, Enter) */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < combinedResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : combinedResults.length - 1
        );
      } else if (e.key === "Enter" && combinedResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(combinedResults[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, combinedResults, selectedIndex]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-20 p-4 spotlight-backdrop"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight Search"
    >
      <div className="bg-[#0F0F17] border border-cyan-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl spotlight-modal">
        {/* Input Header */}
        <div className="p-4 border-b border-gray-800/80 flex items-center gap-3 bg-[#0A0A0F]">
          <span className="text-xl text-cyan-400" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, genres, popcorn, beverages..."
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
            aria-label="Search movies and snacks"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl transition"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-gray-700 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-xs text-gray-500">Searching Xaviercinema directory...</p>
            </div>
          ) : (
            <>
              {/* Movies Section */}
              {filteredMovies.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-red-400">Movies</h4>
                    <span className="text-[10px] text-gray-500">{filteredMovies.length} found</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredMovies.map((movie, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <button
                          key={movie?._id}
                          type="button"
                          onClick={() => handleSelect({ ...movie, _type: "movie" })}
                          className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition border ${
                            isSelected
                              ? "bg-red-950/60 border-red-500 shadow-lg shadow-red-950/50"
                              : "bg-gray-950 border-gray-800/80 hover:bg-red-950/40 hover:border-red-800"
                          }`}
                        >
                          {movie?.poster ? (
                            <img
                              src={movie.poster}
                              alt={movie?.title || "Movie"}
                              className="w-10 h-14 object-cover rounded-xl border border-gray-800 shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center text-lg shrink-0">
                              🎬
                            </div>
                          )}
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{movie?.title || "Untitled Movie"}</h5>
                            <span className="text-[10px] text-red-400 font-semibold">{movie?.genre || "Movie"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Snacks Section */}
              {filteredSnacks.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400">CinePantry Snacks</h4>
                    <span className="text-[10px] text-gray-500">{filteredSnacks.length} found</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredSnacks.map((snack, idx) => {
                      const globalIndex = filteredMovies.length + idx;
                      const isSelected = selectedIndex === globalIndex;
                      return (
                        <button
                          key={snack?._id}
                          type="button"
                          onClick={() => handleSelect({ ...snack, _type: "snack" })}
                          className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition border ${
                            isSelected
                              ? "bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/50"
                              : "bg-gray-950 border-gray-800/80 hover:bg-amber-950/40 hover:border-amber-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg shrink-0" aria-hidden="true">🍿</span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">{snack?.name || "Snack"}</h5>
                              <span className="text-[10px] text-gray-400">{snack?.category || "Snacks"}</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-amber-400 shrink-0">
                            ₹{Number(snack?.price || 0).toLocaleString("en-IN")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {normalizedQuery && combinedResults.length === 0 && (
                <div className="py-8 text-center">
                  <div className="text-4xl mb-3">🔎</div>
                  <h3 className="text-sm font-bold text-white">No results found</h3>
                  <p className="text-xs text-gray-500 mt-1">Try searching for another movie, genre, or snack.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0A0A0F] border-t border-gray-800/80 flex items-center justify-between gap-3 text-[10px] text-gray-500">
          <span>Search Xaviercinema</span>
          <div className="flex items-center gap-2">
            <kbd className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">↑↓</kbd>
            <span>navigate</span>
            <kbd className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">↵</kbd>
            <span>select</span>
            <kbd className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
            <span>close</span>
          </div>
        </div>
      </div>
    </div>
  );
}