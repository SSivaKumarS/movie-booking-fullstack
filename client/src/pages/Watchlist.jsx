import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Watchlist() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = () => {
    API.get("/api/users/watchlist")
      .then((res) => {
        setWatchlist(res.data || []);
      })
      .catch((err) => {
        console.log("Error loading watchlist:", err);
        setWatchlist([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const removeMovie = (movieId) => {
    // Optimistic UI update for instant feel
    setWatchlist((prev) => prev.filter((item) => (item._id || item) !== movieId));

    API.post("/api/users/watchlist", { movieId })
      .catch((err) => {
        alert("Error updating watchlist: " + (err.response?.data?.message || err.message));
        fetchWatchlist(); // Rollback on error
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-white flex flex-col items-center justify-center space-y-4">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <div className="w-8 h-8 border-4 border-indigo-500/20 border-b-indigo-400 rounded-full animate-spin" />
        </div>
        <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Retrieving Collection...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#090A0F] min-h-screen text-slate-100 p-4 sm:p-6 md:p-10 relative overflow-hidden selection:bg-cyan-500 selection:text-black font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 border border-slate-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Saved Media
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {watchlist.length} {watchlist.length === 1 ? "Title" : "Titles"} Stored
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              My Watchlist
            </h1>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Your curated queue of upcoming films. Reserve seats instantly or remove items from your collection.
            </p>
          </div>

          <Link
            to="/movies"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 w-fit"
          >
            <span>+</span> Discover Catalog
          </Link>
        </div>

        {/* Empty State */}
        {watchlist.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-5 max-w-md mx-auto backdrop-blur-md shadow-2xl">
            <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/60 rounded-2xl flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Your queue is empty</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Save movies here to build your personalized watch history and book tickets easily.
              </p>
            </div>
            <Link
              to="/movies"
              className="inline-block bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold text-xs px-6 py-3 rounded-xl transition-all"
            >
              Explore Movies →
            </Link>
          </div>
        ) : (
          /* Movie Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
            {watchlist.map((item) => {
              const movieObj = item._id ? item : { _id: item, title: "Saved Movie" };

              return (
                <div
                  key={movieObj._id}
                  className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition-all duration-300 group flex flex-col justify-between backdrop-blur-sm"
                >
                  {/* Poster Area */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                    {movieObj.poster ? (
                      <img
                        src={movieObj.poster}
                        alt={movieObj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 4v16M17 4v16M3 8h18M3 16h18" />
                        </svg>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Remove Action Button */}
                    <button
                      onClick={() => removeMovie(movieObj._id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-slate-950/80 border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/40 transition-all flex items-center justify-center text-xs backdrop-blur-md shadow-md active:scale-90"
                      title="Remove from Watchlist"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Movie Info & CTA */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                        {movieObj.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {movieObj.genre || "Action • Sci-Fi"}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/movies/${movieObj._id}`)}
                      className="w-full bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 font-bold text-xs py-2.5 rounded-xl border border-slate-700/60 hover:border-cyan-400 transition-all shadow-md text-center active:scale-95"
                    >
                      Book Show
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}