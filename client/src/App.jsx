import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import AdminGate from "./components/AdminGate";

import Home from "./pages/Home";

const Movies = lazy(() => import("./pages/Movies"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Seats = lazy(() => import("./pages/Seats"));
const AddOns = lazy(() => import("./pages/AddOns"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const VerifyTicket = lazy(() => import("./pages/VerifyTicket"));
const SnacksHub = lazy(() => import("./pages/SnacksHub"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminScan = lazy(() => import("./pages/AdminScan"));
const Scanner = lazy(() => import("./pages/Scanner"));

const AdminMovies = lazy(() => import("./pages/admin/AdminMovies"));
const AdminShows = lazy(() => import("./pages/admin/AdminShows"));
const AdminSnacks = lazy(() => import("./pages/admin/AdminSnacks"));
const AdminParking = lazy(() => import("./pages/admin/AdminParking"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminIoTConsole = lazy(() => import("./pages/admin/AdminIoTConsole"));

const GiftCards = lazy(() => import("./pages/GiftCards"));
const LoyaltyWallet = lazy(() => import("./pages/LoyaltyWallet"));
const Watchlist = lazy(() => import("./pages/Watchlist"));

function PageLoader() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#0B0B0F] text-white">
      <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-4"></div>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
        Loading CineBook...
      </span>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-red-500">404</h1>
        <p className="text-white text-lg font-bold">Page Not Found</p>
        <a
          href="/"
          className="inline-block bg-red-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-red-700 transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:movieId" element={<MovieDetails />} />
          <Route path="/movie/:movieId" element={<MovieDetails />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/gift-cards" element={<GiftCards />} />
          <Route path="/loyalty" element={<LoyaltyWallet />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:bookingId" element={<VerifyTicket />} />
          <Route path="/snacks" element={<SnacksHub />} />
          <Route path="/food-beverages" element={<SnacksHub />} />

          
          <Route
            path="/seats/:showId"
            element={
              <PrivateRoute>
                <Seats />
              </PrivateRoute>
            }
          />

          <Route
            path="/addons/:showId"
            element={
              <PrivateRoute>
                <AddOns />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-bookings"
            element={
              <PrivateRoute>
                <MyBookings />
              </PrivateRoute>
            }
          />

          <Route
            path="/mybookings"
            element={
              <PrivateRoute>
                <MyBookings />
              </PrivateRoute>
            }
          />

          <Route
            path="/scanner"
            element={
              <PrivateRoute>
                <Scanner />
              </PrivateRoute>
            }
          />

          
          <Route
            path="/admin"
            element={
              <AdminGate>
                <Admin />
              </AdminGate>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminGate>
                <AdminDashboard />
              </AdminGate>
            }
          />

          <Route
            path="/admin/movies"
            element={
              <AdminGate>
                <AdminMovies />
              </AdminGate>
            }
          />

          <Route
            path="/admin/shows"
            element={
              <AdminGate>
                <AdminShows />
              </AdminGate>
            }
          />

          <Route
            path="/admin/snacks"
            element={
              <AdminGate>
                <AdminSnacks />
              </AdminGate>
            }
          />

          <Route
            path="/admin/parking"
            element={
              <AdminGate>
                <AdminParking />
              </AdminGate>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <AdminGate>
                <AdminAnalytics />
              </AdminGate>
            }
          />

          <Route
            path="/admin/iot"
            element={
              <AdminGate>
                <AdminIoTConsole />
              </AdminGate>
            }
          />

          <Route
            path="/admin/scan"
            element={
              <AdminGate>
                <AdminScan />
              </AdminGate>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
    </BrowserRouter>
  );
}