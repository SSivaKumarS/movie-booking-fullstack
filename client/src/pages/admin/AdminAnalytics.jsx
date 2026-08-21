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
    <div className="bg-[#06060A] min-h-screen text-white relative selection:bg-red-600 selection:text-white">
      <AdminNavbar />
      <div className="p-4 md:p-10 relative">
      
      {/* Background Ambient Lights */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black px-3 py-0.5 rounded-full uppercase">
                Financial Intelligence
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Real-time Revenue Telemetry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Revenue & Performance Analytics
            </h1>
            <p className="text-xs text-gray-400">
              Box office ticket collections, theater F&B breakdown, and sales reports
            </p>
          </div>

          {/* Quick Date Filters & Export */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-gray-950 border border-gray-800 p-1.5 rounded-2xl gap-1">
              {["All", "Today", "Week", "Month"].map((period) => (
                <button
                  key={period}
                  onClick={() => handleQuickFilter(period)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeQuickFilter === period
                      ? "bg-red-600 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-red-500"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-red-500"
              />
              <button
                onClick={() => fetchAnalytics()}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition"
              >
                Apply
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold px-3.5 py-2 rounded-xl transition text-xs shadow-lg"
              >
                 CSV
              </button>
              <button
                onClick={exportPDF}
                className="bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-300 font-bold px-3.5 py-2 rounded-xl transition text-xs shadow-lg"
              >
                 PDF
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

        {/*  BOX OFFICE COLLECTION LEADERBOARD */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <span>🎬 Movie Box Office Collections</span>
            </h2>
            {highestMovie && (
              <span className="bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                 Box Office Leader: {highestMovie.title} (₹{highestMovie.ticketRevenue})
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
                  className={`bg-[#0F0F17]/80 border p-4 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-3 flex flex-col justify-between group transition duration-300 ${
                    isTop ? "border-amber-500/60 shadow-amber-500/10" : "border-gray-800/80 hover:border-gray-700"
                  }`}
                >
                  <div className="relative h-60 w-full rounded-2xl overflow-hidden">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";
                      }}
                    />
                    {isTop && (
                      <span className="absolute top-2 left-2 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                         Top Grosser
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-sm truncate">{movie.title}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Tickets Sold: <span className="text-white font-bold">{movie.ticketsSold}</span>
                    </p>

                    {/* Collection Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-900 rounded-full mt-2 overflow-hidden border border-gray-800">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-pink-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, share))}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">{share}% share</span>
                    <span className="text-base font-black text-red-500">₹{movie.ticketRevenue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/*  MULTIPLEX THEATER FINANCIAL PERFORMANCE BREAKDOWN */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-300">
             Multiplex Revenue Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.theatreStats?.map((t) => (
              <div
                key={t._id}
                className="bg-[#0F0F17]/80 border border-gray-800/80 p-6 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-4 hover:border-red-500/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
                    <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                      <span> {t._id} Multiplex</span>
                    </h3>
                    <span className="text-xs font-black text-red-400 bg-red-950/80 border border-red-800 px-2.5 py-0.5 rounded-full">
                      Total: ₹{t.totalRevenue}
                    </span>
                  </div>

                  {/* Movies playing */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    {t.movies?.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-gray-300">
                        <span className="truncate pr-2">🎬 {m.title}</span>
                        <span className="font-mono text-gray-400">₹{m.revenue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stream Breakdown */}
                <div className="pt-3 border-t border-gray-800/80 space-y-1.5 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span> Ticket Revenue:</span>
                    <span className="text-white font-semibold">₹{t.ticketRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span> Refreshments F&B:</span>
                    <span className="text-white font-semibold">₹{t.snackRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span> Parking Pass:</span>
                    <span className="text-white font-semibold">₹{t.parkingRevenue}</span>
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
  </div>
  );
}

function StatBox({ title, value, color, icon }) {
  return (
    <div className="bg-[#0F0F17]/90 border border-gray-800/80 p-5 rounded-3xl backdrop-blur-2xl shadow-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value || 0}</p>
    </div>
  );
}
