require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

/* ─────────────────────────────────────────────
   Connect to MongoDB
───────────────────────────────────────────── */
connectDB();

/* ─────────────────────────────────────────────
   CORS
   React + Vite frontend:
   http://localhost:5173
───────────────────────────────────────────── */
app.use(
    cors({
        origin: function (origin, callback) {
            const allowedExact = [
                "http://localhost:5173",
            ];

            // Allow requests without an origin
            // (Postman, curl, mobile apps, etc.)
            if (!origin) {
                return callback(null, true);
            }

            // Allow local development
            if (allowedExact.includes(origin)) {
                return callback(null, true);
            }

            // Allow Vercel deployments and preview URLs
            if (origin.endsWith(".vercel.app")) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        credentials: true,
    })
);

/* ─────────────────────────────────────────────
   Body Parser
───────────────────────────────────────────── */
app.use(express.json());

/* ─────────────────────────────────────────────
   Health Check
───────────────────────────────────────────── */
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "XavierCinema API is running",
    });
});

/* ─────────────────────────────────────────────
   API Routes
───────────────────────────────────────────── */

app.use(
    "/api/auth",
    require("./routes/authRoutes")
);

app.use(
    "/api/movies",
    require("./routes/movieRoutes")
);

app.use(
    "/api/shows",
    require("./routes/showRoutes")
);

app.use(
    "/api/bookings",
    require("./routes/bookingRoutes")
);

app.use(
    "/api/snacks",
    require("./routes/snackRoutes")
);

app.use(
    "/api/parking",
    require("./routes/parkingRoutes")
);

app.use(
    "/api/users",
    require("./routes/userRoutes")
);

app.use(
    "/api/analytics",
    require("./routes/analyticsRoutes")
);

app.use(
    "/api/reviews",
    require("./routes/reviewRoutes")
);

app.use(
    "/api/coupons",
    require("./routes/couponRoutes")
);

app.use(
    "/api/snack-orders",
    require("./routes/snackOrderRoutes")
);

/* ─────────────────────────────────────────────
   404 Handler
───────────────────────────────────────────── */
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});

/* ─────────────────────────────────────────────
   Global Error Handler
───────────────────────────────────────────── */
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
    });
});

/* ─────────────────────────────────────────────
   Start Server
───────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `XavierCinema server running on http://localhost:${PORT}`
    );
});