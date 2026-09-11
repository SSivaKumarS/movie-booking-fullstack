// src/pages/TheaterDetails.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
// *** Corrected Import Name ***
import { getTheaterDetails, getShowtimesByTheaterId } from "../api/api";
import moment from 'moment-timezone'; // Import moment-timezone
import { UserContext } from "../context/UserContext";
import { likeTheater, unlikeTheater } from "../api/api";
import "./TheaterDetails.css"; // Ensure this CSS file exists and is styled
// import { useCity } from "../context/CityContext"; // Keep if needed elsewhere, but not used in this component's logic

// Define the target timezone (consistent with backend and other components)
const TARGET_TIMEZONE = 'Asia/Kolkata';

const TheaterDetails = () => {
    const { theaterId } = useParams(); // Get theater ID from URL
    // const { selectedCity } = useCity(); // Context variable available if needed

    // State variables
    const [theater, setTheater] = useState(null);
    const [allShowtimes, setAllShowtimes] = useState([]); // Store raw showtimes from API
    const [groupedShowtimes, setGroupedShowtimes] = useState({}); // Showtimes grouped by movie title
    // Default date is today in IST, formatted as YYYY-MM-DD
    const [selectedDate, setSelectedDate] = useState(moment().tz(TARGET_TIMEZONE).format('YYYY-MM-DD'));
    const [loadingTheater, setLoadingTheater] = useState(true);
    const [loadingShowtimes, setLoadingShowtimes] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthenticated, user, setUser } = useContext(UserContext);
    const [isLiked, setIsLiked] = useState(false);

    // Effect to fetch Theater Details
    useEffect(() => {
        let isMounted = true;
        setLoadingTheater(true);
        setError(null); // Clear previous errors

        getTheaterDetails(theaterId)
            .then(data => {
                if (isMounted) {
                    // Adjust based on your actual API response structure for getTheaterDetails
                    // It might return { theater: {...} } or just the theater object
                    setTheater(data.theater || data);
                }
            })
            .catch(err => {
                console.error(`Error fetching theater details for ID ${theaterId}:`, err);
                if (isMounted) {
                     setError('Failed to load theater details.');
                     setTheater(null); // Ensure theater state is null on error
                }
            })
            .finally(() => {
                if (isMounted) setLoadingTheater(false);
            });

        return () => { isMounted = false; }; // Cleanup function
    }, [theaterId]); // Re-run only if theaterId changes

    // Sync local like state with user context
    useEffect(() => {
        if (!isAuthenticated || !user) { setIsLiked(false); return; }
        const liked = Array.isArray(user.likedTheaters) && user.likedTheaters.some(id => String(id) === String(theaterId));
        setIsLiked(liked);
    }, [isAuthenticated, user, theaterId]);

    // Effect to fetch Showtimes when theaterId or selectedDate changes
    useEffect(() => {
        if (!theaterId) {
             setAllShowtimes([]); // Clear showtimes if no theater ID
             setGroupedShowtimes({});
             return;
        }

        let isMounted = true;
        setLoadingShowtimes(true);
        setError(null); // Clear previous showtime errors
        setAllShowtimes([]); // Clear previous showtimes before fetching new ones
        setGroupedShowtimes({});

        // Prepare query parameters for the API call
        const queryParams = {
            date: selectedDate, // Pass selected date string
        };

        console.log(`Fetching showtimes for Theater ${theaterId}, Date: ${selectedDate}`);

        // *** Use the correctly imported function and parameters ***
        getShowtimesByTheaterId(theaterId, queryParams)
            .then(data => {
                if (isMounted) {
                    // Assuming the API returns an array of showtime objects directly
                    const fetchedShowtimes = Array.isArray(data) ? data : [];
                    console.log("Fetched Showtimes data:", fetchedShowtimes);
                    
                    // Process the showtimes to ensure all required data is available
                    const processedShowtimes = fetchedShowtimes.map(showtime => {
                        // Get the screen format from the API response
                        const screenFormat = showtime.screen_format || showtime.screen_id?.format || 'N/A';
                        console.log("Processing showtime:", {
                            id: showtime._id,
                            screen_id: showtime.screen_id,
                            original_format: showtime.screen_format,
                            computed_format: screenFormat
                        });
                        return {
                            ...showtime,
                            screen_format: screenFormat
                        };
                    });
                    
                    console.log("Processed Showtimes:", processedShowtimes);
                    setAllShowtimes(processedShowtimes);
                }
            })
            .catch(err => {
                console.error(`Error fetching showtimes for theater ${theaterId} on ${selectedDate}:`, err);
                if (isMounted) setError('Failed to load showtimes for the selected date.');
            })
            .finally(() => {
                if (isMounted) setLoadingShowtimes(false);
            });

        return () => { isMounted = false; }; // Cleanup function
    }, [theaterId, selectedDate]); // Re-run if theaterId or selectedDate changes

    // Effect to group showtimes whenever allShowtimes changes
     useEffect(() => {
         const groupShows = (shows) => {
            if (!Array.isArray(shows)) return {};

            const nowIST = moment().tz(TARGET_TIMEZONE); // Current time for filtering past shows

             return shows.reduce((acc, showtime) => {
                 // Skip shows with missing critical data or cancelled status
                 if (!showtime || !showtime.start_time) {
                    console.warn("Skipping showtime with missing data:", showtime);
                    return acc;
                 }

                 // Skip cancelled shows explicitly
                 if (showtime.status === 'cancelled') {
                    console.log("Skipping cancelled showtime:", showtime);
                    return acc;
                 }

                 // Filter out past showtimes
                 const showStartTimeIST = moment(showtime.start_time).tz(TARGET_TIMEZONE);
                 if (showStartTimeIST.isBefore(nowIST)) {
                    console.log("Skipping past showtime:", showtime);
                    return acc; // Skip past shows
                 }

                 // Use movie_title if available, otherwise fallback
                 const movieTitle = showtime.movie_id?.title || showtime.movie_title || 'Unknown Movie';

                 if (!acc[movieTitle]) {
                     acc[movieTitle] = { 
                         showtimes: [], 
                         movieId: showtime.movie_id?._id || showtime.movie_id 
                     };
                 }

                 // Add the showtime to the group with screen format
                 const showtimeWithFormat = {
                     ...showtime,
                     screen_format: showtime.screen_format || showtime.screen_id?.format || 'N/A'
                 };
                 acc[movieTitle].showtimes.push(showtimeWithFormat);
                 
                 // Sort showtimes within the movie group by time
                 acc[movieTitle].showtimes.sort((a, b) =>
                   moment(a.start_time).valueOf() - moment(b.start_time).valueOf()
                 );

                 return acc;
             }, {});
         };

         console.log("Grouping showtimes:", allShowtimes);
         const groupedResults = groupShows(allShowtimes);
         console.log("Grouped Showtimes:", groupedResults);
         setGroupedShowtimes(groupedResults);
     }, [allShowtimes]); // Re-run grouping when raw showtimes data updates

    // Add the getAvailabilityStatus function from Showtimes.jsx
    const getAvailabilityStatus = (showtime) => {
        const totalSeats = showtime.total_seats || 0;
        const bookedSeatsCount = showtime.booked_seats_count || 0;

        if (totalSeats === 0) {
            return { status: 'unknown' };
        }

        const availableSeats = totalSeats - bookedSeatsCount;
        const percentageAvailable = (availableSeats / totalSeats) * 100;

        if (availableSeats <= 0) {
            return { status: 'soldout' };
        } else if (percentageAvailable <= 10) {
            return { status: 'few' };
        } else if (percentageAvailable <= 50) {
            return { status: 'limited' };
        } else {
            return { status: 'plenty' };
        }
    };

    // Add the getStatusText function from Showtimes.jsx
    const getStatusText = (status) => {
        const statusMap = {
            few: 'Few Seats Left',
            limited: 'Limited Seats',
            soldout: 'Sold Out',
            plenty: ''
        };
        return statusMap[status] || '';
    };

    // --- Helper Functions ---

    // Generates date range for selector based on IST dates
    const generateDateRange = (startDate, days) => {
        const range = [];
        const current = moment(startDate).tz(TARGET_TIMEZONE).startOf('day');
        for (let i = 0; i < days; i++) {
            range.push(current.format('YYYY-MM-DD'));
            current.add(1, 'day');
        }
        return range;
    };

    // Format date for display in the date cards (using IST)
    const formatDateForCard = (dateString) => {
         const dateObj = moment.tz(dateString, 'YYYY-MM-DD', TARGET_TIMEZONE);
         const dayName = dateObj.format('ddd').toUpperCase();
         const dayOfMonth = dateObj.format('D');
         const monthName = dateObj.format('MMM').toUpperCase();
         return { dayName, dayOfMonth, monthName };
    };

    // Format time for display, ensuring IST
    const formatTimeIST = (utcTimeString) => {
        if (!utcTimeString) return 'N/A';
        return moment(utcTimeString).tz(TARGET_TIMEZONE).format('h:mm A'); // e.g., 2:30 PM
    };

    // --- Handlers ---
    const handleDateChange = (date) => { // date is 'YYYY-MM-DD' string
        setSelectedDate(date);
    };

    const toggleLike = async () => {
        if (!isAuthenticated) { alert('Please login to like theatres.'); return; }
        try {
            let data;
            if (isLiked) {
                data = await unlikeTheater(theaterId);
            } else {
                data = await likeTheater(theaterId);
            }
            setIsLiked(!isLiked);
            // update user context minimal fields
            if (setUser && user) {
                setUser({ ...user, likedTheaters: data.likedTheaters, movieNotifications: data.movieNotifications });
            }
        } catch (e) {
            console.error('Failed to toggle like', e);
            alert(e?.response?.data?.message || 'Failed to update like');
        }
    };

    // --- Render Logic ---
    if (loadingTheater) return <div className="loading">Loading Theater Details...</div>;
    // Show error only if theater details failed to load initially
    if (error && !theater) return <div className="error">{error}</div>;
    if (!theater) return <div className="error">Theater details not found (ID: {theaterId}).</div>;

    return (
        <div className="theater-details-page-container">
            {/* Theater Header */}
            <div className="theater-info-header">
                <div className="theater-name-container">
                    <h1>{theater.name}</h1>
                    {isAuthenticated && (
                        <button onClick={toggleLike} className={`like-theater-btn ${isLiked ? 'liked' : ''}`} aria-pressed={isLiked} aria-label={isLiked ? 'Unlike theatre' : 'Like theatre'}>
                            {isLiked ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M2 9.137C2 14 6.02 16.591 8.962 18.911C10 19.729 11 20.5 12 20.5s2-.77 3.038-1.59C17.981 16.592 22 14 22 9.138c0-4.863-5.5-8.312-10-3.636C7.5.825 2 4.274 2 9.137Z"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m8.962 18.91l.464-.588l-.464.589ZM12 5.5l-.54.52a.75.75 0 0 0 1.08 0L12 5.5Zm3.038 13.41l.465.59l-.465-.59Zm-5.612-.588C7.91 17.127 6.253 15.96 4.938 14.48C3.65 13.028 2.75 11.334 2.75 9.137h-1.5c0 2.666 1.11 4.7 2.567 6.339c1.43 1.61 3.254 2.9 4.68 4.024l.93-1.178ZM2.75 9.137c0-2.15 1.215-3.954 2.874-4.713c1.612-.737 3.778-.541 5.836 1.597l1.08-1.04C10.1 2.444 7.264 2.025 5 3.06C2.786 4.073 1.25 6.425 1.25 9.137h1.5ZM8.497 19.5c.513.404 1.063.834 1.62 1.16c.557.325 1.193.59 1.883.59v-1.5c-.31 0-.674-.12-1.126-.385c-.453-.264-.922-.628-1.448-1.043L8.497 19.5Zm7.006 0c1.426-1.125 3.25-2.413 4.68-4.024c1.457-1.64 2.567-3.673 2.567-6.339h-1.5c0 2.197-.9 3.891-2.188 5.343c-1.315 1.48-2.972 2.647-4.488 3.842l.929 1.178ZM22.75 9.137c0-2.712-1.535-5.064-3.75-6.077c-2.264-1.035-5.098-.616-7.54 1.92l1.08 1.04c2.058-2.137 4.224-2.333 5.836-1.596c1.659.759 2.874 2.562 2.874 4.713h1.5Zm-8.176 9.185c-.526.415-.995.779-1.448 1.043c-.452.264-.816.385-1.126.385v1.5c.69 0 1.326-.265 1.883-.59c.558-.326 1.107-.756 1.62-1.16l-.929-1.178Z"/></svg>
                            )}
                        </button>
                    )}
                </div>
                <p className="theater-location">{theater.location || 'Location not specified'}, {theater.city || 'City not specified'}</p>
                {/* Add more theater details here if available */}
            </div>

            {/* Date Selector */}
            <div className="date-selector theater-date-selector"> {/* Added specific class */}
                 {generateDateRange(new Date(), 7).map(date => { // date is 'YYYY-MM-DD'
                    const { dayName, dayOfMonth, monthName } = formatDateForCard(date);
                    return (
                        <button
                            key={date}
                            className={`date-card ${selectedDate === date ? 'active' : ''}`}
                            onClick={() => handleDateChange(date)}
                             aria-label={`Select date ${dayName} ${dayOfMonth} ${monthName}`}
                        >
                            <span className="day-name">{dayName}</span>
                            <span className="date-day">{dayOfMonth}</span>
                            <span className="date-month">{monthName}</span>
                        </button>
                    );
                })}
            </div>

            {/* Display error related to fetching showtimes */}
            {error && <p className="error-message">{error}</p>}

            {/* Showtimes Section */}
            <div className="movies-showtimes-section">
                 <h2>
                    Showtimes for {moment.tz(selectedDate, 'YYYY-MM-DD', TARGET_TIMEZONE).format('MMMM D, YYYY')}
                 </h2>
                {loadingShowtimes ? (
                    <div className="loading">Loading Showtimes...</div>
                ) : Object.keys(groupedShowtimes).length > 0 ? (
                    Object.entries(groupedShowtimes).map(([movieTitle, { showtimes: movieShowtimes, movieId }]) => (
                        <div key={movieTitle} className="movie-showtime-card">
                            <div className="movie-header">
                                <h3>{movieTitle}</h3>
                                {movieId && (
                                    <Link to={`/movies/${movieId}`} className="view-movie-details-link">
                                        View Movie Details
                                    </Link>
                                )}
                            </div>
                            <div className="showtimes-grid">
                                {movieShowtimes.map(showtime => {
                                    const showtimeKey = showtime._id;
                                    const screenId = showtime.screen_id;

                                    if (!showtimeKey || !screenId) {
                                        console.warn("Missing showtime data:", showtime);
                                        return null;
                                    }

                                    const displayTime = formatTimeIST(showtime.start_time);
                                    const { status } = getAvailabilityStatus(showtime);
                                    const statusText = getStatusText(status);
                                    
                                    // Get screen format directly from the showtime object
                                    const screenFormat = showtime.screen_format;

                                    // Render a non-clickable div for sold out shows
                                    if (status === 'soldout') {
                                        return (
                                            <div
                                                key={showtimeKey}
                                                className={`showtime-slot ${status}`}
                                                data-status={statusText}
                                                aria-label={`${displayTime} show is sold out`}
                                                title="Sold Out"
                                            >
                                                {displayTime}
                                                {screenFormat && screenFormat !== 'N/A' && (
                                                    <span className="screen-format">{screenFormat}</span>
                                                )}
                                            </div>
                                        );
                                    }

                                    // Render a Link for available/filling shows
                                    return (
                                        <Link
                                            key={showtimeKey}
                                            to={`/booking/screen/${screenId}/showtime/${showtimeKey}`}
                                            className={`showtime-slot ${status}`}
                                            data-status={statusText}
                                            aria-label={`Book tickets for ${displayTime}`}
                                            title={`Book ${displayTime} show${status !== 'plenty' ? ' - ' + statusText : ''}`}
                                        >
                                            {displayTime}
                                            {screenFormat && screenFormat !== 'N/A' && (
                                                <span className="screen-format">{screenFormat}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    !error && <p className='no-showtimes'>No upcoming showtimes found for this theater on {moment.tz(selectedDate, 'YYYY-MM-DD', TARGET_TIMEZONE).format('MMMM D')}.</p>
                )}
            </div>
        </div>
    );
};

export default TheaterDetails;