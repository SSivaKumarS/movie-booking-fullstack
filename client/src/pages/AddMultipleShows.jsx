// frontend/src/pages/AddMultipleShows.jsx
import React, { useState, useEffect } from 'react';
import './AddMultipleShows.css'; // Ensure this CSS file exists and is styled
import api from '../api/api'; // Your configured axios instance

const AddMultipleShows = () => {
    // --- State ---
    const [movies, setMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [screens, setScreens] = useState([]);
    const [formData, setFormData] = useState({
        movieId: '',
        theaterId: '',
        screenId: '',
        startDate: '', // YYYY-MM-DD
        endDate: '',   // YYYY-MM-DD
        showTimes: '', // Comma-separated HH:mm times, e.g., "10:00,14:00,18:00"
        language: '',
    });
    const [availableLanguages, setAvailableLanguages] = useState([]);

    // Loading and feedback state
    const [loadingMovies, setLoadingMovies] = useState(true);
    const [loadingTheaters, setLoadingTheaters] = useState(true);
    const [loadingScreens, setLoadingScreens] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- Data Fetching Effects ---

    // Fetch Movies and Theaters on Mount
    useEffect(() => {
        let isMounted = true;
        const fetchInitialData = async () => {
            setLoadingMovies(true);
            setLoadingTheaters(true);
            setError('');
            try {
                const [moviesResponse, theatersResponse] = await Promise.all([
                    api.get('/movies?fields=title,languages'),
                    api.get('/theaters?fields=name,city')
                ]);
                if (isMounted) {
                    setMovies(Array.isArray(moviesResponse.data) ? moviesResponse.data : moviesResponse.data?.movies || []);
                    setTheaters(Array.isArray(theatersResponse.data) ? theatersResponse.data : theatersResponse.data?.theaters || []);
                }
            } catch (err) {
                console.error('Error fetching initial data:', err);
                if (isMounted) setError('Failed to load movies or theaters. Please refresh.');
            } finally {
                if (isMounted) {
                    setLoadingMovies(false);
                    setLoadingTheaters(false);
                }
            }
        };
        fetchInitialData();
        return () => { isMounted = false; };
    }, []);

    // Fetch Screens when theaterId changes
    useEffect(() => {
        let isMounted = true;
        const fetchScreens = async () => {
            if (formData.theaterId) {
                setLoadingScreens(true);
                setScreens([]);
                setError('');
                setFormData(prev => ({ ...prev, screenId: '' })); // Reset screenId
                try {
                    const response = await api.get(`/theaters/${formData.theaterId}/screens`);
                    if (isMounted) {
                        setScreens(Array.isArray(response.data) ? response.data : response.data?.screens || []);
                    }
                } catch (err) {
                    console.error('Error fetching screens:', err);
                     if (isMounted) setError('Failed to load screens for the selected theater.');
                } finally {
                     if (isMounted) setLoadingScreens(false);
                }
            } else {
                setScreens([]);
                setFormData(prev => ({ ...prev, screenId: '' })); // Reset screenId if theater deselected
            }
        };
        fetchScreens();
        return () => { isMounted = false; };
    }, [formData.theaterId]);

    // Update Available Languages when movieId changes
    useEffect(() => {
        if (formData.movieId) {
            const selectedMovie = movies.find(movie => movie._id === formData.movieId);
            if (selectedMovie?.languages?.length > 0) {
                setAvailableLanguages(selectedMovie.languages);
                setFormData(prevState => ({
                    ...prevState,
                    language: selectedMovie.languages.includes(prevState.language) ? prevState.language : selectedMovie.languages[0] || ''
                }));
            } else {
                setAvailableLanguages([]);
                 setFormData(prevState => ({ ...prevState, language: '' }));
            }
        } else {
            setAvailableLanguages([]);
            setFormData(prevState => ({ ...prevState, language: '' }));
        }
    }, [formData.movieId, movies]);


    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Frontend Validation
        if (!formData.movieId || !formData.theaterId || !formData.screenId || !formData.startDate || !formData.endDate || !formData.showTimes.trim() || !formData.language) {
            setError('Please fill in all required fields.');
            return;
        }
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            setError('Start date cannot be after end date.');
            return;
        }
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        const times = formData.showTimes.split(',').map(t => t.trim());
        if (times.some(time => !timeRegex.test(time)) || times.length === 0) {
             setError('Invalid show times format. Use HH:mm, separated by commas (e.g., 09:00, 14:30).');
             return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post('/showtimes/multiple', formData);
            setSuccessMessage(response.data.message || 'Showtimes added successfully!');
            setFormData({ movieId: '', theaterId: '', screenId: '', startDate: '', endDate: '', showTimes: '', language: '' }); // Reset form
            setAvailableLanguages([]);
            setScreens([]);

        } catch (err) {
            console.error('Error adding multiple shows:', err.response ? err.response.data : err);
            if (err.response) {
                if (err.response.status === 409) { // Conflict
                    setError(err.response.data.message);
                } else { // Other backend errors
                    setError(err.response.data.message || `Error: ${err.response.status} - Failed to add showtimes.`);
                }
            } else { // Network or other errors
                setError('Network error or server is unreachable. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Helper for Select Options ---
    const renderOptions = (items, valueField, labelField, labelField2 = null, defaultLabel) => (
        <>
            <option value="">{defaultLabel}</option>
            {Array.isArray(items) && items.map((item) => (
                <option key={item?.[valueField]} value={item?.[valueField]}>
                    {item?.[labelField] ?? 'N/A'}
                    {labelField2 && item?.[labelField2] ? ` (${item[labelField2]})` : ''}
                </option>
            ))}
        </>
    );

    // --- Render Helper for Language Options ---
    const renderLanguageOptions = (languages) => {
       if (!Array.isArray(languages) || languages.length === 0) return null;
       return languages.map((lang) => (
           <option key={lang} value={lang}>{lang}</option>
       ));
    };

    // --- JSX ---
    return (
        <div className="add-multiple-shows-container form-container">
            <h2>Add Multiple Shows</h2>

            {/* Display Error/Success Messages */}
            {error && <p className="error-message" style={{ color: 'red', marginBottom: '15px', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>{error}</p>}
            {successMessage && <p className="success-message" style={{ color: 'green', marginBottom: '15px', border: '1px solid green', padding: '10px', borderRadius: '4px' }}>{successMessage}</p>}

            <form className="add-multiple-shows-form" onSubmit={handleSubmit}>
                {/* Movie Select */}
                <div className="form-group">
                    <label htmlFor="movieId">Movie:</label>
                    <select id="movieId" name="movieId" value={formData.movieId} onChange={handleChange} required disabled={loadingMovies || isSubmitting}>
                         {renderOptions(movies, '_id', 'title', null, loadingMovies ? 'Loading...' : '-- Select Movie --')}
                    </select>
                </div>

                {/* Theater Select */}
                <div className="form-group">
                    <label htmlFor="theaterId">Theater:</label>
                    <select id="theaterId" name="theaterId" value={formData.theaterId} onChange={handleChange} required disabled={loadingTheaters || isSubmitting}>
                         {renderOptions(theaters, '_id', 'name', 'city', loadingTheaters ? 'Loading...' : '-- Select Theater --')}
                    </select>
                </div>

                {/* Screen Select */}
                <div className="form-group">
                    <label htmlFor="screenId">Screen:</label>
                    <select id="screenId" name="screenId" value={formData.screenId} onChange={handleChange} required disabled={!formData.theaterId || loadingScreens || isSubmitting}>
                         {renderOptions(screens, '_id', 'screen_number', null, loadingScreens ? 'Loading...' : (formData.theaterId ? '-- Select Screen --' : '-- Select Theater First --'))}
                    </select>
                    {/* Conditional messages for screen selection */}
                    {/* {!formData.theaterId && !loadingScreens && (<p className="form-info-muted">Select a theater to load screens.</p>)} */}
                    {formData.theaterId && !loadingScreens && screens.length === 0 && (<p className="form-info-muted">No screens found for this theater.</p>)}
                </div>

                 {/* Language Select */}
                 <div className="form-group">
                    <label htmlFor="language">Language:</label>
                    <select
                        id="language"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        required
                        // Disable if no movie selected OR only one language available
                        disabled={!formData.movieId || availableLanguages.length <= 1 || isSubmitting}
                    >
                         {availableLanguages.length > 0 ? (
                            renderLanguageOptions(availableLanguages)
                        ) : (
                            // Show different placeholder based on whether movie is selected
                            <option value="">{formData.movieId ? '-- No Languages Available --' : '-- Select Movie First --'}</option>
                        )}
                    </select>
                    {/* Informational messages based on state */}
                    {formData.movieId && availableLanguages.length === 1 && (
                        <p className="form-info-muted">Language automatically set.</p>
                    )}
                    {/* {!formData.movieId && (
                        <p className="form-info-muted">Select a movie first to see languages.</p>
                    )} */}
                    {formData.movieId && availableLanguages.length === 0 && (
                        <p className="form-info-muted">Selected movie has no languages listed.</p>
                    )}
                </div> {/* End of Language form-group */}

                {/* Use two columns for dates/times */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="startDate">Start Date:</label>
                        <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required disabled={isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="endDate">End Date:</label>
                        <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required disabled={isSubmitting} />
                    </div>
                </div> {/* End of form-row */}

                {/* Show Times Input */}
                <div className="form-group">
                    <label htmlFor="showTimes">Show Times <span className='label-hint'>(Comma Separated, 24hr HH:mm)</span>:</label>
                    <input
                        type="text"
                        id="showTimes"
                        name="showTimes"
                        value={formData.showTimes}
                        onChange={handleChange}
                        placeholder="e.g., 09:00, 13:30, 18:00, 22:15"
                        required
                        disabled={isSubmitting}
                        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]( *, *([0-1]?[0-9]|2[0-3]):[0-5][0-9])*$"
                        title="Enter times like HH:mm, separated by commas (e.g., 09:00, 14:30)"
                    />
                     <p className="form-info-muted">Times will be created for each day in the date range.</p>
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-button" disabled={isSubmitting || loadingMovies || loadingTheaters || loadingScreens}>
                    {isSubmitting ? 'Adding Shows...' : 'Add Shows'}
                </button>
            </form> {/* End of form */}
        </div> // End of container div
    );
};

export default AddMultipleShows;