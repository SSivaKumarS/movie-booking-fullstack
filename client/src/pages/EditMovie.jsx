import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import './CreateMovie.css'; // Reuse styles, adjust if needed
import './EditMovie.css'; // Add specific styles for EditMovie

// Debounce helper function
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Date formatter for input type="date"
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
             console.warn("Invalid date string received:", dateString);
             return '';
        }
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } catch (error) {
        console.error("Error formatting date:", error);
        return '';
    }
};


const EditMovie = () => {
    // Search and Selection State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null); // Holds the full movie object being edited

    // Form Field State
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [duration, setDuration] = useState(''); // Keep as string for input binding
    const [releaseDate, setReleaseDate] = useState('');
    const [languages, setLanguages] = useState(''); // Store as comma-separated string for input
    const [description, setDescription] = useState('');
    const [posterUrl, setPosterUrl] = useState('');
    const [trailerUrl, setTrailerUrl] = useState('');
    const [rating, setRating] = useState('');

    // Loading and Feedback State
    const [isLoadingDetails, setIsLoadingDetails] = useState(false); // Loading full details after selection
    const [isUpdating, setIsUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [searchError, setSearchError] = useState('');

    // --- Debounced Search Function ---
    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (query.trim().length < 2) { // Minimum search term length
                setSearchResults([]);
                setIsSearching(false);
                setSearchError('');
                return;
            }
            setIsSearching(true);
            setSearchError('');
            setErrorMessage(''); // Clear form errors when starting new search
            setSuccessMessage('');
            try {
                const response = await api.get('/movies/search', { params: { query } });
                setSearchResults(response.data || []);
            } catch (error) {
                console.error('Error searching movies:', error);
                setSearchError('Failed to fetch search results.');
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300), // 300ms debounce delay
        [] // Empty dependency array for useCallback
    );

    // Effect to trigger debounced search when searchTerm changes
    useEffect(() => {
         if (searchTerm !== '') {
             debouncedSearch(searchTerm);
         } else {
             setSearchResults([]);
             setIsSearching(false);
             setSearchError('');
         }
    }, [searchTerm, debouncedSearch]);

    // --- Function to Populate Form ---
    const populateForm = (movie) => {
        if (!movie) {
            setTitle('');
            setGenre('');
            setDuration('');
            setReleaseDate('');
            setLanguages('');
            setRating('');
            setDescription('');
            setPosterUrl('');
            setTrailerUrl('');
            return;
        };
        setTitle(movie.title || '');
        setGenre(movie.genre || '');
        setDuration(movie.duration?.toString() || '');
        setReleaseDate(formatDateForInput(movie.release_date));
        setLanguages(Array.isArray(movie.languages) ? movie.languages.join(', ') : '');
        setRating(movie.rating || '');
        setDescription(movie.description || '');
        setPosterUrl(movie.poster_url || '');
        setTrailerUrl(movie.trailer_url || '');
    };

    // --- Handle Selecting a Movie from Search Results ---
    const handleSelectMovie = async (movieFromSearch) => {
        setSearchTerm('');
        setSearchResults([]);
        setIsLoadingDetails(true);
        setErrorMessage('');
        setSuccessMessage('');
        setSelectedMovie(null);
        populateForm(null);

        try {
            console.log(`Fetching full details for movie ID: ${movieFromSearch._id}`);
            const response = await api.get(`/movies/${movieFromSearch._id}`);

            if (response.data && response.data.movie) {
                 setSelectedMovie(response.data.movie);
                 populateForm(response.data.movie);
                 console.log("Selected movie details:", response.data.movie);
            } else {
                 console.error("Movie details not found in response structure:", response.data);
                 throw new Error("Movie details could not be retrieved.");
            }
        } catch (error) {
            console.error('Error fetching movie details:', error);
            setErrorMessage('Failed to load complete movie details. Please try searching again.');
            setSelectedMovie(null);
            populateForm(null);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    // --- Handle Form Submission (Update) ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedMovie || !selectedMovie._id) {
            setErrorMessage('No movie selected to update.');
            return;
        }

        setErrorMessage('');
        setSuccessMessage('');
        setIsUpdating(true);

        const languagesArray = languages.split(',')
                                       .map(lang => lang.trim())
                                       .filter(lang => lang !== '');

        const durationInt = parseInt(duration, 10);

        if (isNaN(durationInt) || durationInt <= 0) {
             setErrorMessage('Duration must be a positive number.');
             setIsUpdating(false);
             return;
        }
        if (languagesArray.length === 0) {
             setErrorMessage('At least one language is required.');
             setIsUpdating(false);
             return;
        }
        if (!releaseDate) {
             setErrorMessage('Release date is required.');
             setIsUpdating(false);
             return;
        }

        const movieData = {
            title,
            genre,
            duration: durationInt || null,
            release_date: releaseDate ,
            languages: languagesArray,
            rating: rating || null,
            description,
            poster_url: posterUrl,
            trailer_url: trailerUrl || null
        };


        try {
            console.log(`Attempting to update movie ID: ${selectedMovie._id} with data:`, movieData);
            const response = await api.put(`/movies/${selectedMovie._id}`, movieData);

            console.log('Movie update response:', response.data);
            setSuccessMessage(response.data.message || `Movie "${movieData.title}" updated successfully!`);

            if (response.data.movie) {
                setSelectedMovie(response.data.movie);
            }

        } catch (error) {
            console.error('Error updating movie:', error.response || error);
            setErrorMessage(`Update failed: ${error.response?.data?.message || 'An unexpected error occurred. Please check details and try again.'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="admin-form-container edit-movie-container">
            <h1>Edit Movie Information</h1>

            {successMessage && <p className="success-message">{successMessage}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {/* --- Search Section --- */}
            <div className="search-movie-section">
                <div className="form-group">
                    <label htmlFor="movieSearch">Search Movie to Edit:</label>
                    <input
                        type="text"
                        id="movieSearch"
                        placeholder="Start typing movie title (min 2 chars)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoadingDetails || isUpdating}
                        className="search-input"
                        autoComplete="off"
                    />
                </div>
                 {searchError && <p className="error-message search-error">{searchError}</p>}

                {/* Search Results Dropdown/List */}
                {(isSearching || (searchResults.length > 0 && searchTerm.length >= 2)) && (
                    <div className="search-results-container">
                        {isSearching && <p className="searching-indicator">Searching...</p>}
                        {!isSearching && searchResults.length > 0 && (
                            <ul className="search-results-list">
                                {searchResults.map(movie => (
                                    // *** MODIFIED: Only show title ***
                                    <li key={movie._id} onClick={() => handleSelectMovie(movie)}>
                                        {movie.title}
                                    </li>
                                    // *** End Modification ***
                                ))}
                            </ul>
                        )}
                         {!isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
                            <p className='no-search-results'>No movies found matching "{searchTerm}".</p>
                        )}
                    </div>
                )}
            </div>

            {/* --- Loading Details Indicator --- */}
             {isLoadingDetails && <div className="loading-indicator details-loading">Loading selected movie details...</div>}


            {/* --- Edit Form --- */}
            {selectedMovie && !isLoadingDetails && (
                <form onSubmit={handleSubmit} className="edit-movie-form">
                    <h2 className='editing-title'>Now Editing: {selectedMovie.title}</h2>

                    {/* Title */}
                    <div className="form-group">
                        <label htmlFor="title">Title:</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isUpdating}/>
                    </div>
                     {/* Genre */}
                     <div className="form-group">
                        <label htmlFor="genre">Genre:</label>
                        <input type="text" id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} required disabled={isUpdating}/>
                    </div>
                     {/* Duration */}
                     <div className="form-group">
                        <label htmlFor="duration">Duration (minutes):</label>
                        <input type="number" id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} required min="1" disabled={isUpdating}/>
                    </div>
                     {/* Release Date */}
                     <div className="form-group">
                        <label htmlFor="releaseDate">Release Date:</label>
                        <input type="date" id="releaseDate" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required disabled={isUpdating}/>
                    </div>
                    {/* Languages */}
                    <div className="form-group">
                        <label htmlFor="languages">Languages (comma-separated):</label>
                        <input type="text" id="languages" value={languages} onChange={(e) => setLanguages(e.target.value)} required placeholder="e.g., English, Hindi, Tamil" disabled={isUpdating}/>
                    </div>
                    {/* Rating */}
                    <div className="form-group">
                        <label htmlFor="rating">Rating:</label>
                        <select id="rating" value={rating} onChange={(e) => setRating(e.target.value)} disabled={isUpdating}>
                            <option value="">Select Rating (Optional)</option>
                            <option value="U">U (Universal)</option>
                            <option value="UA">UA (Parental Guidance)</option>
                            <option value="A">A (Adults Only)</option>
                            <option value="S">S (Special Class)</option>
                        </select>
                    </div>
                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" disabled={isUpdating}/>
                    </div>
                    {/* Poster URL */}
                    <div className="form-group">
                        <label htmlFor="posterUrl">Poster URL:</label>
                        <input type="url" id="posterUrl" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} required placeholder="https://..." disabled={isUpdating}/>
                    </div>
                    {/* Trailer URL */}
                    <div className="form-group">
                        <label htmlFor="trailerUrl">Trailer URL (Optional):</label>
                        <input type="url" id="trailerUrl" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="https://..." disabled={isUpdating}/>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="submit-button" disabled={isUpdating || isLoadingDetails}>
                        {isUpdating ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default EditMovie;