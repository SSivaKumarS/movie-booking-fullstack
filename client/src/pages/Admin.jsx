import { useEffect, useState } from "react";
import API from "../api";
import AdminNavbar from "../components/AdminNavbar";

export default function Admin() {
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [movie, setMovie] = useState({
    title: "",
    description: "",
    duration: "",
    poster: "",
    genre: "",
    trailerUrl: "",
  });

  const [show, setShow] = useState({
    movieId: "",
    theatre: "",
    date: "",
    time: "",
    balconyPrice: 350,
    firstClassPrice: 250,
    secondClassPrice: 150,
  });

  // ── Load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    API.get("/api/movies").then((res) => setMovies(res.data)).catch(console.error);
    API.get("/api/shows").then((res) => setShows(res.data)).catch(console.error);
  }, []);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  // ── Add Movie ───────────────────────────────────────────────────────────
  const addMovie = async () => {
    if (!movie.title || !movie.poster) return flash("Title and Poster URL are required.");
    setLoading(true);
    try {
      await API.post("/api/movies", movie);
      const { data } = await API.get("/api/movies");
      setMovies(data);
      setMovie({ title: "", description: "", duration: "", poster: "", genre: "", trailerUrl: "" });
      flash("Movie added successfully!");
    } catch (err) {
      flash(err.response?.data?.message || "Failed to add movie");
    } finally {
      setLoading(false);
    }
  };

  // ── Add Show ────────────────────────────────────────────────────────────
  const addShow = async () => {
    if (!show.movieId || !show.theatre || !show.date || !show.time) {
      return flash("All show fields are required.");
    }
    setLoading(true);
    try {
      await API.post("/api/shows", show);
      const { data } = await API.get("/api/shows");
      setShows(data);
      setShow({ movieId: "", theatre: "", date: "", time: "", balconyPrice: 350, firstClassPrice: 250, secondClassPrice: 150 });
      flash("Show added successfully!");
    } catch (err) {
      flash(err.response?.data?.message || "Failed to add show");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete Movie ────────────────────────────────────────────────────────
  const deleteMovie = async (id) => {
    if (!window.confirm("Delete this movie?")) return;
    try {
      await API.delete(`/api/movies/${id}`);
      setMovies((prev) => prev.filter((m) => m._id !== id));
      flash("Movie deleted.");
    } catch {
      flash("Failed to delete movie.");
    }
  };

  // ── Delete Show ─────────────────────────────────────────────────────────
  const deleteShow = async (id) => {
    if (!window.confirm("Delete this show?")) return;
    try {
      await API.delete(`/api/shows/${id}`);
      setShows((prev) => prev.filter((s) => s._id !== id));
      flash("Show deleted.");
    } catch {
      flash("Failed to delete show.");
    }
  };

  const inputCls = "w-full bg-[#181B26] border border-[#262B3A] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30 placeholder-slate-500 transition-all";

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 selection:bg-red-500 selection:text-white">
      <AdminNavbar />

      <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-8 relative">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

        {/* Dashboard Header */}
        <div className="text-center space-y-2 relative z-10">
          <span className="inline-block bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
            Control Center
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Admin Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Manage movie listings, schedule shows, and cinema pricing
          </p>
        </div>

        {/* Flash Message */}
        {msg && (
          <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-700/80 text-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-center backdrop-blur-md shadow-lg transition-all animate-fade-in">
            {msg}
          </div>
        )}

        {/* ── FORMS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Add Movie Card */}
          <div className="bg-[#12141D]/90 border border-[#1F2430] p-6 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F2430]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Add New Movie
                </h2>
              </div>
              <div className="space-y-3">
                <input
                  name="title"
                  placeholder="Movie Title"
                  value={movie.title}
                  onChange={(e) => setMovie({ ...movie, title: e.target.value })}
                  className={inputCls}
                />
                <input
                  name="description"
                  placeholder="Description"
                  value={movie.description}
                  onChange={(e) => setMovie({ ...movie, description: e.target.value })}
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="duration"
                    placeholder="Duration (e.g. 2h 30m)"
                    value={movie.duration}
                    onChange={(e) => setMovie({ ...movie, duration: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    name="genre"
                    placeholder="Genre (e.g. Action)"
                    value={movie.genre}
                    onChange={(e) => setMovie({ ...movie, genre: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <input
                  name="poster"
                  placeholder="Poster Image URL"
                  value={movie.poster}
                  onChange={(e) => setMovie({ ...movie, poster: e.target.value })}
                  className={inputCls}
                />
                <input
                  name="trailerUrl"
                  placeholder="YouTube Trailer Link (URL)"
                  value={movie.trailerUrl}
                  onChange={(e) => setMovie({ ...movie, trailerUrl: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <button
              onClick={addMovie}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl transition text-xs shadow-lg shadow-red-600/20 active:scale-[0.99] mt-2"
            >
              {loading ? "Adding..." : "+ Add Movie"}
            </button>
          </div>

          {/* Add Show Card */}
          <div className="bg-[#12141D]/90 border border-[#1F2430] p-6 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F2430]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Schedule Show
                </h2>
              </div>
              <div className="space-y-3">
                <select
                  name="movieId"
                  value={show.movieId}
                  onChange={(e) => setShow({ ...show, movieId: e.target.value })}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="" className="bg-[#181B26]">Select Movie</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id} className="bg-[#181B26]">
                      {m.title}
                    </option>
                  ))}
                </select>
                <input
                  name="theatre"
                  placeholder="Theatre Name"
                  value={show.theatre}
                  onChange={(e) => setShow({ ...show, theatre: e.target.value })}
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="date"
                    value={show.date}
                    onChange={(e) => setShow({ ...show, date: e.target.value })}
                    className={`${inputCls} dark:[color-scheme:dark]`}
                  />
                  <input
                    name="time"
                    placeholder="Show Time (e.g. 7:00 PM)"
                    value={show.time}
                    onChange={(e) => setShow({ ...show, time: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block tracking-wider">
                    Ticket Tier Prices (₹)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Balcony ₹"
                      value={show.balconyPrice}
                      onChange={(e) => setShow({ ...show, balconyPrice: +e.target.value })}
                      className={inputCls}
                    />
                    <input
                      type="number"
                      placeholder="1st Class ₹"
                      value={show.firstClassPrice}
                      onChange={(e) => setShow({ ...show, firstClassPrice: +e.target.value })}
                      className={inputCls}
                    />
                    <input
                      type="number"
                      placeholder="2nd Class ₹"
                      value={show.secondClassPrice}
                      onChange={(e) => setShow({ ...show, secondClassPrice: +e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={addShow}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl transition text-xs shadow-lg shadow-emerald-600/20 active:scale-[0.99] mt-2"
            >
              {loading ? "Scheduling..." : "+ Schedule Show"}
            </button>
          </div>

        </div>

        {/* ── LISTS GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Movie List */}
          <div className="bg-[#12141D]/90 border border-[#1F2430] p-6 rounded-3xl shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2430]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                 Active Movies ({movies.length})
              </h2>
            </div>
            {movies.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">
                No movies available. Add one above.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {movies.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between bg-[#181B26] p-3 rounded-2xl border border-slate-800/60 hover:border-slate-700/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {m.poster && (
                        <img
                          src={m.poster}
                          alt={m.title}
                          className="w-10 h-14 object-cover rounded-xl border border-slate-700/50 shadow-sm"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      )}
                      <div>
                        <p className="font-bold text-slate-200 text-xs">{m.title}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {m.genre} · {m.duration}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMovie(m._id)}
                      className="bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Show List */}
          <div className="bg-[#12141D]/90 border border-[#1F2430] p-6 rounded-3xl shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2430]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                 Scheduled Shows ({shows.length})
              </h2>
            </div>
            {shows.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">
                No shows scheduled. Add one above.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {shows.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between bg-[#181B26] p-3.5 rounded-2xl border border-slate-800/60 hover:border-slate-700/80 transition-all"
                  >
                    <div>
                      <p className="font-bold text-slate-200 text-xs">{s.theatre}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {s.date} · <span className="text-emerald-400 font-medium">{s.time}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => deleteShow(s._id)}
                      className="bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}