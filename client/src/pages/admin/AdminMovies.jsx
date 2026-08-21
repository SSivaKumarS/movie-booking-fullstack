import { useEffect, useState } from "react";
import API from "../../api";
import TrailerModal, { getYouTubeEmbedUrl } from "../../components/TrailerModal";
import AdminNavbar from "../../components/AdminNavbar";

function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGenreFilter, setSelectedGenreFilter] = useState("All");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [poster, setPoster] = useState("");
  const [genre, setGenre] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");

  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // In-app Trailer Modal state for grid cards
  const [activeTrailer, setActiveTrailer] = useState(null);

  const predefinedGenres = [
    "Action",
    "Sci-Fi",
    "Drama",
    "Comedy",
    "Thriller",
    "Horror",
    "Romance",
    "Animation",
  ];

  /* FETCH MOVIES */
  const fetchMovies = async () => {
    try {
      const res = await API.get("/api/movies");
      setMovies(res.data || []);
    } catch (err) {
      console.log("Fetch movies error:", err);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  /* SAVE / UPDATE MOVIE */
  const saveMovie = async () => {
    if (!title.trim() || !poster.trim()) {
      return alert("Title and Poster URL are required!");
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        duration: Number(duration) || 120,
        poster: poster.trim(),
        genre: genre.trim() || "Action",
        trailerUrl: trailerUrl.trim(),
      };

      if (editId) {
        await API.put(`/api/movies/${editId}`, payload);
        setEditId(null);
      } else {
        await API.post("/api/movies", payload);
      }

      resetForm();
      fetchMovies();
    } catch (err) {
      console.log("Save movie error:", err);
      alert("Error saving movie: " + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDuration("");
    setPoster("");
    setGenre("");
    setTrailerUrl("");
    setEditId(null);
  };

  /* EDIT HANDLER */
  const handleEdit = (m) => {
    setEditId(m._id);
    setTitle(m.title || "");
    setDescription(m.description || "");
    setDuration(m.duration || "");
    setPoster(m.poster || "");
    setGenre(m.genre || "");
    setTrailerUrl(m.trailerUrl || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* DELETE HANDLER */
  const deleteMovie = async () => {
    try {
      await API.delete(`/api/movies/${deleteId}`);
      setDeleteId(null);
      fetchMovies();
    } catch (err) {
      console.log("Delete movie error:", err);
      alert("Error deleting movie: " + (err.response?.data?.message || err.message));
    }
  };

  // Format duration
  const formatDuration = (mins) => {
    if (!mins) return "N/A";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const filteredMovies = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.genre.toLowerCase().includes(search.toLowerCase());
    const matchesGenre =
      selectedGenreFilter === "All" ||
      m.genre.toLowerCase() === selectedGenreFilter.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  const previewEmbedUrl = getYouTubeEmbedUrl(trailerUrl);

  return (
    <div className="bg-[#05050A] min-h-screen text-white pb-24">
      <AdminNavbar />
      <div className="p-6 md:p-10">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
            <span>🎬 Movie Control Center & Trailer Studio</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Add movies with custom YouTube trailer links that play in-app for visitors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Movies</span>
            <span className="text-lg font-bold text-white">{movies.length}</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">With Trailers</span>
            <span className="text-lg font-bold text-red-500">
              {movies.filter((m) => !!m.trailerUrl).length}
            </span>
          </div>
        </div>
      </div>

      {/* MOVIE ADD/EDIT FORM WITH DEDICATED TRAILER LINK BOX */}
      <div className="max-w-7xl mx-auto bg-gradient-to-br from-[#0f172a] to-[#020617] p-6 md:p-8 rounded-3xl mb-10 shadow-2xl border border-gray-800 space-y-6">
        
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{editId ? "Edit Movie Details" : " Add New Movie"}</span>
          </h2>
          {editId && (
            <button
              onClick={resetForm}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-3 py-1.5 rounded-xl transition"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Inputs Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            placeholder="Movie Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-3.5 bg-[#020617] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition"
          />

          <input
            placeholder="Genre (e.g. Action)"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="p-3.5 bg-[#020617] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition"
          />

          <input
            type="number"
            placeholder="Duration (mins)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="p-3.5 bg-[#020617] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition"
          />

          <input
            placeholder="Poster Image URL *"
            value={poster}
            onChange={(e) => setPoster(e.target.value)}
            className="p-3.5 bg-[#020617] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition"
          />

          {/*  YouTube Trailer Link Input Box */}
          <input
            placeholder=" YouTube Trailer Link (URL)"
            value={trailerUrl}
            onChange={(e) => setTrailerUrl(e.target.value)}
            className="p-3.5 bg-[#020617] border border-red-500/50 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition font-mono shadow-inner"
          />

          <button
            onClick={saveMovie}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl transition shadow-lg shadow-red-600/30 text-sm py-3.5"
          >
            {editId ? "Update Movie" : "Add Movie"}
          </button>
        </div>

        {/* Quick Genre Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-gray-500 font-bold mr-1">Quick Genre:</span>
          {predefinedGenres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className="text-[11px] bg-gray-900 hover:bg-red-950/60 border border-gray-800 hover:border-red-800 text-gray-300 hover:text-red-400 px-2.5 py-1 rounded-xl transition"
            >
              {g}
            </button>
          ))}
        </div>

        {/* Row 2: Description */}
        <textarea
          placeholder="Movie Synopsis / Description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="2"
          className="w-full p-4 bg-[#020617] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition"
        />

        {/* Row 3: Embedded Live YouTube Player Preview Box */}
        <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <span></span> Live Embedded Trailer Preview Box (Plays In-App)
            </span>
            <span className="text-[10px] text-gray-400">
              {trailerUrl ? "YouTube Link Detected" : "Paste YouTube URL above to preview"}
            </span>
          </div>

          {previewEmbedUrl ? (
            <div className="relative aspect-video max-w-xl mx-auto rounded-2xl overflow-hidden border border-red-500/40 bg-black shadow-2xl">
              <iframe
                src={previewEmbedUrl}
                title="Trailer Live Preview"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-gray-800 rounded-xl text-center text-xs text-gray-500">
               Paste a YouTube link in the <span className="text-red-400 font-bold">🎬 YouTube Trailer Link</span> box above to test the trailer player right here inside the app!
            </div>
          )}
        </div>

      </div>

      {/*  SEARCH BAR */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <input
          placeholder="🔍 Search Movies by Title or Genre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3.5 bg-[#020617] border border-gray-800 rounded-2xl w-full sm:w-80 text-sm text-white focus:outline-none focus:border-red-500 transition"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedGenreFilter("All")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedGenreFilter === "All"
                ? "bg-red-600 text-white shadow-md"
                : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            All ({movies.length})
          </button>
          {predefinedGenres.map((g) => {
            const count = movies.filter((m) => m.genre.toLowerCase() === g.toLowerCase()).length;
            return (
              <button
                key={g}
                onClick={() => setSelectedGenreFilter(g)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedGenreFilter === g
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {g} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/*  MOVIE GRID CATALOG */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {filteredMovies.map((m) => {
          const hasTrailer = !!m.trailerUrl;

          return (
            <div
              key={m._id}
              className="relative group rounded-2xl overflow-hidden shadow-2xl bg-[#020617] border border-gray-800 flex flex-col justify-between"
            >
              {/* Poster */}
              <div className="relative h-[280px] w-full overflow-hidden">
                <img
                  src={m.poster}
                  alt={m.title}
                  className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white bg-red-600/90 px-2 py-0.5 rounded shadow">
                      {m.genre}
                    </span>
                    <span className="text-[10px] font-bold text-green-400 bg-black/60 px-2 py-0.5 rounded border border-gray-800">
                      ⏱ {formatDuration(m.duration)}
                    </span>
                  </div>

                  {/*  Watch Trailer Button */}
                  {hasTrailer && (
                    <button
                      onClick={() => setActiveTrailer({ url: m.trailerUrl, title: m.title })}
                      className="self-center bg-red-600/90 hover:bg-red-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-xl backdrop-blur-md hover:scale-105 transition"
                    >
                      <span>▶</span> Watch Trailer
                    </button>
                  )}
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h2 className="text-base font-bold text-white truncate">{m.title}</h2>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{m.description || "No description."}</p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-800/80">
                  <button
                    onClick={() => handleEdit(m)}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 px-3 py-1.5 rounded text-black text-xs font-bold transition text-center"
                  >
                    Edit
                  </button>

                  {hasTrailer && (
                    <button
                      onClick={() => setActiveTrailer({ url: m.trailerUrl, title: m.title })}
                      className="bg-red-950/80 border border-red-800 text-red-400 px-2.5 py-1.5 rounded text-xs font-bold transition"
                      title="Play Trailer In-App"
                    >
                      ▶
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteId(m._id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-white text-xs font-bold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/*  IN-APP TRAILER MODAL FOR GRID CARDS */}
      {activeTrailer && (
        <TrailerModal
          isOpen={!!activeTrailer}
          onClose={() => setActiveTrailer(null)}
          trailerUrl={activeTrailer.url}
          movieTitle={activeTrailer.title}
        />
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-[#0f172a] border border-red-500/40 p-8 rounded-3xl text-center space-y-4 max-w-sm w-full shadow-2xl animate-modalScaleIn">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center text-xl mx-auto">
              🎬
            </div>
            <h2 className="text-lg font-extrabold text-white">Delete this movie?</h2>
            <p className="text-xs text-gray-400">All associated showtimes and bookings will be updated.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={deleteMovie} className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-2xl text-white font-bold text-xs transition shadow-lg shadow-red-600/30">
                Confirm Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-2.5 rounded-2xl text-white font-bold text-xs transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default AdminMovies;
