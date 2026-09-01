import React, { useEffect, useState, useRef } from "react";
import API from "../../api";
import AdminNavbar from "../../components/AdminNavbar";

export default function AdminSnacks() {
  const [snacks, setSnacks] = useState([]);
  const [theatres, setTheatres] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [theatre, setTheatre] = useState("");
  const [customTheatre, setCustomTheatre] = useState("");
  const [search, setSearch] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);

  /* ---------- FETCH SNACKS ---------- */
  const fetchSnacks = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/snacks/all");
      const data = res.data || [];
      setSnacks(data);
      const uniqueTheatres = [...new Set(data.map((s) => s.theatre).filter(Boolean))];
      setTheatres(uniqueTheatres);
    } catch (err) {
      console.error("Fetch snacks error:", err);
      setSnacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnacks();
  }, []);

  /* ---------- CLOSE DROPDOWN ON CLICK OUTSIDE ---------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------- ADD SNACK ---------- */
  const addSnack = async () => {
    const selectedTheatre = theatre === "CUSTOM" ? customTheatre.trim() : theatre;

    if (!name.trim() || !price || !selectedTheatre) {
      alert("Please fill in all required fields (Snack Name, Price, and Theater).");
      return;
    }

    try {
      await API.post("/api/snacks", {
        name: name.trim(),
        price: Number(price),
        theatre: selectedTheatre,
      });

      setName("");
      setPrice("");
      setTheatre("");
      setCustomTheatre("");
      fetchSnacks();
    } catch (err) {
      console.error("Error adding snack:", err);
      alert("Error adding snack: " + (err.response?.data?.message || err.message));
    }
  };

  /* ---------- DELETE SNACK ---------- */
  const confirmDeleteSnack = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/api/snacks/${deleteId}`);
      setDeleteId(null);
      fetchSnacks();
    } catch (err) {
      console.error("Error deleting snack:", err);
      alert("Error deleting snack: " + (err.response?.data?.message || err.message));
    }
  };

  /* ---------- FILTER & GROUP ---------- */
  const filteredSnacks = snacks.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.theatre?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredSnacks.reduce((acc, snack) => {
    const key = snack.theatre || "Unassigned Multiplex";
    if (!acc[key]) acc[key] = [];
    acc[key].push(snack);
    return acc;
  }, {});

  return (
    <div className="bg-[#05050A] min-h-screen text-slate-100 font-sans antialiased relative selection:bg-rose-500 selection:text-white">
      <AdminNavbar />

      <div className="p-4 md:p-8 lg:p-12 relative max-w-7xl mx-auto space-y-8">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Header Bar */}
        <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D0D15]/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                CinePantry Inventory
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Food & Refreshment Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure multiplex concession stand inventory, combo pricing, and site availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#05050A] border border-slate-800 px-4 py-2.5 rounded-2xl text-center shadow-inner">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Items</span>
              <span className="text-lg font-black text-white">{snacks.length}</span>
            </div>
            <div className="bg-[#05050A] border border-slate-800 px-4 py-2.5 rounded-2xl text-center shadow-inner">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Locations</span>
              <span className="text-lg font-black text-amber-400">{Object.keys(grouped).length}</span>
            </div>
          </div>
        </header>

        {/* Add Snack Form */}
        <section className="relative z-10 bg-[#0D0D15]/80 border border-slate-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Add New Refreshment Item
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Snack Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Large Caramel Popcorn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition placeholder:text-slate-600"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                placeholder="e.g. 290"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition placeholder:text-slate-600 font-bold"
              />
            </div>

            {/* Theater Selector */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Multiplex Location *
              </label>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs flex justify-between items-center transition focus:outline-none focus:border-rose-500"
              >
                <span className="truncate text-slate-200">
                  {theatre === "CUSTOM"
                    ? "Custom Location"
                    : theatre || "Select Theater Location"}
                </span>
                <span className="text-slate-500 text-[10px]">▼</span>
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D0D15] border border-slate-800 rounded-2xl max-h-56 overflow-y-auto p-2 z-50 shadow-2xl backdrop-blur-xl space-y-1">
                  {theatres.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTheatre(t);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-rose-600/10 rounded-xl transition truncate"
                    >
                      {t}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTheatre("CUSTOM");
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/10 rounded-xl transition border-t border-slate-800/80 mt-1 pt-2"
                  >
                    + Add New Location Manually
                  </button>
                </div>
              )}
            </div>

            {/* Save Button / Manual Location Field */}
            <div className="flex flex-col justify-end">
              {theatre === "CUSTOM" ? (
                <input
                  type="text"
                  placeholder="Enter Theater Name"
                  value={customTheatre}
                  onChange={(e) => setCustomTheatre(e.target.value)}
                  className="w-full bg-[#05050A] border border-amber-500/40 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600 mb-2 md:mb-0"
                />
              ) : null}

              <button
                onClick={addSnack}
                className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-2xl transition shadow-lg shadow-rose-600/20 active:scale-[0.98]"
              >
                + Save Item
              </button>
            </div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search by snack name or theater..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-slate-700 transition placeholder:text-slate-500"
            />
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Showing <span className="text-white font-bold">{filteredSnacks.length}</span> item listings
          </div>
        </div>

        {/* Snacks Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-[#0D0D15]/40 backdrop-blur-xl">
            Loading pantry inventory...
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-[#0D0D15]/40 border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-2 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white">No items found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              No snacks match your search parameters. Try adding standard items using the form above.
            </p>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(grouped).map((theatreName) => (
              <div
                key={theatreName}
                className="bg-[#0D0D15]/80 border border-slate-800/80 p-6 rounded-3xl shadow-xl backdrop-blur-xl space-y-4 hover:border-slate-700/80 transition"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{theatreName}</span>
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
                    {grouped[theatreName].length} Items Listed
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {grouped[theatreName].map((snack) => (
                    <div
                      key={snack._id}
                      className="bg-[#05050A] border border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-700 transition"
                    >
                      <div>
                        <span className="font-bold text-white text-xs block">{snack.name}</span>
                        <span className="text-xs font-extrabold text-emerald-400">₹{snack.price}</span>
                      </div>

                      <button
                        onClick={() => setDeleteId(snack._id)}
                        className="bg-rose-950/40 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-rose-300 font-bold text-xs px-3.5 py-1.5 rounded-xl transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0D0D15] border border-slate-800 p-6 rounded-3xl text-center space-y-4 max-w-xs w-full shadow-2xl">
              <div>
                <h3 className="text-sm font-extrabold text-white">Delete Snack Item?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  This refreshment will be immediately unlisted from customer add-on selections.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={confirmDeleteSnack}
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