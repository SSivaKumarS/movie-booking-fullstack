import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './DeleteMovie.css'; // Keep using the CSS file

// Helper function to format date (keep as is)
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
             return 'Invalid Date';
        }
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return 'N/A';
    }
};

const DeleteMovie = () => {
    const [movies, setMovies] = useState([]); // Full list
    const [filteredMovies, setFilteredMovies] = useState([]); // Displayed list
    const [searchTerm, setSearchTerm] = useState('');
    // Keep track of which movie ID is currently being deleted for button disabling/feedback
    const [deletingMovieId, setDeletingMovieId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch all movies initially
    const fetchMovies = async () => {
        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        // Reset deleting state on refetch
        setDeletingMovieId(null);
        try {
            const response = await api.get('/movies');
            if (Array.isArray(response.data)) {
                const sortedMovies = [...response.data].sort((a, b) =>
                    a.title.localeCompare(b.title)
                );
                setMovies(sortedMovies);
                // Apply current search term to the newly fetched movies
                filterMovies(searchTerm, sortedMovies);
            } else {
                handleFetchError('Expected an array of movies', response.data);
            }
        } catch (error) {
            handleFetchError('Failed to fetch movies', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to handle fetch errors
    const handleFetchError = (message, errorDetails) => {
         console.error(`${message}:`, errorDetails);
         setMovies([]);
         setFilteredMovies([]);
         setErrorMessage(errorDetails?.response?.data?.message || message);
    };

     // Helper function to filter movies based on term and source list
    const filterMovies = (term, sourceList) => {
        const lowerCaseSearch = term.toLowerCase();
        const filtered = sourceList.filter(movie =>
            movie.title.toLowerCase().includes(lowerCaseSearch) ||
            movie.genre.toLowerCase().includes(lowerCaseSearch) ||
            (movie.languages && movie.languages.some(lang => lang.toLowerCase().includes(lowerCaseSearch)))
        );
        setFilteredMovies(filtered);
    };


    useEffect(() => {
        fetchMovies();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Fetch only once on mount

    // Effect for filtering when search term changes
    useEffect(() => {
        filterMovies(searchTerm, movies);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]); // Rerun only when searchTerm changes (movies list handled by fetch)


    // Handler for clicking the delete button in a table row
    const handleDeleteClick = async (movieId, movieTitle) => {
        // Prevent multiple delete actions simultaneously
        if (deletingMovieId) return;

        // Confirmation Popup
        if (!window.confirm(`🛑 Are you ABSOLUTELY SURE you want to permanently delete "${movieTitle}"?\n\n⚠️ This action CANNOT be undone and will also remove all associated showtimes and bookings.`)) {
             return; // User cancelled
        }

        // Set deleting state specifically for this movie
        setDeletingMovieId(movieId);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            console.log(`Attempting deletion of ${movieTitle} (ID: ${movieId})`);
            await api.delete(`/movies/${movieId}`);
            setSuccessMessage(`✅ Movie "${movieTitle}" (ID: ${movieId}) deleted successfully.`);

            // Refresh the movies list AFTER successful deletion
            // Remove the deleted movie from the current state for immediate feedback
            // before the full refetch completes (optional but smoother UX)
            setMovies(prev => prev.filter(m => m._id !== movieId));
            setFilteredMovies(prev => prev.filter(m => m._id !== movieId));
            // You could uncomment fetchMovies() if you prefer a full refetch,
            // but removing locally might feel faster.
            // await fetchMovies();

        } catch (error) {
            console.error(`Error deleting movie ${movieTitle}:`, error.response?.data || error);
            setErrorMessage(`❌ Error deleting "${movieTitle}": ${error.response?.data?.message || 'Please check server logs.'}`);
        } finally {
            // Reset deleting state regardless of success/failure
            setDeletingMovieId(null);
        }
    };

    return (
        <div className="delete-movie-container">
            <h1>Delete Movie</h1>

            {successMessage && <p className="success-message">{successMessage}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {/* Search Bar */}
            <div className="search-bar-container form-group">
                <label htmlFor="movieSearch">Search Movies:</label>
                <input
                    type="text"
                    id="movieSearch"
                    className="search-input"
                    placeholder="Search by Title, Genre, Language..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading || !!deletingMovieId} // Disable search while loading or deleting
                />
            </div>

            {/* Loading Indicator */}
            {isLoading && <p className="loading-indicator">Loading movies list...</p>}

            {/* Movie Table */}
            {!isLoading && (
                <div className="table-container">
                    <table className="movie-delete-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Release Date</th>
                                <th>Language(s)</th>
                                <th>Genre</th>
                                <th className="action-column-header">Action</th> {/* Centered header */}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovies.length > 0 ? (
                                filteredMovies.map(movie => (
                                    <tr key={movie._id}>
                                        <td>{movie.title}</td>
                                        <td>{formatDate(movie.release_date)}</td>
                                        <td>{movie.languages?.join(', ') || 'N/A'}</td>
                                        <td>{movie.genre}</td>
                                        {/* Action cell with Delete Button */}
                                        <td className="action-cell"> {/* Cell for centering */}
                                            <button
                                                className="delete-row-button"
                                                onClick={() => handleDeleteClick(movie._id, movie.title)}
                                                // Disable button if ANY delete is in progress OR specifically this one is deleting
                                                disabled={!!deletingMovieId}
                                            >
                                                 {/* Show spinner/text change if this specific movie is deleting */}
                                                {deletingMovieId === movie._id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="no-results-message">
                                        {searchTerm ? 'No movies found matching your search.' : 'No movies available.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* General deleting indicator can be removed or kept if preferred */}
            {/* {deletingMovieId && <p className="deleting-indicator">Processing deletion...</p>} */}
        </div>
    );
};

export default DeleteMovie;