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
      flash(" Movie added successfully!");
    } catch (err) {
      flash(" " + (err.response?.data?.message || "Failed to add movie"));
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
      flash(" Show added successfully!");
    } catch (err) {
      flash(" " + (err.response?.data?.message || "Failed to add show"));
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

  const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 placeholder-gray-500";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AdminNavbar />
      <div className="p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-2 text-center">🎬 Admin Dashboard</h1>
      <p className="text-center text-gray-400 mb-8">Manage movies and shows</p>

      {/* Flash Message */}
      {msg && (
        <div className="max-w-5xl mx-auto mb-6 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm text-center">
          {msg}
        </div>
      )}

      {/* ── Forms ── */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

        {/* Add Movie */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-5 text-red-400">➕ Add Movie</h2>
          <div className="space-y-3">
            <input name="title" placeholder="Movie Title" value={movie.title}
              onChange={(e) => setMovie({ ...movie, title: e.target.value })} className={inputCls} />
            <input name="description" placeholder="Description" value={movie.description}
              onChange={(e) => setMovie({ ...movie, description: e.target.value })} className={inputCls} />
            <input name="duration" placeholder="Duration (e.g. 2h 30m)" value={movie.duration}
              onChange={(e) => setMovie({ ...movie, duration: e.target.value })} className={inputCls} />
            <input name="poster" placeholder="Poster Image URL" value={movie.poster}
              onChange={(e) => setMovie({ ...movie, poster: e.target.value })} className={inputCls} />
            <input name="genre" placeholder="Genre (e.g. Action, Drama)" value={movie.genre}
              onChange={(e) => setMovie({ ...movie, genre: e.target.value })} className={inputCls} />
            <input name="trailerUrl" placeholder=" YouTube Trailer Link (URL)" value={movie.trailerUrl}
              onChange={(e) => setMovie({ ...movie, trailerUrl: e.target.value })} className={inputCls} />
            <button onClick={addMovie} disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-semibold py-2.5 rounded-lg transition">
              {loading ? "Adding..." : "Add Movie"}
            </button>
          </div>
        </div>

        {/* Add Show */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-5 text-shadow-green-60000"> Add Show</h2>
          <div className="space-y-3">
            <select name="movieId" value={show.movieId}
              onChange={(e) => setShow({ ...show, movieId: e.target.value })} className={inputCls}>
              <option value="">Select Movie</option>
              {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
            <input name="theatre" placeholder="Theatre Name" value={show.theatre}
              onChange={(e) => setShow({ ...show, theatre: e.target.value })} className={inputCls} />
            <input type="date" name="date" value={show.date}
              onChange={(e) => setShow({ ...show, date: e.target.value })} className={inputCls} />
            <input name="time" placeholder="Show Time (e.g. 7:00 PM)" value={show.time}
              onChange={(e) => setShow({ ...show, time: e.target.value })} className={inputCls} />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="Balcony ₹" value={show.balconyPrice}
                onChange={(e) => setShow({ ...show, balconyPrice: +e.target.value })} className={inputCls} />
              <input type="number" placeholder="1st Class ₹" value={show.firstClassPrice}
                onChange={(e) => setShow({ ...show, firstClassPrice: +e.target.value })} className={inputCls} />
              <input type="number" placeholder="2nd Class ₹" value={show.secondClassPrice}
                onChange={(e) => setShow({ ...show, secondClassPrice: +e.target.value })} className={inputCls} />
            </div>
            <button onClick={addShow} disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-semibold py-2.5 rounded-lg transition">
              {loading ? "Adding..." : "Add Show"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Movie List ── */}
      <div className="max-w-5xl mx-auto bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-semibold mb-4">🎬 Movies ({movies.length})</h2>
        {movies.length === 0 ? (
          <p className="text-gray-500 text-sm">No movies yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {movies.map((m) => (
              <div key={m._id} className="flex items-center justify-between border-b border-gray-800 py-2">
                <div className="flex items-center gap-3">
                  {m.poster && <img src={m.poster} alt={m.title} className="w-10 h-14 object-cover rounded" onError={(e) => (e.target.style.display = "none")} />}
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-gray-400 text-xs">{m.genre} · {m.duration}</p>
                  </div>
                </div>
                <button onClick={() => deleteMovie(m._id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 text-sm rounded-lg transition">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Show List ── */}
      <div className="max-w-5xl mx-auto bg-gray-900 border border-gray-800 p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-4">🎭 Shows ({shows.length})</h2>
        {shows.length === 0 ? (
          <p className="text-gray-500 text-sm">No shows yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {shows.map((s) => (
              <div key={s._id} className="flex items-center justify-between border-b border-gray-800 py-2">
                <div>
                  <p className="font-medium">{s.theatre}</p>
                  <p className="text-gray-400 text-xs">{s.date} · {s.time}</p>
                </div>
                <button onClick={() => deleteShow(s._id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 text-sm rounded-lg transition">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
          {/* ── Show List ── */}
      <div className="max-w-5xl mx-auto bg-gray-900 border border-gray-800 p-6 rounded-2xl">
        ...
      </div>
    </div>
  );
}