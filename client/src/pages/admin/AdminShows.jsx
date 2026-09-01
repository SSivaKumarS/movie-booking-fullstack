import React, { useEffect, useState } from "react";
import API from "../../api";
import AdminNavbar from "../../components/AdminNavbar";

function AdminShows() {
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [movieId, setMovieId] = useState("");
  const [theatre, setTheatre] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [balconyPrice, setBalconyPrice] = useState("");
  const [firstPrice, setFirstPrice] = useState("");
  const [secondPrice, setSecondPrice] = useState("");

  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------- FETCH DATA ---------- */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [movieRes, showRes] = await Promise.all([
        API.get("/api/movies"),
        API.get("/api/shows"),
      ]);
      setMovies(movieRes.data || []);
      setShows(showRes.data || []);
    } catch (err) {
      console.error("Fetch shows error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------- RESET FORM ---------- */
  const resetForm = () => {
    setMovieId("");
    setTheatre("");
    setDate("");
    setTime("");
    setBalconyPrice("");
    setFirstPrice("");
    setSecondPrice("");
    setEditId(null);
  };

  /* ---------- SAVE SHOW ---------- */
  const saveShow = async () => {
    if (
      !movieId ||
      !theatre.trim() ||
      !date.trim() ||
      !time.trim() ||
      balconyPrice === "" ||
      firstPrice === "" ||
      secondPrice === ""
    ) {
      alert("Please fill all required show parameters and seat pricing fields.");
      return;
    }

    try {
      const payload = {
        movieId,
        theatre: theatre.trim(),
        date: date.trim(),
        time: time.trim(),
        balconyPrice: Number(balconyPrice) || 0,
        firstClassPrice: Number(firstPrice) || 0,
        secondClassPrice: Number(secondPrice) || 0,
      };

      if (editId) {
        await API.put(`/api/shows/${editId}`, payload);
      } else {
        await API.post("/api/shows", payload);
      }

      resetForm();
      fetchData();
    } catch (err) {
      console.error("Save show error:", err);
      alert("Error saving show: " + (err.response?.data?.message || err.message));
    }
  };

  /* ---------- EDIT SHOW ---------- */
  const handleEdit = (s) => {
    setEditId(s._id);
    setMovieId(s.movieId?._id || s.movieId || "");
    setTheatre(s.theatre || "");
    setDate(s.date || "");
    setTime(s.time || "");
    setBalconyPrice(s.balconyPrice || "");
    setFirstPrice(s.firstClassPrice || "");
    setSecondPrice(s.secondClassPrice || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- DELETE SHOW ---------- */
  const deleteShow = async () => {
    try {
      await API.delete(`/api/shows/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error("Delete show error:", err);
      alert("Error deleting show: " + (err.response?.data?.message || err.message));
    }
  };

  const selectedMovieObj = movies.find((m) => m._id === movieId);

  const filteredShows = shows.filter((s) => {
    const movieTitle = s.movieId?.title?.toLowerCase() || "";
    const theatreName = s.theatre?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return movieTitle.includes(query) || theatreName.includes(query);
  });

  return (
    <div className="bg-[#05050A] min-h-screen text-slate-100 font-sans antialiased relative selection:bg-rose-500 selection:text-white">
      <AdminNavbar />

      <div className="p-4 md:p-8 lg:p-12 relative max-w-7xl mx-auto space-y-8">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Header Bar */}
        <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D0D15]/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Theatre Operational Console
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Manage Multiplex Showtimes
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Schedule movie showtimes, set seat class pricing, and manage live auditorium availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#05050A] border border-slate-800 px-4 py-2.5 rounded-2xl text-center shadow-inner">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Scheduled</span>
              <span className="text-lg font-black text-white">{shows.length}</span>
            </div>
            <div className="bg-[#05050A] border border-slate-800 px-4 py-2.5 rounded-2xl text-center shadow-inner">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Movies</span>
              <span className="text-lg font-black text-rose-400">{movies.length}</span>
            </div>
          </div>
        </header>

        {/* Form Card */}
        <section className="relative z-10 bg-[#0D0D15]/80 border border-slate-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>{editId ? "Edit Showtime Configuration" : "Schedule New Showtime"}</span>
            </h2>
            {editId && (
              <button
                onClick={resetForm}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3.5 py-1.5 rounded-xl transition-all border border-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Select Movie */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                1. Select Movie *
              </label>
              <select
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition cursor-pointer"
              >
                <option value="">-- Choose Movie --</option>
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.genre || "Action"})
                  </option>
                ))}
              </select>
            </div>

            {/* Theatre Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                2. Multiplex / Screen *
              </label>
              <input
                type="text"
                placeholder="e.g. PVR Inox Screen 1, IMAX 4K"
                value={theatre}
                onChange={(e) => setTheatre(e.target.value)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition placeholder:text-slate-500"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                3. Show Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                4. Show Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Balcony Class (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 350"
                value={balconyPrice}
                onChange={(e) => setBalconyPrice(e.target.value)}
                className="w-full bg-[#05050A] border border-amber-500/30 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 transition placeholder:text-slate-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                First Class (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 250"
                value={firstPrice}
                onChange={(e) => setFirstPrice(e.target.value)}
                className="w-full bg-[#05050A] border border-cyan-500/30 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Second Class (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 150"
                value={secondPrice}
                onChange={(e) => setSecondPrice(e.target.value)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition placeholder:text-slate-500 font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={saveShow}
                className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-2xl transition shadow-lg shadow-rose-600/20 active:scale-[0.98]"
              >
                {editId ? "Save Changes" : "Publish Showtime"}
              </button>
            </div>
          </div>

          {/* Selected Movie Preview Card */}
          {selectedMovieObj && (
            <div className="p-4 bg-[#05050A] border border-slate-800 rounded-2xl flex items-center gap-4">
              <img
                src={selectedMovieObj.poster}
                alt=""
                className="w-12 h-16 object-cover rounded-xl border border-slate-800 shrink-0"
              />
              <div>
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Target Movie Selected
                </div>
                <h4 className="text-sm font-bold text-white">{selectedMovieObj.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedMovieObj.description || "Ready for scheduling."}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Search & Filter Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search shows by movie or theatre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-slate-700 transition placeholder:text-slate-500"
            />
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Showing <span className="text-white font-bold">{filteredShows.length}</span> of {shows.length} scheduled showtimes
          </div>
        </div>

        {/* Shows Catalog Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-[#0D0D15]/40 backdrop-blur-xl">
            Loading showtime schedules...
          </div>
        ) : filteredShows.length === 0 ? (
          <div className="bg-[#0D0D15]/40 border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-2 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white">No showtimes found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Use the scheduling form above to add showtimes for your multiplex locations.
            </p>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShows.map((s) => {
              const movieObj = s.movieId || {};
              return (
                <div
                  key={s._id}
                  className="bg-[#0D0D15]/80 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl p-6 shadow-xl flex gap-5 backdrop-blur-xl transition hover:-translate-y-0.5 space-y-0"
                >
                  {/* Poster */}
                  <div className="relative w-24 h-36 shrink-0 rounded-2xl overflow-hidden bg-[#05050A] border border-slate-800">
                    <img
                      src={movieObj.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800"}
                      alt={movieObj.title || "Poster"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Show Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        {s.theatre || "Multiplex"}
                      </span>

                      <h3 className="text-sm font-bold text-white truncate mt-2.5">
                        {movieObj.title || "Untitled Movie"}
                      </h3>

                      <div className="text-xs text-slate-400 space-y-1 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span> {s.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-200">⏰ {s.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <span> {s.seats?.length || 136} Total Seats</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap gap-1 font-mono">
                        <span className="text-amber-300 font-bold">Balcony ₹{s.balconyPrice || 0}</span> •{" "}
                        <span className="text-cyan-300 font-bold">First ₹{s.firstClassPrice || 0}</span> •{" "}
                        <span className="text-slate-300">Second ₹{s.secondClassPrice || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(s)}
                        className="flex-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs py-2 rounded-xl transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(s._id)}
                        className="bg-rose-950/40 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-rose-300 font-bold text-xs px-4 py-2 rounded-xl transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0D0D15] border border-slate-800 p-6 rounded-3xl text-center space-y-4 max-w-xs w-full shadow-2xl">
              <div>
                <h3 className="text-sm font-extrabold text-white">Delete Showtime Schedule?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  This action cannot be undone and will remove the showtime from the user booking portal.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={deleteShow}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-rose-600/20"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl transition border border-slate-700"
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

export default AdminShows;