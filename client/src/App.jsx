// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CityProvider } from './context/CityContext';
import { UserProvider } from './context/UserContext';
import { LoadingProvider } from './context/LoadingContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BottomNavigation from './components/BottomNavigation';
import Movies from './pages/Movies';
import MobileSearch from './pages/MobileSearch';
import MovieDetails from './pages/MovieDetails';
import SeatBooking from './pages/SeatBooking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminSignup from './pages/AdminSignup';
import AdminPanel from './pages/AdminPanel';
import CreateMovie from './pages/CreateMovie';
import CreateShow from './pages/CreateShow';
import DeleteShow from './pages/DeleteShow';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import Showtimes from "./pages/Showtimes";
import TheatreAdminSignup from './pages/TheatreAdminSignup';
import CreateScreen from './pages/CreateScreen';
import TheaterList from './pages/TheaterList';
import ScreenList from './pages/ScreenList';
import Profile from './pages/Profile';
import MyAccount from './pages/MyAccount';
import Bookings from './pages/Bookings';
import EditMovie from './pages/EditMovie';
import DeleteMovie from './pages/DeleteMovie';
import AddMultipleShows from './pages/AddMultipleShows';
import TheaterDetailsPage from './pages/TheaterDetails';
import QRScanner from './pages/QRScanner';
import TheaterDashboard from './pages/TheaterDashboard';
import OffersAdmin from './pages/OffersAdmin';
import Checkout from './pages/Checkout';

// Create a wrapper component to handle Footer rendering
const AppContent = () => {
    const location = useLocation();
    const isSeatBookingPage = location.pathname.includes('/booking/screen/');

    return (
        <div className="dark-theme">
            <Navbar />
            <div className="container">
                <Routes>
                    {/* Home Route */}
                    <Route path="/" element={<Home />} />

                    {/* Public routes - Login, Signup, etc. */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/adminsignup" element={<AdminSignup />} />
                    <Route path="/theatreadminsignup" element={<TheatreAdminSignup />} />

                    {/* Theater details route */}
                    <Route path="/theaters/:theaterId" element={<TheaterDetailsPage />} />

                    {/* Admin routes protected by ProtectedRoute component */}
                    <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                    <Route path="/admin/theater-dashboard" element={<ProtectedRoute><TheaterDashboard /></ProtectedRoute>} />
                    <Route path="/admin/offers" element={<ProtectedRoute><OffersAdmin /></ProtectedRoute>} />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/admin/theaters" element={<ProtectedRoute><TheaterList /></ProtectedRoute>} />
                    <Route path="/admin/theaters/:theaterId/screens" element={<ProtectedRoute><ScreenList /></ProtectedRoute>} />
                    <Route path="/admin/theaters/:theaterId/create-screen" element={<ProtectedRoute><CreateScreen /></ProtectedRoute>} />

                    {/* Movie management routes */}
                    <Route path="/admin/add-movie" element={<ProtectedRoute><CreateMovie /></ProtectedRoute>} />
                    <Route path="/admin/edit-movie" element={<ProtectedRoute><EditMovie /></ProtectedRoute>} />
                    <Route path="/admin/delete-movie" element={<ProtectedRoute><DeleteMovie /></ProtectedRoute>} />

                    {/* Show management routes */}
                    <Route path="/admin/add-show" element={<ProtectedRoute><CreateShow /></ProtectedRoute>} />
                    <Route path="/admin/add-multiple-shows" element={<ProtectedRoute><AddMultipleShows /></ProtectedRoute>} />
                    <Route path="/admin/delete-show" element={<ProtectedRoute><DeleteShow /></ProtectedRoute>} />

                    {/* QR Scanner route */}
                    <Route path="/admin/scanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />

                    {/* Movie and showtime browsing routes */}
                    <Route path="/search" element={<MobileSearch />} />
                    <Route path="/movies" element={<Movies />} />
                    <Route path="/movies/:id" element={<MovieDetails />} />
                    <Route path="/showtimes/:id" element={<Showtimes />} />
                    <Route path="/booking/screen/:screenId/showtime/:showtimeId" element={<SeatBooking />} />

                    {/* User profile and bookings */}
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/myaccount" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
                    <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
                </Routes>
            </div>
            {!isSeatBookingPage && <Footer />}
            {!isSeatBookingPage && <BottomNavigation />}
        </div>
    );
};

function App() {
    return (
        <UserProvider>
            <CityProvider>
                <LoadingProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </LoadingProvider>
            </CityProvider>
        </UserProvider>
    );
}

export default App;