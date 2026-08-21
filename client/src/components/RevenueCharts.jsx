import React from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register only the Chart.js components required by this component
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const EmptyChart = ({ message }) => (
  <div className="h-[350px] flex items-center justify-center">
    <div className="text-center">
      <div className="text-4xl mb-3">📊</div>
      <p className="text-gray-400 text-sm">
        {message}
      </p>
      <p className="text-gray-600 text-xs mt-1">
        Revenue data will appear here once available.
      </p>
    </div>
  </div>
);

function RevenueCharts({ movieStats = [], theatreStats = [] }) {
  /* =========================================================
     CURRENCY FORMATTER
  ========================================================= */

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /* =========================================================
     SAFE DATA
  ========================================================= */

  const safeMovieStats = Array.isArray(movieStats)
    ? movieStats
    : [];

  const safeTheatreStats = Array.isArray(theatreStats)
    ? theatreStats
    : [];

  /* =========================================================
     MOVIE REVENUE CHART
  ========================================================= */

  const movieData = {
    labels: safeMovieStats.map(
      (movie) => movie?.title || "Unknown Movie"
    ),

    datasets: [
      {
        label: "Ticket Revenue",

        data: safeMovieStats.map(
          (movie) => Number(movie?.ticketRevenue) || 0
        ),

        backgroundColor: "#ef4444",
        borderColor: "#dc2626",
        borderWidth: 1,

        borderRadius: 8,

        maxBarThickness: 55,
      },
    ],
  };

  /* =========================================================
     THEATRE REVENUE CHART
  ========================================================= */

  const theatreData = {
    labels: safeTheatreStats.map(
      (theatre) => theatre?._id || "Unknown Theatre"
    ),

    datasets: [
      {
        label: "Tickets",

        data: safeTheatreStats.map(
          (theatre) => Number(theatre?.ticketRevenue) || 0
        ),

        backgroundColor: "#ef4444",
        borderColor: "#dc2626",
        borderWidth: 1,

        borderRadius: 6,

        maxBarThickness: 45,
      },

      {
        label: "Snacks",

        data: safeTheatreStats.map(
          (theatre) => Number(theatre?.snackRevenue) || 0
        ),

        backgroundColor: "#facc15",
        borderColor: "#eab308",
        borderWidth: 1,

        borderRadius: 6,

        maxBarThickness: 45,
      },

      {
        label: "Parking",

        data: safeTheatreStats.map(
          (theatre) => Number(theatre?.parkingRevenue) || 0
        ),

        backgroundColor: "#22c55e",
        borderColor: "#16a34a",
        borderWidth: 1,

        borderRadius: 6,

        maxBarThickness: 45,
      },
    ],
  };

  /* =========================================================
     COMMON CHART OPTIONS
  ========================================================= */

  const chartOptions = {
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

        labels: {
          color: "#ffffff",

          font: {
            size: 12,
            weight: "600",
          },

          padding: 20,

          usePointStyle: true,

          pointStyle: "rectRounded",
        },
      },

      tooltip: {
        backgroundColor: "#111827",

        titleColor: "#ffffff",

        bodyColor: "#e5e7eb",

        borderColor: "#374151",

        borderWidth: 1,

        padding: 12,

        titleFont: {
          size: 13,
          weight: "700",
        },

        bodyFont: {
          size: 12,
        },

        callbacks: {
          label: function (context) {
            const value = context.raw || 0;

            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },

    scales: {
      x: {
        title: {
          display: true,

          text: "Movie / Theatre",

          color: "#9ca3af",

          font: {
            size: 12,
            weight: "600",
          },
        },

        ticks: {
          color: "#ffffff",

          font: {
            size: 11,
          },

          maxRotation: 45,

          minRotation: 0,

          autoSkip: true,

          maxTicksLimit: 12,
        },

        grid: {
          color: "rgba(55, 65, 81, 0.5)",

          drawBorder: false,
        },
      },

      y: {
        beginAtZero: true,

        title: {
          display: true,

          text: "Revenue (₹)",

          color: "#9ca3af",

          font: {
            size: 12,
            weight: "600",
          },
        },

        ticks: {
          color: "#ffffff",

          font: {
            size: 11,
          },

          callback: function (value) {
            return formatCurrency(value);
          },
        },

        grid: {
          color: "rgba(55, 65, 81, 0.5)",

          drawBorder: false,
        },
      },
    },
  };



  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">

      {/* =====================================================
          MOVIE REVENUE
      ===================================================== */}

      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">

        <div className="mb-5">

          <h2 className="text-white font-bold text-base sm:text-lg">
            Movie Revenue Chart
          </h2>

          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Ticket revenue generated by each movie
          </p>

        </div>

        {safeMovieStats.length === 0 ? (
          <EmptyChart message="No movie revenue data available." />
        ) : (
          <div className="relative h-[300px] sm:h-[350px] lg:h-[400px]">
            <Bar
              data={movieData}
              options={chartOptions}
            />
          </div>
        )}

      </div>

      {/* =====================================================
          THEATRE REVENUE
      ===================================================== */}

      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">

        <div className="mb-5">

          <h2 className="text-white font-bold text-base sm:text-lg">
            Theatre Revenue Chart
          </h2>

          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Ticket, snacks and parking revenue by theatre
          </p>

        </div>

        {safeTheatreStats.length === 0 ? (
          <EmptyChart message="No theatre revenue data available." />
        ) : (
          <div className="relative h-[320px] sm:h-[380px] lg:h-[420px]">
            <Bar
              data={theatreData}
              options={chartOptions}
            />
          </div>
        )}

      </div>

    </div>
  );
}

export default RevenueCharts;