// frontend/src/pages/Bookings.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserContext from '../context/UserContext';
import { getMyBookings, cancelBooking } from '../api/api';
import QRCode from 'react-qr-code';
import './Bookings.css'; // Ensure CSS is imported

const Bookings = () => {
    const { user, isAuthenticated } = useContext(UserContext);
    const navigate = useNavigate();
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [pastBookings, setPastBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellationError, setCancellationError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            console.log("[Bookings] User not authenticated, redirecting.");
            navigate('/login');
            return;
        }

        let isMounted = true;
        const fetchBookings = async () => {
            setLoading(true);
            setError(null);
            setCancellationError(null);
            setUpcomingBookings([]);
            setPastBookings([]);

            try {
                console.log("[Bookings] Fetching user bookings...");
                const data = await getMyBookings();
                console.log("[Bookings] Received booking data:", data);

                if (!isMounted) return;

                if (Array.isArray(data)) {
                    const now = new Date();
                    const upcoming = [];
                    const past = [];

                    data.forEach(booking => {
                        if (!booking || !booking.start_time || !booking._id) {
                            console.warn("[Bookings] Skipping booking due to missing critical data:", booking);
                            return;
                        }
                        const showtimeDateTime = new Date(booking.start_time);
                        if (showtimeDateTime >= now && booking.status === 'active') {
                            upcoming.push(booking);
                        } else {
                            past.push(booking);
                        }
                    });

                    upcoming.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
                    past.sort((a, b) => new Date(b.booking_date || b.start_time) - new Date(a.booking_date || a.start_time));

                    setUpcomingBookings(upcoming);
                    setPastBookings(past);
                } else {
                     console.error("[Bookings] Expected an array from getMyBookings, received:", data);
                     setError("Received invalid data for booking history.");
                }

            } catch (err) {
                console.error("Error fetching bookings:", err.response?.data || err);
                if (isMounted) {
                    setError(err.response?.data?.message || 'Failed to load booking history.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchBookings();

        return () => { isMounted = false; };
    }, [isAuthenticated, navigate]);

    const handleCancelBooking = async (bookingId) => {
         if (!bookingId) return;
         const bookingToCancel = upcomingBookings.find(b => b._id === bookingId);
         if (!bookingToCancel) return;

         if (!window.confirm(`Are you sure you want to cancel your booking for "${bookingToCancel.movie_title}" on ${new Date(bookingToCancel.start_time).toLocaleDateString()}? This cannot be undone.`)) {
             return;
         }

        setCancellationError(null);
        setCancellingId(bookingId);
        try {
            console.log(`[Bookings] Attempting to cancel booking ID: ${bookingId}`);
            await cancelBooking(bookingId);
            console.log(`[Bookings] Cancellation successful for ID: ${bookingId}`);

            const cancelledBooking = { ...bookingToCancel, status: 'user_cancelled' };

            setUpcomingBookings(prev => prev.filter(booking => booking._id !== bookingId));
            setPastBookings(prev => [cancelledBooking, ...prev].sort((a, b) => new Date(b.booking_date || b.start_time) - new Date(a.booking_date || a.start_time)));

            alert('Booking cancelled successfully.');

        } catch (error) {
            console.error('Error cancelling booking:', error.response?.data || error);
            setCancellationError(error.response?.data?.message || 'Failed to cancel booking.');
        } finally {
            setCancellingId(null);
        }
    };

    const handleBookingClick = (booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
    };

    if (loading) {
        return <div className="bookings-container loading">Loading booking history...</div>;
    }

    const renderBookingCard = (booking) => {
         const bookingId = booking._id;
         if (!bookingId) {
             console.error("[Bookings] Cannot render card, booking missing _id:", booking);
             return null;
         }

         const showtime = new Date(booking.start_time);
         const bookingDateObj = new Date(booking.booking_date || booking.createdAt); // Get the Date object
         const now = new Date();

         const timeUntilShowtime = showtime.getTime() - now.getTime();
         const isCancelable = booking.status === 'active' && timeUntilShowtime > (2 * 60 * 60 * 1000);

         // *** CHANGE IS HERE: Format the bookingDateObj ***
         const formattedBookingDate = !isNaN(bookingDateObj.getTime()) // Check if date is valid
            ? bookingDateObj.toLocaleDateString('en-GB', { // Use 'en-GB' or similar locale
                  day: 'numeric',   // e.g., 1, 2, 31
                  month: 'short',   // e.g., Jan, Feb, Apr
                  year: 'numeric'   // e.g., 2023, 2024
              })
            : 'N/A'; // Fallback for invalid date
        // *** END OF CHANGE ***

         let statusBadge = null;
         let statusClass = booking.status || 'unknown';
         let badgeClass = '';
         let statusText = '';

         switch (booking.status) {
            case 'active':
                 if (showtime < now) {
                     statusBadge = <span className="status-badge completed">Completed</span>;
                     statusClass = 'completed';
                     badgeClass = 'completed';
                 } else {
                     statusBadge = null;
                 }
                 break;
            case 'cancelled':
                 statusText = 'Show Cancelled';
                 badgeClass = 'showtime-cancelled';
                 statusClass = 'cancelled';
                 break;
            case 'user_cancelled':
                 statusText = 'Booking Cancelled';
                 badgeClass = 'user-cancelled';
                 statusClass = 'cancelled';
                 break;
            case 'completed':
                 statusText = 'Completed';
                 badgeClass = 'completed';
                 statusClass = 'completed';
                 break;
            default:
                 statusText = booking.status;
                 badgeClass = 'unknown';
                 break;
         }

         if (statusText) {
             statusBadge = <span className={`status-badge ${badgeClass}`}>{statusText}</span>;
         }

         return (
             <div 
                 key={bookingId} 
                 className={`booking-card ${statusClass}`}
                 onClick={() => handleBookingClick(booking)}
                 style={{ cursor: 'pointer' }}
             >
                 <div className="card-content">
                     <div className="card-left">
                         <img
                             src={booking.poster_url || '/default_poster.jpg'}
                             alt={booking.movie_title || 'Movie Poster'}
                             className="movie-poster"
                             onError={(e) => { e.target.onerror = null; e.target.src='/default_poster.jpg'}}
                         />
                         <div className="qr-code-container">
                             <QRCode 
                                 value={bookingId}
                                 fgColor='#75d402'
                                 bgColor='linear-gradient(145deg, #121212, #1a1a1a)'
                                 size={80}
                                 level="M"
                                 className="booking-qr-code"
                             />
                         </div>
                     </div>
                     <div className="card-details">
                         <div className="card-header">
                             <h3 className="movie-title">{booking.movie_title}</h3>
                             {statusBadge}
                         </div>
                         <div className="showtime-info">
                             <div className="time-block">
                                 <span className="date">
                                     {showtime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                 </span>
                                 <span className="time">
                                     {showtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                             </div>
                             <div className="screen-info">Screen {booking.screen_number}</div>
                         </div>
                         <div className="info-grid">
                             <div className="info-item">
                                 <span className="label">Theater</span>
                                 <span className="value">{booking.theater_name}</span>
                             </div>
                             <div className="info-item">
                                 <span className="label">Seats ({booking.number_of_seats ?? 0})</span>
                                 <span className="value seats">
                                     {statusClass === 'cancelled' 
                                         ? '-' 
                                         : (booking.seat_numbers 
                                             ? booking.seat_numbers.split(',').map(seat => seat.trim().replace(/\.0$/, '')).join(', ') 
                                             : '-')}
                                 </span>
                             </div>
                             <div className="info-item">
                                 <span className="label">Booked On</span>
                                 {/* *** CHANGE IS HERE: Use the formatted date *** */}
                                 <span className="value">{formattedBookingDate}</span>
                                 {/* *** END OF CHANGE *** */}
                             </div>
                         </div>
                         <div className="card-footer">
                             <div className="price">₹{booking.total_amount?.toFixed(2) || '0.00'}</div>
                             {isCancelable && (
                                <button
                                    className="cancel-btn"
                                    onClick={() => handleCancelBooking(bookingId)}
                                    disabled={cancellingId === bookingId}
                                >
                                     {cancellingId === bookingId ? 'Cancelling...' : 'Cancel Booking'}
                                </button>
                              )}
                         </div>
                     </div>
                 </div>
             </div>
         );
     };

    return (
        <div className="bookings-container">
            <div className="bookings-header">
                <h1>Booking History</h1>
            </div>

            {error && <div className="error-message">{error}</div>}
            {cancellationError && <div className="error-message">{cancellationError}</div>}

            <section className="bookings-section">
                <div className="section-header">
                    <h2>Upcoming Screenings</h2>
                    <span className="badge">{upcomingBookings.length}</span>
                </div>
                {upcomingBookings.length > 0 ? (
                     <div className="bookings-grid">
                         {upcomingBookings.map(renderBookingCard)}
                    </div>
                 ) : (
                    !loading && <div className="empty-state">No upcoming bookings found. <Link to="/movies">Book Tickets</Link></div>
                 )
                }
            </section>

            <section className="bookings-section">
                <div className="section-header">
                    <h2>Past & Cancelled Bookings</h2>
                    <span className="badge">{pastBookings.length}</span>
                </div>
                {pastBookings.length > 0 ? (
                    <div className="bookings-grid">
                         {pastBookings.map(renderBookingCard)}
                     </div>
                 ) : (
                    !loading && <div className="empty-state">No past or cancelled bookings found.</div>
                 )
                }
            </section>

            {isModalOpen && selectedBooking && (
                <div className="booking-modal-overlay" onClick={closeModal}>
                    <div className="booking-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-booking-card">
                            {renderBookingCard(selectedBooking)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bookings;