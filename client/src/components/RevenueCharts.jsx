import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js modules
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

/* =========================================================
   CURRENCY FORMATTERS (INSTANTIATED ONCE)
========================================================= */
const fullCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCurrency = (value, compact = false) => {
  const amount = Number(value) || 0;
  return compact
    ? compactCurrencyFormatter.format(amount)
    : fullCurrencyFormatter.format(amount);
};

/* =========================================================
   EMPTY STATE COMPONENT
========================================================= */
const EmptyChart = ({ message }) => (
  <div className="h-[320px] sm:h-[360px] flex items-center justify-center rounded-xl bg-gray-950/50 border border-dashed border-gray-800/80">
    <div className="text-center px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 border border-gray-800 text-2xl mb-3 shadow-inner">
        
      </div>
      <p className="text-gray-300 font-medium text-sm">{message}</p>
      <p className="text-gray-500 text-xs mt-1">
        Revenue insights will auto-populate once sales data is recorded.
      </p>
    </div>
  </div>
);

function RevenueCharts({ movieStats = [], theatreStats = [] }) {
  const safeMovieStats = useMemo(
    () => (Array.isArray(movieStats) ? movieStats : []),
    [movieStats]
  );

  const safeTheatreStats = useMemo(
    () => (Array.isArray(theatreStats) ? theatreStats : []),
    [theatreStats]
  );

  /* =========================================================
     CHART DATA DEFINITIONS
  ========================================================= */
  const movieData = useMemo(() => {
    return {
      labels: safeMovieStats.map((movie) => movie?.title || "Unknown Movie"),
      datasets: [
        {
          label: "Ticket Revenue",
          data: safeMovieStats.map((movie) => Number(movie?.ticketRevenue) || 0),
          backgroundColor: "#f43f5e",
          hoverBackgroundColor: "#fb7185",
          borderColor: "#e11d48",
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 48,
        },
      ],
    };
  }, [safeMovieStats]);

  const theatreData = useMemo(() => {
    return {
      labels: safeTheatreStats.map((theatre) => theatre?.name || theatre?._id || "Unknown Theatre"),
      datasets: [
        {
          label: "Tickets",
          data: safeTheatreStats.map((theatre) => Number(theatre?.ticketRevenue) || 0),
          backgroundColor: "#3b82f6",
          hoverBackgroundColor: "#60a5fa",
          borderColor: "#2563eb",
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 36,
        },
        {
          label: "Snacks",
          data: safeTheatreStats.map((theatre) => Number(theatre?.snackRevenue) || 0),
          backgroundColor: "#eab308",
          hoverBackgroundColor: "#facc15",
          borderColor: "#ca8a04",
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 36,
        },
        {
          label: "Parking",
          data: safeTheatreStats.map((theatre) => Number(theatre?.parkingRevenue) || 0),
          backgroundColor: "#10b981",
          hoverBackgroundColor: "#34d399",
          borderColor: "#059669",
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 36,
        },
      ],
    };
  }, [safeTheatreStats]);

  /* =========================================================
     BASE CHART CONFIG GENERATOR
  ========================================================= */
  const getChartOptions = (xAxisLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: {
          color: "#9ca3af",
          font: {
            size: 12,
            weight: "600",
            family: "Inter, system-ui, sans-serif",
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        borderColor: "#1e293b",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        titleFont: {
          size: 13,
          weight: "700",
        },
        bodyFont: {
          size: 12,
        },
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: (context) => {
            const value = context.raw || 0;
            return ` ${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          color: "#6b7280",
          font: {
            size: 12,
            weight: "600",
          },
          padding: { top: 10 },
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 11,
          },
          maxRotation: 30,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
        },
        grid: {
          display: false,
        },
        border: {
          color: "#1f2937",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Revenue (₹)",
          color: "#6b7280",
          font: {
            size: 12,
            weight: "600",
          },
          padding: { bottom: 10 },
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 11,
          },
          callback: (value) => formatCurrency(value, true),
        },
        grid: {
          color: "rgba(31, 41, 55, 0.6)",
        },
        border: {
          dash: [4, 4],
          color: "transparent",
        },
      },
    },
  });

  const movieOptions = useMemo(() => getChartOptions("Movies"), []);
  const theatreOptions = useMemo(() => getChartOptions("Theatres"), []);

  return (
    <div className="space-y-8">
      {/* MOVIE REVENUE CARD */}
      <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800/80 p-5 sm:p-6 rounded-2xl shadow-xl transition-all duration-200 hover:border-gray-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2 border-b border-gray-800/60 pb-4">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              Movie Revenue Analysis
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Ticket earnings breakdown for current theatrical releases
            </p>
          </div>
        </div>

        {safeMovieStats.length === 0 ? (
          <EmptyChart message="No movie revenue data available." />
        ) : (
          <div className="relative h-[300px] sm:h-[360px]">
            <Bar data={movieData} options={movieOptions} />
          </div>
        )}
      </div>

      {/* THEATRE REVENUE CARD */}
      <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800/80 p-5 sm:p-6 rounded-2xl shadow-xl transition-all duration-200 hover:border-gray-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2 border-b border-gray-800/60 pb-4">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              Theatre Revenue Streams
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Categorized revenue breakdown across tickets, snacks, and parking
            </p>
          </div>
        </div>

        {safeTheatreStats.length === 0 ? (
          <EmptyChart message="No theatre revenue data available." />
        ) : (
          <div className="relative h-[320px] sm:h-[380px]">
            <Bar data={theatreData} options={theatreOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default RevenueCharts;