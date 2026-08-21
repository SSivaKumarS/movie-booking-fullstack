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
    API.post("/api/users/watchlist", { movieId })
      .then(() => {
        fetchWatchlist();
      })
      .catch((err) => {
        alert("Error updating watchlist: " + (err.response?.data?.message || err.message));
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-red-600/50" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Loading Saved Movies...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#07070B] min-h-screen text-white p-4 md:p-10 relative selection:bg-red-600 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black px-3 py-0.5 rounded-full uppercase">
                 My Personal Watchlist
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {watchlist.length} Saved Movie{watchlist.length === 1 ? "" : "s"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Saved Movies Gallery
            </h1>
            <p className="text-xs text-gray-400">
              Keep track of movies you plan to watch and book tickets in one click
            </p>
          </div>

          <Link
            to="/movies"
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition shadow-lg shadow-red-600/30 w-fit"
          >
            + Discover More Movies
          </Link>
        </div>

        {/* Watchlist Grid */}
        {watchlist.length === 0 ? (
          <div className="bg-[#0F0F17]/80 border border-gray-800/80 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-2xl">
            <div className="w-16 h-16 bg-red-600/20 border border-red-500/30 rounded-full flex items-center justify-center text-3xl mx-auto text-red-500">
              
            </div>
            <h2 className="text-base font-extrabold text-white">Your Watchlist is Empty</h2>
            <p className="text-xs text-gray-400">
              Click the heart icon on any movie poster while browsing to save it to your personal collection!
            </p>
            <Link
              to="/movies"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-2xl transition"
            >
              Browse Movies Now →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {watchlist.map((item) => {
              const movieObj = item._id ? item : { _id: item, title: "Saved Movie" };

              return (
                <div
                  key={movieObj._id}
                  className="bg-[#0F0F17]/90 border border-gray-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-red-500/50 transition group flex flex-col justify-between"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
                    {movieObj.poster ? (
                      <img
                        src={movieObj.poster}
                        alt={movieObj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        
                      </div>
                    )}

                    {/* Quick remove button */}
                    <button
                      onClick={() => removeMovie(movieObj._id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 border border-white/20 text-white hover:text-red-400 hover:bg-black transition flex items-center justify-center text-xs backdrop-blur-md shadow-lg"
                      title="Remove from Watchlist"
                    >
                      
                    </button>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-white truncate">
                        {movieObj.title}
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        {movieObj.genre || "Action / Drama"}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/movies/${movieObj._id}`)}
                      className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-red-600/30 text-center"
                    >
                      Book Tickets →
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
