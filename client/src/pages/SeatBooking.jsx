// frontend/src/pages/SeatBooking.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'; // Added useLocation
import SeatLayout from '../components/SeatLayout';
import { UserContext } from '../context/UserContext';
import api, { getShowtimeDetailsById, createBooking } from '../api/api';
import './SeatBooking.css';

const SeatBooking = () => {
    const { screenId, showtimeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); // Get location for redirect state
    const { isAuthenticated, user } = useContext(UserContext);

    // State
    const [details, setDetails] = useState({
        showtime: null, movie: null, screen: null, theater: null,
    });
    const [selectedSeatIds, setSelectedSeatIds] = useState([]);
    // ** RENAME state variable **
    const [selectedSeatFullData, setSelectedSeatFullData] = useState([]); // Renamed from setSeatDataForLabels
    // ** END RENAME **
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);
    const [promoCode, setPromoCode] = useState('');
    const [discountInfo, setDiscountInfo] = useState({ discount: 0, finalTotal: 0, applied: null });


    // Fetch Combined Details
    useEffect(() => {
        let isMounted = true;
        const fetchDetails = async () => {
            if (!showtimeId || !screenId) {
                 console.error("SeatBooking: Invalid screenId or showtimeId", { screenId, showtimeId });
                 if (isMounted) setError("Invalid showtime/screen info.");
                 setIsLoading(false); return;
            }
            setIsLoading(true); setError('');
            try {
                console.log(`[SeatBooking] Fetching details for showtimeId: ${showtimeId}`);
                const responseData = await getShowtimeDetailsById(showtimeId);
                console.log("[SeatBooking] Received details:", responseData);
                if (isMounted && responseData?.movie && responseData?.screen && responseData?.theater) {
                    setDetails({
                        showtime: {
                             _id: responseData.showtime_id, start_time: responseData.start_time,
                             language: responseData.show_language, status: responseData.showtime_status,
                        },
                        movie: responseData.movie, screen: responseData.screen, theater: responseData.theater,
                    });
                } else if (isMounted) {
                     console.error("[SeatBooking] Invalid data structure:", responseData);
                     setError("Could not load complete showtime details.");
                     setDetails({ showtime: null, movie: null, screen: null, theater: null });
                }
            } catch (err) {
                console.error("Error fetching details:", err.response?.data || err);
                 if (isMounted) setError(err.response?.data?.message || "Could not load details.");
                 setDetails({ showtime: null, movie: null, screen: null, theater: null });
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchDetails();
        return () => { isMounted = false; };
    }, [showtimeId, screenId]);

    // Callback from SeatLayout
    const handleSeatsSelected = useCallback((seatIds, seatsFullData) => {
        console.log("[SeatBooking] Seats selected:", { seatIds, seatsFullData });
        setError(''); setBookingError('');
        setSelectedSeatIds(seatIds);
        setSelectedSeatFullData(seatsFullData);
        const newTotal = seatsFullData.reduce((sum, seat) => sum + (seat?.price || 0), 0);
        setTotalAmount(newTotal);
        setDiscountInfo({ discount: 0, finalTotal: newTotal, applied: null });
    }, []);

    // No evaluation here; moved to Checkout page

    // Calculate selected seat labels
    const getSelectedSeatLabels = () => {
        // Format seat labels to remove decimal points
        return selectedSeatFullData
            .map(seat => {
                // Remove decimal part from seat number if it exists
                const seatNumber = seat.seat_number.toString().split('.')[0];
                return seatNumber;
            })
            .sort()
            .join(', ') || 'None';
    };
    

    // Handle clicking "Proceed to Book"
    const handleOpenConfirmation = async () => {
        setBookingError('');
        if (!isAuthenticated) {
            setBookingError(
                <div className="login-prompt">
                    Please login to proceed with booking
                    <button 
                        className="login-button" 
                        onClick={() => navigate('/login', { state: { from: location } })}
                    >
                        Login Now
                    </button>
                </div>
            );
            return;
        }
        if (selectedSeatIds.length === 0) {
            setBookingError('Please select at least one seat.');
            return;
        }

        // Create booking first
        setIsBooking(true);
        try {
            const bookingData = { 
                showtimeId: showtimeId, 
                seatIds: selectedSeatIds,
                totalAmount: totalAmount
            };
            console.log("[SeatBooking] Creating booking:", bookingData);
            const response = await createBooking(bookingData);
            console.log("[SeatBooking] Booking created:", response);

            // Navigate to checkout page with booking info
            navigate('/checkout', { state: { booking: {
                _id: response.bookingId,
                subtotalAmount: totalAmount,
                discountAmount: 0,
                totalAmount: totalAmount,
                movieTitle: details.movie?.title,
                theaterName: details.theater?.name,
                screenNumber: details.screen?.screen_number,
                seatLabels: getSelectedSeatLabels(),
                showtimeTime: details.showtime?.start_time,
                userName: user?.name,
                userEmail: user?.email
            } } });
        } catch (error) {
            console.error("[SeatBooking] Booking creation failed:", error.response?.data || error);
            let friendlyErrorMessage = 'Booking failed. Please try again.';
            if (error.response?.data?.message) {
                friendlyErrorMessage = error.response.data.message;
            }
            if (error.response?.data?.unavailableSeats) {
                friendlyErrorMessage += ` Unavailable: ${error.response.data.unavailableSeats.join(', ')}. Refresh.`;
            }
            setBookingError(friendlyErrorMessage);
        } finally {
            setIsBooking(false);
        }
    };

    // Payment handled in Checkout

    // --- Render Logic ---
    if (isLoading) {
        return <div className="loading">Loading showtime details...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!details.movie) {
        return <div className="error-message">No showtime details available.</div>;
    }

    // If not authenticated, show login prompt instead of seat layout and summary
    if (!isAuthenticated) {
        return (
            <div className="seat-booking-container">
                <h2>Select Seats</h2>
                <div className="login-prompt">
                    Please login to proceed with booking
                    <button 
                        className="login-button" 
                        onClick={() => navigate('/login', { state: { from: location } })}
                    >
                        Login Now
                    </button>
                </div>
            </div>
        );
    }

    console.log("[SeatBooking] Rendering with details:", { screenId, showtimeId, details });

    return (
        <div className="seat-booking-container">
            <h2>Select Seats</h2>
            {/* Display Show/Movie/Theater Info */}
            <div className="seat-booking-container">
                <div className="screen-info">
                    <span className="screen-label">Screen:</span>
                    <span className="screen-number">{details.screen?.screen_number}</span>
                </div>
            </div>
            {/* Display booking errors */}
            {bookingError && (
                <div className="error-message">
                    {bookingError}
                </div>
            )}

            {/* Seat Layout Component */}
            <SeatLayout onSeatsSelected={handleSeatsSelected} />

            {/* Booking Summary and Action Bar */}
            <div className="booking-summary-bar">
                <div className="summary-content">
                    <div className="summary-item">
                        <span className="summary-label">Selected Seats:</span>
                        <span className="summary-value">{selectedSeatIds.length}</span>
                         {selectedSeatIds.length > 0 && (
                             <span className='selected-seat-labels'>{getSelectedSeatLabels()}</span>
                         )}
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Total Amount:</span>
                        <span className="summary-value">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <button className="book-now-button" onClick={handleOpenConfirmation} disabled={selectedSeatIds.length === 0 || isBooking} >
                        {isBooking ? 'Processing...' : (selectedSeatIds.length > 0 ? 'Proceed to Book' : 'Select Seats')}
                    </button>
                </div>
            </div>

            {/* Modal removed; flow continues in Checkout page */}
        </div>
    );
};

export default SeatBooking;