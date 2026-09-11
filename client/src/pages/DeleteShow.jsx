// cineplus-frontend/src/pages/DeleteShow.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/api';
import { UserContext } from '../context/UserContext';
import './DeleteShow.css';

// Helper to format date/time consistently
const formatShowDateTime = (isoString) => {
    // ... (formatShowDateTime function remains the same)
     if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata' // Display in IST for consistency
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date';
    }
};

// Debounce Hook
const useDebounce = (value, delay) => {
    // ... (useDebounce hook remains the same)
     const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const DeleteShow = () => {
    const [showtimes, setShowtimes] = useState([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useContext(UserContext);

    // Filter State
    const [filterDate, setFilterDate] = useState('');
    const [filterMovieName, setFilterMovieName] = useState('');
    const [filterScreen, setFilterScreen] = useState(''); // <<< Add state for screen filter

    // Debounce movie name input
    const debouncedMovieName = useDebounce(filterMovieName, 500);
    // NOTE: Debouncing screen number might be less necessary unless numbers are very long
    // const debouncedScreenNumber = useDebounce(filterScreen, 500);

    // Fetch showtimes function
    const fetchShowtimes = useCallback(async () => {
        setIsLoading(true);
        setError('');
        // setSuccessMessage(''); // Decide if you want to clear success on every fetch

        try {
            const response = await api.get(`/showtimes/theaters`, {
                params: {
                    date: filterDate || undefined,
                    movieName: debouncedMovieName.trim() || undefined,
                    screenNumber: filterScreen.trim() || undefined, // <<< Add screenNumber param
                },
            });

            const scheduledShowtimes = response.data.filter(showtime => showtime.status === 'scheduled');
            scheduledShowtimes.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

            setShowtimes(scheduledShowtimes);
             if (scheduledShowtimes.length === 0 && !error) { // Prevent overwriting error message
                 // Optionally set a different message like "No shows match filters"
                 // setSuccessMessage(''); // Clear success if no results
            }

        } catch (err) {
            console.error('Error fetching showtimes:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load showtimes.');
            setShowtimes([]);
        } finally {
            setIsLoading(false);
        }
        // <<< Add filterScreen to dependencies
    }, [filterDate, debouncedMovieName, filterScreen]);

    // Effect to trigger fetch when filters change
    useEffect(() => {
        fetchShowtimes();
    }, [fetchShowtimes]);

    // Handle Delete/Cancel Showtime
    const handleDeleteShow = async (showtimeIdToDelete) => {
        // ... (handleDeleteShow function remains the same)
        if (isLoading) return;

        setError('');
        setSuccessMessage('');

        const showToDelete = showtimes.find(s => s._id === showtimeIdToDelete);
        const confirmMessage = `Are you sure you want to cancel the show for '${showToDelete?.movie_title || 'this movie'}' on Screen ${showToDelete?.screen_number || '?'} at ${formatShowDateTime(showToDelete?.start_time)}? This action cannot be undone and will cancel active bookings.`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.delete(`/showtimes/${showtimeIdToDelete}`);

            if (response.status === 200) {
                setSuccessMessage(response.data.message || 'Showtime cancelled successfully.');
                setShowtimes(prevShowtimes => prevShowtimes.filter(show => show._id !== showtimeIdToDelete));
            } else {
                 setError(response.data?.message || `Cancellation submitted, but received status: ${response.status}`);
            }
        } catch (err) {
            console.error('Error cancelling showtime:', err);
            setError(err.response?.data?.message || err.message || 'Failed to cancel showtime.');
        } finally {
            setIsLoading(false);
        }
    };

    // Generic handler to update filter state and clear messages
    const handleFilterChange = (setter, value) => {
        setter(value);
        setError('');
        setSuccessMessage('');
    }

    return (
        <div className="delete-show-container">
            <h2 className="delete-show-title">Manage Scheduled Shows</h2>

            {/* Filters Section - Now uses flexbox for row layout */}
            <div className="filters">
                {/* Date Filter */}
                <div className="filter-item">
                    <label htmlFor="filterDate">Filter by Date:</label>
                    <input
                        type="date"
                        id="filterDate"
                        className="filter-input"
                        value={filterDate}
                        onChange={(e) => handleFilterChange(setFilterDate, e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                {/* Movie Filter */}
                <div className="filter-item">
                    <label htmlFor="filterMovieName">Filter by Movie Title:</label>
                    <input
                        type="text"
                        id="filterMovieName"
                        className="filter-input"
                        placeholder="Enter part of movie title"
                        value={filterMovieName}
                        onChange={(e) => handleFilterChange(setFilterMovieName, e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                {/* Screen Filter - NEW */}
                <div className="filter-item">
                    <label htmlFor="filterScreen">Filter by Screen:</label>
                    <input
                        type="text" // Use text, backend handles validation/lookup
                        id="filterScreen"
                        className="filter-input"
                        placeholder="Enter screen number"
                        value={filterScreen}
                        onChange={(e) => handleFilterChange(setFilterScreen, e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                {/* Clear Filters Button */}
                <button
                    onClick={() => {
                        handleFilterChange(setFilterDate, '');
                        handleFilterChange(setFilterMovieName, '');
                        handleFilterChange(setFilterScreen, ''); // <<< Clear screen filter
                    }}
                    className="clear-filters-button"
                    disabled={isLoading}
                >
                    Clear Filters
                </button>
            </div>

            {/* Display Messages and Loading Indicator */}
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            {isLoading && <div className="loading-indicator">Loading shows...</div>}

            {/* Showtimes Table */}
            {!isLoading && showtimes.length === 0 && (
                 <p className="no-shows">No scheduled shows found matching the current filters.</p>
            )}

            {!isLoading && showtimes.length > 0 && (
                <div className="table-wrapper">
                     {/* Table structure remains the same */}
                    <table className="showtimes-table">
                        <thead>
                            <tr className="table-header">
                                <th>Movie Title</th>
                                <th>Screen</th>
                                <th>Date & Time (IST)</th>
                                <th>Language</th>
                                <th>Seats</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {showtimes.map(showtime => (
                                <tr key={showtime._id} className="table-row">
                                    <td className="table-data">{showtime.movie_title}</td>
                                    <td className="table-data">Screen {showtime.screen_number}</td>
                                    <td className="table-data">
                                        {formatShowDateTime(showtime.start_time)}
                                    </td>
                                    <td className="table-data">{showtime.language}</td>
                                    <td className="table-data">
                                        {showtime.booked_seats_count} / {showtime.total_seats}
                                    </td>
                                    <td className="table-data">
                                        <button
                                            className="delete-button"
                                            onClick={() => handleDeleteShow(showtime._id)}
                                            disabled={isLoading}
                                        >
                                            Cancel Show
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DeleteShow;