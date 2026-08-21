import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function SpotlightSearch({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     FETCH SEARCH DATA
  ========================================================= */

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

        const movieData = Array.isArray(movieResponse?.data)
          ? movieResponse.data
          : [];

        const snackData = Array.isArray(snackResponse?.data)
          ? snackResponse.data
          : [];

        setMovies(movieData);
        setSnacks(snackData);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSearchData();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  /* =========================================================
     RESET SEARCH WHEN CLOSED
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  /* =========================================================
     KEYBOARD SHORTCUTS
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  /* =========================================================
     SEARCH QUERY
  ========================================================= */

  const normalizedQuery = query.trim().toLowerCase();

  /* =========================================================
     FILTER MOVIES
  ========================================================= */

  const filteredMovies = useMemo(() => {
    if (!normalizedQuery) {
      return movies;
    }

    return movies.filter((movie) => {
      const title = String(movie?.title || "").toLowerCase();

      const genre = String(movie?.genre || "").toLowerCase();

      return (
        title.includes(normalizedQuery) ||
        genre.includes(normalizedQuery)
      );
    });
  }, [movies, normalizedQuery]);

  /* =========================================================
     FILTER SNACKS
  ========================================================= */

  const filteredSnacks = useMemo(() => {
    if (!normalizedQuery) {
      return snacks;
    }

    return snacks.filter((snack) => {
      const name = String(snack?.name || "").toLowerCase();

      const category = String(
        snack?.category || ""
      ).toLowerCase();

      return (
        name.includes(normalizedQuery) ||
        category.includes(normalizedQuery)
      );
    });
  }, [snacks, normalizedQuery]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const openMovie = (movieId) => {
    if (!movieId) return;

    onClose();

    navigate(`/movie/${movieId}`);
  };

  const openSnacks = () => {
    onClose();

    navigate("/snacks");
  };

  /* =========================================================
     CLOSE WHEN CLICKING BACKDROP
  ========================================================= */

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  /* =========================================================
     DO NOT RENDER
  ========================================================= */

  if (!isOpen) {
    return null;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-start justify-center pt-16 sm:pt-20 p-4 animate-fadeIn"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight Search"
    >
      <div className="bg-[#0F0F17] border border-cyan-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-modalScaleIn">

        {/* =====================================================
            SEARCH HEADER
        ===================================================== */}

        <div className="p-4 border-b border-gray-800/80 flex items-center gap-3 bg-[#0A0A0F]">

          <span
            className="text-xl text-cyan-400"
            aria-hidden="true"
          >
            🔍
          </span>

          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies, genres, popcorn, beverages..."
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
            aria-label="Search movies and snacks"
          />

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl transition"
            aria-label="Close search"
          >
            ESC
          </button>
        </div>

        {/* =====================================================
            RESULTS BODY
        ===================================================== */}

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 custom-scrollbar">

          {/* LOADING */}

          {loading ? (
            <div className="py-12 text-center">

              <div className="w-8 h-8 mx-auto mb-3 border-2 border-gray-700 border-t-cyan-400 rounded-full animate-spin" />

              <p className="text-xs text-gray-500">
                Searching Xaviercinema directory...
              </p>

            </div>
          ) : (
            <>
              {/* =================================================
                  MOVIES
              ================================================= */}

              <section>

                <div className="flex items-center justify-between mb-3">

                  <h4 className="text-[11px] font-black uppercase tracking-wider text-red-400">
                    Movies
                  </h4>

                  <span className="text-[10px] text-gray-500">
                    {filteredMovies.length} found
                  </span>

                </div>

                {filteredMovies.length === 0 ? (
                  <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-5 text-center">
                    <div className="text-2xl mb-2">
                      🎬
                    </div>

                    <p className="text-xs text-gray-500">
                      No matching movies found.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                    {filteredMovies
                      .slice(0, 6)
                      .map((movie) => (
                        <button
                          key={movie?._id}
                          type="button"
                          onClick={() =>
                            openMovie(movie?._id)
                          }
                          className="w-full text-left bg-gray-950 hover:bg-red-950/40 border border-gray-800/80 hover:border-red-800 p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition"
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

                            <h5 className="text-xs font-bold text-white truncate">
                              {movie?.title ||
                                "Untitled Movie"}
                            </h5>

                            <span className="text-[10px] text-red-400 font-semibold">
                              {movie?.genre ||
                                "Movie"}
                            </span>

                          </div>

                        </button>
                      ))}

                  </div>
                )}

              </section>

              {/* =================================================
                  SNACKS
              ================================================= */}

              <section>

                <div className="flex items-center justify-between mb-3">

                  <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                    CinePantry Snacks
                  </h4>

                  <span className="text-[10px] text-gray-500">
                    {filteredSnacks.length} found
                  </span>

                </div>

                {filteredSnacks.length === 0 ? (
                  <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-5 text-center">

                    <div className="text-2xl mb-2">
                      🍿
                    </div>

                    <p className="text-xs text-gray-500">
                      No matching snacks found.
                    </p>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                    {filteredSnacks
                      .slice(0, 6)
                      .map((snack) => (
                        <button
                          key={snack?._id}
                          type="button"
                          onClick={openSnacks}
                          className="w-full text-left bg-gray-950 hover:bg-amber-950/40 border border-gray-800/80 hover:border-amber-800 p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition"
                        >

                          <div className="flex items-center gap-2 min-w-0">

                            <span
                              className="text-lg shrink-0"
                              aria-hidden="true"
                            >
                              🍿
                            </span>

                            <div className="min-w-0">

                              <h5 className="text-xs font-bold text-white truncate">
                                {snack?.name ||
                                  "Snack"}
                              </h5>

                              <span className="text-[10px] text-gray-400">
                                {snack?.category ||
                                  "Snacks"}
                              </span>

                            </div>

                          </div>

                          <span className="text-xs font-black text-amber-400 shrink-0">
                            ₹
                            {Number(snack?.price || 0).toLocaleString(
                              "en-IN"
                            )}
                          </span>

                        </button>
                      ))}

                  </div>
                )}

              </section>

              {/* =================================================
                  NO RESULTS
              ================================================= */}

              {normalizedQuery &&
                filteredMovies.length === 0 &&
                filteredSnacks.length === 0 && (
                  <div className="py-5 text-center">

                    <div className="text-4xl mb-3">
                      🔎
                    </div>

                    <h3 className="text-sm font-bold text-white">
                      No results found
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      Try searching for another movie,
                      genre or snack.
                    </p>

                  </div>
                )}

            </>
          )}
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="p-3 bg-[#0A0A0F] border-t border-gray-800/80 flex items-center justify-between gap-3 text-[10px] text-gray-500">

          <span>
            Search Xaviercinema
          </span>

          <div className="flex items-center gap-2">

            <kbd className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>

            <span>to close</span>

          </div>

        </div>

      </div>
    </div>
  );
}