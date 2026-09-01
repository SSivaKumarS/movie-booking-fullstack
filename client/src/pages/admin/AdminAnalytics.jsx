import { useEffect, useState } from "react";
import API from "../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import RevenueCharts from "../../components/RevenueCharts";
import AdminNavbar from "../../components/AdminNavbar";

export default function AdminAnalytics() {
  const [data, setData] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState("All");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = (customStart = startDate, customEnd = endDate) => {
    API.get("/api/analytics", {
      params: { startDate: customStart, endDate: customEnd },
    })
      .then((res) => setData(res.data || {}))
      .catch((err) => console.log("Analytics error:", err));
  };

  const handleQuickFilter = (period) => {
    setActiveQuickFilter(period);
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0];

    if (period === "Today") {
      start = end;
    } else if (period === "Week") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      start = past.toISOString().split("T")[0];
    } else if (period === "Month") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      start = past.toISOString().split("T")[0];
    }

    setStartDate(start);
    setEndDate(end);
    fetchAnalytics(start, end);
  };

  /* EXPORT CSV */
  const exportCSV = () => {
    if (!data.movieStats || data.movieStats.length === 0) return;
    const rows = data.movieStats.map((m) => ({
      Movie: m.title,
      TicketsSold: m.ticketsSold,
      RevenueINR: m.ticketRevenue,
    }));

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) => Object.values(r).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Xaviercinema_Analytics_${Date.now()}.csv`;
    link.click();
  };

  /* EXPORT PDF */
  const exportPDF = () => {
    if (!data.movieStats) return;
    const doc = new jsPDF();
    doc.text("CineBook Financial Analytics Report", 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [["Movie Title", "Tickets Sold", "Revenue (INR)"]],
      body: data.movieStats.map((m) => [m.title, m.ticketsSold, `Rs. ${m.ticketRevenue}`]),
    });

    doc.save(`CineBook_Financial_Report_${Date.now()}.pdf`);
  };

  const grandTotalRevenue = data.summary?.totalRevenue || 1;
  const highestMovie = data.movieStats?.length
    ? [...data.movieStats].sort((a, b) => b.ticketRevenue - a.ticketRevenue)[0]
    : null;

  return (
    <div className="bg-[#050508] min-h-screen text-slate-100 relative selection:bg-red-600 selection:text-white font-sans overflow-x-hidden">
      <AdminNavbar />
      
      {/* Background Ambient Lights */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="p-4 md:p-10 relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#0E0E17]/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold tracking-wider px-3 py-0.5 rounded-full uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Financial Intelligence
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-Time Telemetry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Revenue & Performance Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Box office ticket collections, theater F&B breakdown, and sales reports
            </p>
          </div>

          {/* Quick Date Filters & Export Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#07070D] border border-slate-800 p-1.5 rounded-2xl gap-1 shadow-inner">
              {["All", "Today", "Week", "Month"].map((period) => (
                <button
                  key={period}
                  onClick={() => handleQuickFilter(period)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    activeQuickFilter === period
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-[#07070D] border border-slate-800 p-1.5 rounded-2xl">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/50"
              />
              <span className="text-slate-600 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/50"
              />
              <button
                onClick={() => fetchAnalytics()}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition duration-200"
              >
                Apply
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-3.5 py-2 rounded-2xl transition duration-200 text-xs shadow-lg flex items-center gap-1.5"
              >
                <span>↓</span> CSV
              </button>
              <button
                onClick={exportPDF}
                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold px-3.5 py-2 rounded-2xl transition duration-200 text-xs shadow-lg flex items-center gap-1.5"
              >
                <span>↓</span> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Executive Overview Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <StatBox title="Active Movies" value={data.summary?.totalMovies} color="text-blue-400" icon="🎬" />
          <StatBox title="Active Showtimes" value={data.summary?.totalShows} color="text-purple-400" icon="🎭" />
          <StatBox title="Tickets Issued" value={data.summary?.totalTickets} color="text-emerald-400" icon="🎟️" />
          <StatBox
            title="Total Revenue"
            value={`₹${(data.summary?.totalRevenue || 0).toLocaleString()}`}
            color="text-red-500"
            icon=""
          />
        </div>

        {/* Box Office Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span> Movie Box Office Collections</span>
            </h2>
            {highestMovie && (
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-amber-500/5">
                 Leader: <span className="text-white">{highestMovie.title}</span> (₹{highestMovie.ticketRevenue.toLocaleString()})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {data.movieStats?.map((movie) => {
              const share = Math.round((movie.ticketRevenue / grandTotalRevenue) * 100) || 0;
              const isTop = highestMovie && highestMovie._id === movie._id;

              return (
                <div
                  key={movie._id}
                  className={`bg-[#0E0E17]/70 border p-4 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 ${
                    isTop ? "border-amber-500/40 shadow-amber-500/5 ring-1 ring-amber-500/20" : "border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="relative h-60 w-full rounded-2xl overflow-hidden mb-3">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";
                      }}
                    />
                    {isTop && (
                      <span className="absolute top-2.5 left-2.5 bg-amber-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg tracking-wider uppercase">
                        Top Grosser
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h3 className="font-bold text-white text-sm truncate group-hover:text-red-400 transition">{movie.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tickets Sold: <span className="text-slate-200 font-semibold">{movie.ticketsSold}</span>
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, share))}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">{share}% share</span>
                    <span className="text-sm font-black text-red-500">₹{movie.ticketRevenue.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multiplex Financial Breakdown */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Multiplex Revenue Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.theatreStats?.map((t) => (
              <div
                key={t._id}
                className="bg-[#0E0E17]/70 border border-slate-800/80 p-6 rounded-3xl shadow-xl backdrop-blur-xl hover:border-red-500/30 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                      <span>{t._id} Multiplex</span>
                    </h3>
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                      ₹{t.totalRevenue.toLocaleString()}
                    </span>
                  </div>

                  {/* Movies playing */}
                  <div className="mt-4 space-y-2 text-xs">
                    {t.movies?.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300 bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-800/40">
                        <span className="truncate pr-2 text-slate-300 font-medium">🎬 {m.title}</span>
                        <span className="font-mono text-slate-400">₹{m.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stream Breakdown */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Ticket Revenue</span>
                    <span className="text-slate-200 font-semibold">₹{(t.ticketRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Refreshments F&B</span>
                    <span className="text-slate-200 font-semibold">₹{(t.snackRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Parking Pass</span>
                    <span className="text-slate-200 font-semibold">₹{(t.parkingRevenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Charts */}
        <RevenueCharts movieStats={data.movieStats} theatreStats={data.theatreStats} />

      </div>
    </div>
  );
}

function StatBox({ title, value, color, icon }) {
  return (
    <div className="bg-[#0E0E17]/80 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-xl shadow-xl space-y-3 hover:border-slate-700 transition duration-300">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">{title}</span>
        <span className="text-base p-2 bg-slate-900/80 rounded-2xl border border-slate-800">{icon}</span>
      </div>
      <p className={`text-2xl md:text-3xl font-black ${color} tracking-tight`}>{value || 0}</p>
    </div>
  );
}