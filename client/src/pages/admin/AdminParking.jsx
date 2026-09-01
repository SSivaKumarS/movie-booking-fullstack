import { useEffect, useState, useRef } from "react";
import axios from "axios";
import AdminNavbar from "../../components/AdminNavbar";

export default function AdminParking() {
  const [parkingList, setParkingList] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [revenueMap, setRevenueMap] = useState({});

  const [theatre, setTheatre] = useState("");
  const [bikePrice, setBikePrice] = useState("");
  const [carPrice, setCarPrice] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTheatre, setSearchTheatre] = useState("");

  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const dropdownRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const parkingRes = await axios.get(`${API_URL}/api/parking/all`);
      setParkingList(parkingRes.data || []);
    } catch (err) {
      console.log("Parking Load Failed", err);
    }

    try {
      const showRes = await axios.get(`${API_URL}/api/shows`);
      const unique = [...new Set((showRes.data || []).map((s) => s.theatre))];
      setTheatres(unique);
    } catch (err) {
      console.log("Show Load Failed", err);
    }

    try {
      const rev = await axios.get(`${API_URL}/api/bookings/parking-revenue`);
      setRevenueMap(rev.data || {});
    } catch (err) {
      console.log("Revenue Load Failed", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setTheatre("");
    setBikePrice("");
    setCarPrice("");
    setShowDropdown(false);
    setSearchTheatre("");
  };

  const addParking = async () => {
    if (!theatre || !bikePrice || !carPrice) return alert("Fill all fields");

    try {
      if (editId) {
        await axios.put(`${API_URL}/api/parking/${editId}`, {
          theatre,
          priceBike: Number(bikePrice),
          priceCar: Number(carPrice),
        });
      } else {
        await axios.post(`${API_URL}/api/parking`, {
          theatre,
          priceBike: Number(bikePrice),
          priceCar: Number(carPrice),
        });
      }

      resetForm();
      fetchData();
    } catch (err) {
      console.log("Parking operation failed:", err);
      alert("Operation Failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/parking/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.log("Delete parking failed:", err);
    }
  };

  return (
    <div className="bg-[#05050A] min-h-screen text-slate-100 relative selection:bg-rose-500 selection:text-white font-sans antialiased">
      <AdminNavbar />

      <div className="p-4 md:p-8 lg:p-12 relative max-w-7xl mx-auto space-y-8">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Header Section */}
        <header className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D15]/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Vehicle Pass Rates
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Multiplex Locations: <span className="text-white font-bold">{parkingList.length}</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Parking Rate Manager
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure bike and car parking slot fees per theater location
            </p>
          </div>
        </header>

        {/* Form Panel */}
        <section className="relative z-10 bg-[#0D0D15]/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {editId ? "Edit Parking Rates" : "Add Parking Location"}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setShowDropdown((prev) => !prev)}
                className="w-full bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs cursor-pointer flex justify-between items-center hover:border-slate-700 transition"
              >
                <span className={theatre ? "text-white font-medium" : "text-slate-500"}>
                  {theatre || "Select Theater"}
                </span>
                <span className="text-slate-500 text-[10px]">▼</span>
              </div>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D0D15] border border-slate-800 rounded-2xl max-h-56 overflow-y-auto p-2 z-50 shadow-2xl backdrop-blur-2xl">
                  <input
                    placeholder="Search theater..."
                    value={searchTheatre}
                    onChange={(e) => setSearchTheatre(e.target.value)}
                    className="w-full bg-[#05050A] border border-slate-800 text-white text-xs px-3 py-2 rounded-xl mb-2 focus:outline-none focus:border-indigo-500 transition"
                  />

                  {theatres
                    .filter((t) => t.toLowerCase().includes(searchTheatre.toLowerCase()))
                    .map((t) => {
                      const exists = parkingList.some((p) => p.theatre === t);
                      const isSelected = editId && theatre === t;
                      const isDisabled = exists && !isSelected;

                      return (
                        <div
                          key={t}
                          onClick={() => {
                            if (!isDisabled) {
                              setTheatre(t);
                              setShowDropdown(false);
                            }
                          }}
                          className={`p-2.5 text-xs rounded-xl transition flex justify-between items-center ${
                            isDisabled
                              ? "opacity-40 text-slate-600 cursor-not-allowed"
                              : "text-slate-300 hover:text-white hover:bg-rose-500/10 hover:border hover:border-rose-500/20 cursor-pointer"
                          }`}
                        >
                          <span>{t}</span>
                          {exists && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              (Configured)
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <input
              type="number"
              placeholder="Bike Price (₹)"
              value={bikePrice}
              onChange={(e) => setBikePrice(e.target.value)}
              className="bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition placeholder:text-slate-500"
            />

            <input
              type="number"
              placeholder="Car Price (₹)"
              value={carPrice}
              onChange={(e) => setCarPrice(e.target.value)}
              className="bg-[#05050A] border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition placeholder:text-slate-500"
            />

            <button
              onClick={addParking}
              className="bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-2xl transition shadow-lg shadow-rose-600/20 active:scale-[0.98]"
            >
              {editId ? "Update Rates" : "+ Add Rates"}
            </button>
          </div>
        </section>

        {/* Cards Grid */}
        <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {parkingList.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-3xl bg-[#0D0D15]/40 backdrop-blur-xl">
              <p className="text-xs text-slate-500">No parking locations configured yet.</p>
            </div>
          ) : (
            parkingList.map((p) => (
              <div
                key={p._id}
                className="bg-[#0D0D15]/80 border border-slate-800/80 p-6 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/80 transition space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{p.theatre} Multiplex</span>
                    </h3>
                    <span className="text-[11px] font-semibold bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full">
                      Revenue: ₹{revenueMap[p.theatre] || 0}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#05050A] border border-slate-800 p-3.5 rounded-2xl">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                        🏍 Bike Pass
                      </span>
                      <span className="font-black text-emerald-400 text-base">₹{p.priceBike}</span>
                    </div>

                    <div className="bg-[#05050A] border border-slate-800 p-3.5 rounded-2xl">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                        🚗 Car Pass
                      </span>
                      <span className="font-black text-indigo-400 text-base">₹{p.priceCar}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setEditId(p._id);
                      setTheatre(p.theatre);
                      setBikePrice(p.priceBike);
                      setCarPrice(p.priceCar);
                    }}
                    className="flex-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs py-2 rounded-xl transition"
                  >
                    Edit Rates
                  </button>

                  <button
                    onClick={() => setDeleteId(p._id)}
                    className="bg-rose-950/40 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-rose-300 font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0D0D15] border border-slate-800 p-6 rounded-3xl text-center space-y-4 max-w-xs w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-sm font-extrabold text-white">Delete parking rates?</h2>
              <p className="text-xs text-slate-400">
                This will remove the parking configuration for this multiplex location.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={confirmDelete}
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