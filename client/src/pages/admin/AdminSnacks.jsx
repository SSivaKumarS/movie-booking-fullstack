import { useEffect, useState } from "react";
import API from "../../api";
import AdminNavbar from "../../components/AdminNavbar";

export default function AdminSnacks() {
  const [snacks, setSnacks] = useState([]);
  const [theatres, setTheatres] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [theatre, setTheatre] = useState("");
  const [search, setSearch] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  /* FETCH SNACKS */
  const fetchSnacks = () => {
    API.get("/api/snacks/all")
      .then((res) => {
        setSnacks(res.data || []);
        const unique = [...new Set((res.data || []).map((s) => s.theatre))];
        setTheatres(unique);
      })
      .catch((err) => {
        console.log("Fetch snacks error:", err);
        setSnacks([]);
      });
  };

  useEffect(() => {
    fetchSnacks();
  }, []);

  /* ADD SNACK */
  const addSnack = () => {
    if (!name.trim() || !price || !theatre) return alert("Please fill all required fields");

    API.post("/api/snacks", {
      name: name.trim(),
      price: Number(price),
      theatre,
    })
      .then(() => {
        setName("");
        setPrice("");
        setTheatre("");
        fetchSnacks();
      })
      .catch((err) => {
        alert("Error adding snack: " + (err.response?.data?.message || err.message));
      });
  };

  /* DELETE SNACK */
  const confirmDeleteSnack = () => {
    if (!deleteId) return;
    API.delete(`/api/snacks/${deleteId}`)
      .then(() => {
        setDeleteId(null);
        fetchSnacks();
      })
      .catch((err) => {
        alert("Error deleting snack: " + (err.response?.data?.message || err.message));
      });
  };

  // Group snacks by theater
  const filteredSnacks = snacks.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.theatre.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredSnacks.reduce((acc, snack) => {
    if (!acc[snack.theatre]) acc[snack.theatre] = [];
    acc[snack.theatre].push(snack);
    return acc;
  }, {});

  return (
    <div className="bg-[#06060A] min-h-screen text-white relative selection:bg-red-600 selection:text-white">
      <AdminNavbar />
      <div className="p-4 md:p-10 relative">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-600/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-3 py-0.5 rounded-full uppercase">
                 CinePantry Inventory
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Total Items: {snacks.length}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Food & Refreshment Management
            </h1>
            <p className="text-xs text-gray-400">
              Manage cinema snacks, beverages, popcorn pricing, and theater inventory
            </p>
          </div>

          {/* Search bar */}
          <input
            placeholder="🔍 Search Snack Name or Theater..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-950 border border-gray-800 text-white text-xs px-4 py-3 rounded-2xl w-full md:w-64 focus:outline-none focus:border-red-500 transition"
          />
        </div>

        {/*  ADD SNACK FORM */}
        <div className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">
             Add New Refreshment Item
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              placeholder="Snack Name (e.g. Cheese Popcorn)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-xs focus:outline-none focus:border-red-500 transition"
            />

            <input
              type="number"
              placeholder="Price (₹)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-xs focus:outline-none focus:border-red-500 transition"
            />

            {/* Custom Theater Select */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-xs flex justify-between items-center transition"
              >
                <span>{theatre || "Select Theater Location"}</span>
                <span className="text-gray-500">▼</span>
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0F0F17] border border-gray-800 rounded-2xl max-h-48 overflow-y-auto p-2 z-50 shadow-2xl backdrop-blur-xl">
                  {theatres.map((t) => (
                    <p
                      key={t}
                      onClick={() => {
                        setTheatre(t);
                        setShowDropdown(false);
                      }}
                      className="p-2.5 text-xs text-gray-300 hover:text-white hover:bg-red-600/20 rounded-xl cursor-pointer transition"
                    >
                       {t}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={addSnack}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition shadow-xl shadow-red-600/30 whitespace-nowrap"
            >
              + Save Snack Item
            </button>
          </div>
        </div>

        {/*  THEATER SNACK CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(grouped).length === 0 ? (
            <p className="col-span-full text-xs text-gray-500 py-10 text-center border border-dashed border-gray-800 rounded-3xl">
              No refreshments listed for the selected search filter.
            </p>
          ) : (
            Object.keys(grouped).map((theatreName) => (
              <div
                key={theatreName}
                className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-4 hover:border-gray-700 transition"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>{theatreName} Multiplex</span>
                  </h3>
                  <span className="text-[10px] font-black bg-amber-950/80 border border-amber-800 text-amber-300 px-2.5 py-0.5 rounded-full">
                    {grouped[theatreName].length} Items Listed
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {grouped[theatreName].map((snack) => (
                    <div
                      key={snack._id}
                      className="bg-gray-950/80 border border-gray-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-4 hover:border-gray-700 transition"
                    >
                      <div>
                        <span className="font-bold text-white text-xs block">{snack.name}</span>
                        <span className="text-xs font-black text-emerald-400">₹{snack.price}</span>
                      </div>

                      <button
                        onClick={() => setDeleteId(snack._id)}
                        className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-[11px] px-3 py-1.5 rounded-xl transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* DELETE MODAL */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-fadeIn">
            <div className="bg-[#0F0F17] border border-red-500/40 p-8 rounded-3xl text-center space-y-4 max-w-sm w-full shadow-2xl animate-modalScaleIn">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center text-xl mx-auto">
                
              </div>
              <h2 className="text-base font-extrabold text-white">Delete this snack item?</h2>
              <p className="text-xs text-gray-400">This item will be removed from customer add-on options.</p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={confirmDeleteSnack}
                  className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-2xl text-white font-bold text-xs transition shadow-lg shadow-red-600/30"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-2.5 rounded-2xl text-white font-bold text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  </div>
  );
}
