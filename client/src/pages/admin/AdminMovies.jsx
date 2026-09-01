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
    <div className="bg-[#090a0f] min-h-screen text-slate-100 pb-24 font-sans selection:bg-red-500 selection:text-white">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Movie Studio & Control Center</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage cinema inventory, poster assets, and in-app embedded YouTube trailers.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-2xl text-center shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total Movies</span>
              <span className="text-2xl font-black text-white">{movies.length}</span>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-2xl text-center shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">With Trailers</span>
              <span className="text-2xl font-black text-red-500">
                {movies.filter((m) => !!m.trailerUrl).length}
              </span>
            </div>
          </div>
        </div>

        {/* MOVIE ADD/EDIT FORM CONTAINER */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl mb-12 border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              {editId ? "Edit Movie Details" : "Add New Movie"}
            </h2>
            {editId && (
              <button
                onClick={resetForm}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl border border-white/10 transition"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Movie Title *</label>
                  <input
                    placeholder="e.g. Inception"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Genre</label>
                  <input
                    placeholder="e.g. Sci-Fi"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                  />
                </div>
              </div>

              {/* Quick Genre Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-bold mr-1">Quick Select:</span>
                {predefinedGenres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className="text-[11px] bg-slate-950 hover:bg-red-950/50 border border-white/10 hover:border-red-500/50 text-slate-400 hover:text-red-400 px-2.5 py-1 rounded-xl transition"
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Poster Image URL *</label>
                  <input
                    placeholder="https://..."
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                    className="w-full p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">YouTube Trailer URL</label>
                <input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  className="w-full p-3.5 bg-slate-950/80 border border-red-500/40 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Movie Synopsis</label>
                <textarea
                  placeholder="Write a brief overview of the plot..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition resize-none"
                />
              </div>

              <button
                onClick={saveMovie}
                className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-extrabold rounded-2xl transition shadow-lg shadow-red-600/25 text-sm py-4 tracking-wide"
              >
                {editId ? "Update Movie Entry" : "Save & Publish Movie"}
              </button>
            </div>

            {/* Embedded Live Preview */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/90 border border-white/10 p-5 rounded-2xl space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    Live Trailer Preview
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {trailerUrl ? "Valid Stream" : "Awaiting Input"}
                  </span>
                </div>

                {previewEmbedUrl ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-red-500/30 bg-black shadow-2xl">
                    <iframe
                      src={previewEmbedUrl}
                      title="Trailer Live Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="aspect-video border border-dashed border-slate-800 rounded-2xl flex items-center justify-center p-6 text-center text-xs text-slate-500">
                    Paste a YouTube link into the field to preview the trailer player stream.
                  </div>
                )}
              </div>

              {/* Dynamic Quick Info */}
              <div className="pt-4 border-t border-white/5 space-y-1.5">
                <span className="text-[11px] text-slate-400 block font-semibold">Metadata Summary:</span>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-300">
                    Title: <strong className="text-white">{title || "—"}</strong>
                  </span>
                  <span className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-300">
                    Genre: <strong className="text-white">{genre || "—"}</strong>
                  </span>
                  <span className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-300">
                    Runtime: <strong className="text-white">{duration ? formatDuration(duration) : "—"}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <input
            placeholder="Search catalog by title or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-3.5 bg-slate-900/80 border border-white/10 rounded-2xl w-full md:w-80 text-sm text-white focus:outline-none focus:border-red-500 transition shadow-inner"
          />

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 custom-scrollbar">
            <button
              onClick={() => setSelectedGenreFilter("All")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                selectedGenreFilter === "All"
                  ? "bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30"
                  : "bg-slate-900/80 border-white/10 text-slate-400 hover:text-white"
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                    selectedGenreFilter === g
                      ? "bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30"
                      : "bg-slate-900/80 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {g} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* MOVIE GRID CATALOG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((m) => {
            const hasTrailer = !!m.trailerUrl;

            return (
              <div
                key={m._id}
                className="group relative rounded-3xl overflow-hidden bg-slate-900/80 border border-white/10 flex flex-col justify-between shadow-xl hover:border-slate-700 transition duration-300"
              >
                {/* Poster Box */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={m.poster}
                    alt={m.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black tracking-wider text-white bg-red-600/90 backdrop-blur-md px-2.5 py-1 rounded-lg uppercase shadow">
                        {m.genre}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                        ⏱ {formatDuration(m.duration)}
                      </span>
                    </div>

                    {hasTrailer && (
                      <button
                        onClick={() => setActiveTrailer({ url: m.trailerUrl, title: m.title })}
                        className="self-center bg-red-600/90 hover:bg-red-600 text-white font-extrabold text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-md hover:scale-105 transition"
                      >
                        <span>▶</span> Watch Trailer
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Details & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white truncate" title={m.title}>{m.title}</h3>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {m.description || "No description available."}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleEdit(m)}
                      className="flex-1 bg-amber-400 hover:bg-amber-500 px-3 py-2 rounded-xl text-slate-950 text-xs font-black transition text-center shadow-md"
                    >
                      Edit
                    </button>

                    {hasTrailer && (
                      <button
                        onClick={() => setActiveTrailer({ url: m.trailerUrl, title: m.title })}
                        className="bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-400 px-3 py-2 rounded-xl text-xs font-bold transition"
                        title="Play Trailer In-App"
                      >
                        ▶
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteId(m._id)}
                      className="bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* IN-APP TRAILER MODAL FOR GRID CARDS */}
        {activeTrailer && (
          <TrailerModal
            isOpen={!!activeTrailer}
            onClose={() => setActiveTrailer(null)}
            trailerUrl={activeTrailer.url}
            movieTitle={activeTrailer.title}
          />
        )}

        {/* CONFIRM DELETE MODAL */}
        {deleteId && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-slate-900 border border-red-500/30 p-6 sm:p-8 rounded-3xl text-center space-y-4 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center text-xl mx-auto font-black">
                !
              </div>
              <h3 className="text-xl font-black text-white">Delete Movie?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This action cannot be undone. Associated showtimes and platform configurations will be affected.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={deleteMovie}
                  className="flex-1 bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl text-white font-bold text-xs transition shadow-lg shadow-red-600/30"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-xl text-slate-300 font-bold text-xs border border-white/10 transition"
                >
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