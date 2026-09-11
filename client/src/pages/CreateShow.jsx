// frontend/src/pages/CreateShow.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './CreateShow.css'; // Ensure CSS file exists and is styled

const CreateShow = () => {
    // --- State (Keep existing state variables) ---
    const [movies, setMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [screens, setScreens] = useState([]);
    const [selectedMovieId, setSelectedMovieId] = useState('');
    const [selectedTheaterId, setSelectedTheaterId] = useState('');
    const [selectedScreenId, setSelectedScreenId] = useState('');
    const [showTime, setShowTime] = useState(''); // Holds YYYY-MM-DDTHH:mm
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [loadingMovies, setLoadingMovies] = useState(true);
    const [loadingTheaters, setLoadingTheaters] = useState(true);
    const [loadingScreens, setLoadingScreens] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- Data Fetching Effects (Keep existing useEffect hooks) ---
     useEffect(() => {
        let isMounted = true;
        const fetchInitialData = async () => {
            setLoadingMovies(true); setLoadingTheaters(true); setError('');
            try {
                const [moviesResponse, theatersResponse] = await Promise.all([
                    api.get('/movies?fields=title,languages'), // Added languages
                    api.get('/theaters?fields=name')
                ]);
                if (isMounted) {
                    setMovies(Array.isArray(moviesResponse.data) ? moviesResponse.data : moviesResponse.data?.movies || []);
                    setTheaters(Array.isArray(theatersResponse.data) ? theatersResponse.data : theatersResponse.data?.theaters || []);
                }
            } catch (err) { if (isMounted) setError('Failed to load initial data.'); console.error(err); }
            finally { if (isMounted) { setLoadingMovies(false); setLoadingTheaters(false); } }
        };
        fetchInitialData(); return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchScreens = async () => {
            if (selectedTheaterId) {
                setLoadingScreens(true); setScreens([]); setSelectedScreenId(''); setError('');
                try {
                    const response = await api.get(`/theaters/${selectedTheaterId}/screens`);
                    if (isMounted) setScreens(Array.isArray(response.data) ? response.data : response.data?.screens || []);
                } catch (err) { if (isMounted) setError('Failed to load screens.'); console.error(err); }
                finally { if (isMounted) setLoadingScreens(false); }
            } else { setScreens([]); setSelectedScreenId(''); }
        };
        fetchScreens(); return () => { isMounted = false; };
    }, [selectedTheaterId]);

     useEffect(() => {
        if (selectedMovieId) {
            const selectedMovie = movies.find(movie => movie._id === selectedMovieId);
            if (selectedMovie && Array.isArray(selectedMovie.languages)) {
                setAvailableLanguages(selectedMovie.languages);
                setSelectedLanguage(selectedMovie.languages[0] || ''); // Default to first
            } else { setAvailableLanguages([]); setSelectedLanguage(''); }
        } else { setAvailableLanguages([]); setSelectedLanguage(''); }
    }, [selectedMovieId, movies]);


    // --- Form Submission Handler (UPDATED CATCH BLOCK) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!selectedMovieId || !selectedTheaterId || !selectedScreenId || !showTime || !selectedLanguage) {
            setError('Please fill in all fields.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            movie_id: selectedMovieId,
            start_time: showTime, // Send the "YYYY-MM-DDTHH:mm" string
            language: selectedLanguage,
        };

        const apiUrl = `/showtimes/screens/${selectedScreenId}`; // Verify this matches showtimeRoutes.js

        console.log("Creating Showtime - API Endpoint:", apiUrl);
        console.log("Creating Showtime - Payload:", payload);

        try {
            const response = await api.post(apiUrl, payload);
            console.log('Show created:', response.data);
            setSuccessMessage('Showtime created successfully!');
            // Clear time/screen for next entry, keep movie/theater?
            setSelectedScreenId('');
            setShowTime('');
            // Optionally clear language if desired
            // setSelectedLanguage('');

        } catch (err) {
            console.error('Error creating showtime:', err.response ? err.response.data : err);

            // --- UPDATED ERROR HANDLING ---
            if (err.response) {
                // Check for the specific 409 Conflict status
                if (err.response.status === 409) {
                    setError(err.response.data.message); // Display the specific conflict message from backend
                } else {
                    // Handle other backend errors (400, 404, 500 etc.)
                    setError(err.response.data.message || `Error: ${err.response.status} - Failed to create showtime.`);
                }
            } else {
                // Handle network errors or errors without a response object
                setError('Network error or server is unreachable. Please try again.');
            }
            // --- END UPDATED ERROR HANDLING ---

        } finally {
             setIsSubmitting(false);
        }
    };

    // --- Render Helpers (Keep existing) ---
     const renderOptions = (items, valueField, labelField, defaultLabel) => (
        <> <option value="">{defaultLabel}</option> {Array.isArray(items) && items.map(item => (<option key={item._id} value={item._id}>{item[labelField]}</option>))} </>
    );
    const renderLanguageOptions = (languages) => {
        if (!Array.isArray(languages) || languages.length === 0) return <option value="">-- Select Movie --</option>;
        // If only one language, disable select or just show it? Let's make it selectable.
        // if (languages.length === 1) return <option value={languages[0]}>{languages[0]}</option>;
        return languages.map((lang) => (<option key={lang} value={lang}>{lang}</option>));
    };


    // --- JSX (Keep existing structure) ---
    return (
        <div className="create-show-container form-container">
            <h2 className="create-show-title">Create Single Show</h2>

            {/* Display Error and Success Messages */}
            {error && <p className="error-message" style={{ color: 'red', marginBottom: '15px', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>{error}</p>}
            {successMessage && <p className="success-message" style={{ color: 'green', marginBottom: '15px', border: '1px solid green', padding: '10px', borderRadius: '4px' }}>{successMessage}</p>}

            <form onSubmit={handleSubmit} className="create-show-form">
                {/* Movie Select */}
                <div className="form-group">
                    <label htmlFor="movie">Movie:</label>
                    <select id="movie" value={selectedMovieId} onChange={(e) => setSelectedMovieId(e.target.value)} required disabled={loadingMovies || isSubmitting}>
                        {renderOptions(movies, '_id', 'title', loadingMovies ? 'Loading...' : '-- Select Movie --')}
                    </select>
                </div>

                {/* Theater Select */}
                <div className="form-group">
                    <label htmlFor="theater">Theater:</label>
                    <select id="theater" value={selectedTheaterId} onChange={(e) => setSelectedTheaterId(e.target.value)} required disabled={loadingTheaters || isSubmitting}>
                         {renderOptions(theaters, '_id', 'name', loadingTheaters ? 'Loading...' : '-- Select Theater --')}
                    </select>
                </div>

                {/* Screen Select */}
                <div className="form-group">
                    <label htmlFor="screen">Screen:</label>
                    <select id="screen" value={selectedScreenId} onChange={(e) => setSelectedScreenId(e.target.value)} required disabled={!selectedTheaterId || loadingScreens || isSubmitting}>
                         {renderOptions(screens, '_id', 'screen_number', loadingScreens ? 'Loading...' : (selectedTheaterId ? '-- Select Screen --' : '-- Select Theater First --'))}
                    </select>
                    {/* {!selectedTheaterId && <p className="form-info-muted">Select a theater to load screens.</p>} */}
                     {selectedTheaterId && !loadingScreens && screens.length === 0 && <p className="form-info-muted">No screens found.</p>}
                </div>

                {/* Language Select */}
                <div className="form-group">
                    <label htmlFor="language">Language:</label>
                    <select id="language" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} required disabled={!selectedMovieId || availableLanguages.length === 0 || isSubmitting}>
                         {availableLanguages.length > 0 ? renderLanguageOptions(availableLanguages) : <option value="">-- Select Movie First --</option>}
                    </select>
                     {/* {!selectedMovieId && <p className="form-info-muted">Select a movie first.</p>} */}
                     {selectedMovieId && availableLanguages.length === 0 && <p className="form-info-muted">No languages found for this movie.</p>}
                </div>

                {/* Show Date and Time */}
                <div className="form-group">
                    <label htmlFor="showTime">Show Date and Time:</label>
                    <input
                        type="datetime-local"
                        id="showTime"
                        value={showTime}
                        onChange={(e) => setShowTime(e.target.value)}
                        required
                        disabled={isSubmitting}
                        min={new Date().toISOString().slice(0, 16)} // Prevent past dates/times based on browser local time
                    />
                     <p className="form-info-muted">Time selection is based on your browser's local time.</p>
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-button" disabled={isSubmitting || loadingMovies || loadingTheaters || loadingScreens}>
                    {isSubmitting ? 'Creating Show...' : 'Create Show'}
                </button>
            </form>
        </div>
    );
};

export default CreateShow;