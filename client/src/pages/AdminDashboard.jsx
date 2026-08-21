import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";
import AdminNavbar from "../components/AdminNavbar";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalShows: 0,
    totalTickets: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Summary & Recent Bookings
    Promise.all([
      API.get("/api/analytics").catch(() => ({ data: {} })),
      API.get("/api/bookings/all").catch(() => ({ data: [] })),
    ]).then(([resAnalytics, resBookings]) => {
      if (resAnalytics.data && resAnalytics.data.summary) {
        setStats(resAnalytics.data.summary);
      }
      if (Array.isArray(resBookings.data)) {
        setRecentBookings(resBookings.data.slice(0, 5));
      }
      setLoading(false);
    });
  }, []);

  const logoutAdmin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const exportCSVReport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Metric,Value",
        `Total Movies,${stats.totalMovies}`,
        `Total Shows,${stats.totalShows}`,
        `Total Tickets Sold,${stats.totalTickets}`,
        `Total Revenue (INR),${stats.totalRevenue}`,
        `Report Generated,${new Date().toLocaleString()}`,
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CineBook_Executive_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#07070B] min-h-screen text-white relative selection:bg-red-600 selection:text-white">
      <AdminNavbar />
      <div className="p-4 md:p-10 relative">
      
      {/* Background Accent Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                 Executive Operations
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                System Status: <span className="text-emerald-400 font-bold">● ONLINE</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span> Admin Command Center</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Real-time multi-theater operations, booking audit logs, and revenue metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSVReport}
              className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold px-4 py-2.5 rounded-2xl transition text-xs flex items-center gap-2 shadow-lg"
            >
               Export CSV Report
            </button>
            <button
              onClick={logoutAdmin}
              className="bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 font-bold px-5 py-2.5 rounded-2xl transition text-xs shadow-lg"
            >
              Exit Console
            </button>
          </div>
        </div>

        {/* Executive KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            icon=""
            title="Total Catalog Movies"
            value={stats.totalMovies}
            badge="+ Active Catalog"
            badgeColor="bg-blue-950/80 text-blue-400 border-blue-800"
            subtext="Available across all screens"
          />
          <KpiCard
            icon=""
            title="Scheduled Showtimes"
            value={stats.totalShows}
            badge="Live Shows"
            badgeColor="bg-purple-950/80 text-purple-400 border-purple-800"
            subtext="Today & upcoming dates"
          />
          <KpiCard
            icon=""
            title="Tickets Sold"
            value={stats.totalTickets}
            badge="Audience Volume"
            badgeColor="bg-emerald-950/80 text-emerald-400 border-emerald-800"
            subtext="Verified seat passes"
          />
          <KpiCard
            icon=""
            title="Total Revenue"
            value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
            badge="Gross Sales"
            badgeColor="bg-amber-950/80 text-amber-400 border-amber-800"
            subtext="Includes tickets & snacks"
          />
        </div>

        {/* Management Module Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
            Operational Management Modules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModuleCard
              icon=""
              title="Manage Movies Catalog"
              desc="Add new titles, edit trailers, poster URLs, genres, and active movie lists."
              path="/admin/movies"
              accentColor="hover:border-blue-500/60"
              btnText="Open Movies Manager →"
            />
            <ModuleCard
              icon=""
              title="Manage Showtimes & Screens"
              desc="Create show schedules, assign theater halls, set date & time slots, and seat prices."
              path="/admin/shows"
              accentColor="hover:border-purple-500/60"
              btnText="Schedule Showtimes →"
            />
            <ModuleCard
              icon=""
              title="Manage CinePantry F&B"
              desc="Update food inventory, add snacks, beverages, popcorn pricing, and combo deals."
              path="/admin/snacks"
              accentColor="hover:border-amber-500/60"
              btnText="Manage Refreshments →"
            />
            <ModuleCard
              icon=""
              title="Manage Vehicle Parking"
              desc="Configure bike and car parking slot fees for all multiplex locations."
              path="/admin/parking"
              accentColor="hover:border-cyan-500/60"
              btnText="Configure Parking →"
            />
            <ModuleCard
              icon=""
              title="Analytics & Financial Reports"
              desc="Deep-dive into revenue charts, peak show hour trends, and sales analytics."
              path="/admin/analytics"
              accentColor="hover:border-emerald-500/60"
              btnText="View Full Analytics →"
            />
            <ModuleCard
              icon=""
              title="Gate Ticket QR Scanner"
              desc="Live QR scanner for theater entrance door staff to verify customer ticket passes."
              path="/admin/scan"
              accentColor="hover:border-red-500/60"
              btnText="Launch QR Scanner →"
            />
            <ModuleCard
              icon=""
              title="Smart IoT Hardware Console"
              desc="Hardware turnstile relays, ANPR parking barriers, seat pressure sensors, and AC dimmers."
              path="/admin/iot"
              accentColor="hover:border-cyan-500/60"
              btnText="Launch IoT Hardware Console →"
            />
          </div>
        </div>

        {/* Real-time Recent Bookings Audit Stream */}
        <div className="bg-[#0F0F17]/90 border border-gray-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🧾 Recent Transaction Stream</span>
              </h3>
              <p className="text-[11px] text-gray-400">Live feed of latest customer ticket bookings</p>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs text-red-400 hover:text-red-300 font-bold transition"
            >
              View All Transactions →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center italic">
              No recent customer transactions recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b._id}
                  className="bg-gray-950/80 border border-gray-800/80 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs hover:border-gray-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/10 border border-red-500/30 rounded-xl flex items-center justify-center font-bold text-red-500 text-lg">
                      
                    </div>
                    <div>
                      <h4 className="font-bold text-white">
                        {b.showId?.movieId?.title || "Movie Booking"}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        {b.showId?.theatre} • Seats: <span className="text-emerald-400 font-bold">{b.seats?.join(", ")}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-white">₹{b.totalPrice}</span>
                    <span className="block text-[10px] text-gray-500 font-mono">ID: {b._id.slice(-6)}</span>
                  </div>
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

function KpiCard({ icon, title, value, badge, badgeColor, subtext }) {
  return (
    <div className="bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-xl space-y-3 relative overflow-hidden group hover:border-gray-700 transition">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-white mt-0.5 tracking-tight">{value}</p>
      </div>
      <p className="text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-800/80">{subtext}</p>
    </div>
  );
}

function ModuleCard({ icon, title, desc, path, accentColor, btnText }) {
  return (
    <Link
      to={path}
      className={`bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group ${accentColor} hover:scale-[1.02]`}
    >
      <div className="space-y-2">
        <div className="w-12 h-12 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition">
          {icon}
        </div>
        <h3 className="text-base font-extrabold text-white group-hover:text-red-400 transition">
          {title}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          {desc}
        </p>
      </div>

      <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs font-bold text-red-500 group-hover:text-red-400 transition">
        <span>{btnText}</span>
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  );
}