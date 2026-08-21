import { useEffect, useState } from "react";
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

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

  const addParking = async () => {
    if (!theatre || !bikePrice || !carPrice) return alert("Fill all fields");

    try {
      if (editId) {
        await axios.put(`${API_URL}/api/parking/${editId}`, {
          theatre,
          priceBike: Number(bikePrice),
          priceCar: Number(carPrice),
        });
        setEditId(null);
      } else {
        await axios.post(`${API_URL}/api/parking`, {
          theatre,
          priceBike: Number(bikePrice),
          priceCar: Number(carPrice),
        });
      }

      setTheatre("");
      setBikePrice("");
      setCarPrice("");
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
    <div className="bg-[#06060A] min-h-screen text-white relative selection:bg-red-600 selection:text-white">
      <AdminNavbar />
      <div className="p-4 md:p-10 relative">
      
      {/* Glow Backdrop */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-black px-3 py-0.5 rounded-full uppercase">
                 Vehicle Pass Rates
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                Multiplex Locations: {parkingList.length}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Parking Rate Manager
            </h1>
            <p className="text-xs text-gray-400">
              Configure bike and car parking slot fees per theater location
            </p>
          </div>
        </div>

        {/*  FORM */}
        <div className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">
              {editId ? "Edit Parking Rates" : " Add Parking Location"}
            </h2>
            {editId && (
              <button
                onClick={() => {
                  setEditId(null);
                  setTheatre("");
                  setBikePrice("");
                  setCarPrice("");
                }}
                className="text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-3 py-1 rounded-xl transition"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Theatre Dropdown */}
            <div className="relative">
              <input
                value={theatre}
                placeholder="Select Theater"
                onClick={() => setShowDropdown(!showDropdown)}
                readOnly
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-xs cursor-pointer focus:outline-none focus:border-red-500 transition"
              />

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0F0F17] border border-gray-800 rounded-2xl max-h-48 overflow-y-auto p-2 z-50 shadow-2xl backdrop-blur-xl">
                  <input
                    placeholder="Search theater..."
                    value={searchTheatre}
                    onChange={(e) => setSearchTheatre(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white text-xs px-3 py-2 rounded-xl mb-2 focus:outline-none"
                  />

                  {theatres
                    .filter((t) => t.toLowerCase().includes(searchTheatre.toLowerCase()))
                    .map((t) => {
                      const exists = parkingList.some((p) => p.theatre === t);
                      return (
                        <p
                          key={t}
                          onClick={() => {
                            if (!exists || editId) {
                              setTheatre(t);
                              setShowDropdown(false);
                            }
                          }}
                          className={`p-2.5 text-xs rounded-xl cursor-pointer transition ${
                            exists && !editId
                              ? "opacity-40 text-gray-600 cursor-not-allowed"
                              : "text-gray-300 hover:text-white hover:bg-red-600/20"
                          }`}
                        >
                           {t} {exists && "(Configured)"}
                        </p>
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
              className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-xs focus:outline-none focus:border-red-500 transition"
            />

            <input
              type="number"
              placeholder="Car Price (₹)"
              value={carPrice}
              onChange={(e) => setCarPrice(e.target.value)}
              className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-xs focus:outline-none focus:border-red-500 transition"
            />

            <button
              onClick={addParking}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition shadow-xl shadow-red-600/30 whitespace-nowrap"
            >
              {editId ? "Update Rates" : "+ Add Parking Rates"}
            </button>

          </div>
        </div>

        {/*  CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {parkingList.length === 0 ? (
            <p className="col-span-full text-xs text-gray-500 py-10 text-center border border-dashed border-gray-800 rounded-3xl">
              No parking locations configured yet.
            </p>
          ) : (
            parkingList.map((p) => (
              <div
                key={p._id}
                className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-4 hover:border-gray-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span> {p.theatre} Multiplex</span>
                    </h3>
                    <span className="text-[10px] font-black bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-2.5 py-0.5 rounded-full">
                       Revenue: ₹{revenueMap[p.theatre] || 0}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-950 border border-gray-800 p-3 rounded-2xl">
                      <span className="text-gray-500 block text-[10px]">🏍 Bike Pass Rate</span>
                      <span className="font-extrabold text-emerald-400 text-sm">₹{p.priceBike}</span>
                    </div>

                    <div className="bg-gray-950 border border-gray-800 p-3 rounded-2xl">
                      <span className="text-gray-500 block text-[10px]">🚗 Car Pass Rate</span>
                      <span className="font-extrabold text-blue-400 text-sm">₹{p.priceCar}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-800/80">
                  <button
                    onClick={() => {
                      setEditId(p._id);
                      setTheatre(p.theatre);
                      setBikePrice(p.priceBike);
                      setCarPrice(p.priceCar);
                    }}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs py-2 rounded-xl transition text-center"
                  >
                    Edit Rates
                  </button>

                  <button
                    onClick={() => setDeleteId(p._id)}
                    className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DELETE MODAL */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-[#0F0F17] border border-gray-800 p-8 rounded-3xl text-center space-y-4 max-w-sm w-full shadow-2xl">
              <h2 className="text-base font-extrabold text-white">Delete parking rates?</h2>
              <p className="text-xs text-gray-400">This will remove parking selection for this multiplex.</p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-2xl text-white font-bold text-xs transition shadow-lg shadow-red-600/30"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="bg-gray-800 hover:bg-gray-700 px-6 py-2.5 rounded-2xl text-white font-bold text-xs transition"
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
