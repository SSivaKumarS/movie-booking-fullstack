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
    <div className="bg-[#05050A] min-h-screen text-white pb-24 selection:bg-red-600/40">
      <AdminNavbar />
      <div className="p-6 md:p-10">
      
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-extrabold text-xs tracking-widest uppercase mb-1">
            <span> THEATRE OPERATIONAL CONSOLE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Manage Multiplex Showtimes
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Schedule movie showtimes, set seat class pricing, and manage live auditorium availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-900/90 border border-gray-800 px-4 py-2.5 rounded-2xl text-center shadow-lg">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Scheduled</span>
            <span className="text-xl font-black text-white">{shows.length}</span>
          </div>
          <div className="bg-gray-900/90 border border-gray-800 px-4 py-2.5 rounded-2xl text-center shadow-lg">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Active Movies</span>
            <span className="text-xl font-black text-red-500">{movies.length}</span>
          </div>
        </div>
      </div>

      {/*  FORM CARD */}
      <div className="max-w-7xl mx-auto bg-gradient-to-br from-[#0F111E] via-[#0B0D18] to-[#06070E] p-6 md:p-8 rounded-3xl mb-12 shadow-2xl border border-gray-800/80 space-y-6">
        
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 text-sm">
              {editId ? "✏️" : "➕"}
            </span>
            <span>{editId ? "Edit Showtime Configuration" : "Schedule New Showtime"}</span>
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

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Select Movie */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              1. Select Movie *
            </label>
            <select
              value={movieId}
              onChange={(e) => setMovieId(e.target.value)}
              className="w-full p-3.5 bg-[#02040A] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition cursor-pointer"
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
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              2. Multiplex / Screen *
            </label>
            <input
              type="text"
              placeholder="e.g. PVR Inox Screen 1, IMAX 4K"
              value={theatre}
              onChange={(e) => setTheatre(e.target.value)}
              className="w-full p-3.5 bg-[#02040A] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition placeholder-gray-600"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              3. Show Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3.5 bg-[#02040A] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition"
            />
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              4. Show Time *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-3.5 bg-[#02040A] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition"
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
              className="w-full p-3.5 bg-[#02040A] border border-amber-500/30 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500 transition placeholder-gray-600 font-bold"
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
              className="w-full p-3.5 bg-[#02040A] border border-cyan-500/30 rounded-2xl text-sm text-white focus:outline-none focus:border-cyan-500 transition placeholder-gray-600 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
               Second Class (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 150"
              value={secondPrice}
              onChange={(e) => setSecondPrice(e.target.value)}
              className="w-full p-3.5 bg-[#02040A] border border-gray-800 rounded-2xl text-sm text-white focus:outline-none focus:border-red-500 transition placeholder-gray-600 font-bold"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={saveShow}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-2xl transition shadow-xl shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <span>{editId ? " Save Changes" : " Publish Showtime"}</span>
            </button>
          </div>

        </div>

        {/* Selected Movie Preview Card */}
        {selectedMovieObj && (
          <div className="p-4 bg-gray-950 border border-gray-800/80 rounded-2xl flex items-center gap-4 animate-fadeIn">
            <img
              src={selectedMovieObj.poster}
              alt=""
              className="w-12 h-16 object-cover rounded-xl border border-gray-800 shrink-0"
            />
            <div>
              <div className="text-xs font-bold text-red-400">Target Movie Selected</div>
              <h4 className="text-sm font-black text-white">{selectedMovieObj.title}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{selectedMovieObj.description || "Ready for scheduling."}</p>
            </div>
          </div>
        )}

      </div>

      {/*  SEARCH & FILTER BAR */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search shows by movie or theatre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3.5 pl-11 bg-[#02040A] border border-gray-800 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div className="text-xs font-bold text-gray-400">
          Showing <span className="text-white">{filteredShows.length}</span> of {shows.length} scheduled showtimes
        </div>
      </div>

      {/*  SHOWS CATALOG GRID */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading showtime schedules...</div>
      ) : filteredShows.length === 0 ? (
        <div className="max-w-7xl mx-auto bg-[#0C0D16] border border-gray-800/80 rounded-3xl p-16 text-center space-y-3">
          <span className="text-5xl block">🎭</span>
          <h3 className="text-lg font-bold text-white">No showtimes found</h3>
          <p className="text-gray-400 text-xs max-w-sm mx-auto">
            Use the scheduling form above to add showtimes for your multiplex locations.
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((s) => {
            const movieObj = s.movieId || {};
            return (
              <div
                key={s._id}
                className="bg-[#0B0D17] border border-gray-800/80 hover:border-red-500/40 rounded-3xl p-6 shadow-2xl flex gap-5 transition group hover:-translate-y-1"
              >
                {/* Poster */}
                <div className="relative w-28 h-40 shrink-0 rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
                  <img
                    src={movieObj.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800"}
                    alt={movieObj.title || "Poster"}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                {/* Show Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/40 px-2 py-0.5 rounded-md border border-red-500/20">
                      🎭 {s.theatre || "Multiplex"}
                    </span>

                    <h3 className="text-base font-black text-white truncate mt-2 group-hover:text-red-400 transition">
                      {movieObj.title || "Untitled Movie"}
                    </h3>

                    <div className="text-xs text-gray-300 space-y-1 mt-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span></span> <span>{s.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span></span> <span className="font-bold text-white">{s.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-green-400 font-bold">
                        <span></span> <span>{s.seats?.length || 136} Total Seats</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-800/80 text-[11px] text-gray-400 flex flex-wrap gap-1 font-mono">
                      <span className="text-amber-300 font-bold">Balcony ₹{s.balconyPrice || 0}</span> •{" "}
                      <span className="text-cyan-300 font-bold">First ₹{s.firstClassPrice || 0}</span> •{" "}
                      <span className="text-gray-300">Second ₹{s.secondClassPrice || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(s)}
                      className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs py-2 rounded-xl transition shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(s._id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-md"
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

      {/* ========================================================================= */}
      {/*  CENTERED FRONT-OF-SCREEN DELETE CONFIRMATION MODAL                      */}
      {/* ========================================================================= */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0E0F1A] border border-red-500/40 p-8 rounded-3xl text-center space-y-5 max-w-sm w-full shadow-2xl animate-modalScaleIn">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center text-2xl mx-auto">
              
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Delete Showtime Schedule?</h3>
              <p className="text-xs text-gray-400 mt-1">
                This action cannot be undone and will remove the showtime from the user booking portal.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={deleteShow}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-3 rounded-2xl transition shadow-lg shadow-red-600/30"
              >
                Delete Showtime
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs py-3 rounded-2xl transition"
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
