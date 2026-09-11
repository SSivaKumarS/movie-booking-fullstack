// src/pages/CreateMovie.jsx
import React, { useState } from 'react';
import api from '../api/api'; // Assuming your Axios instance setup
import './CreateMovie.css'; // Make sure you have this CSS file or remove the import

const CreateMovie = () => {
    // Use a single state object for the form data, using 'languages' key
    const [formData, setFormData] = useState({
        title: '',
        genre: '',
        duration: '',
        release_date: '', // Match backend field name
        languages: '', // Renamed from 'language'. Input is still comma-separated string.
        rating: '',
        description: '',
        poster_url: '', // Match backend field name
        trailer_url: ''  // Match backend field name
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Optional: for loading state

    // Handle input changes generically
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Reset form function
    const resetForm = () => {
        setFormData({
            title: '',
            genre: '',
            duration: '',
            release_date: '',
            languages: '', // Reset renamed field
            rating: '',
            description: '',
            poster_url: '',
            trailer_url: ''
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true); // Start loading

        // --- Prepare Data for API (Using 'languages' field name) ---
        const languagesArray = formData.languages // Use formData.languages
            .split(',') // Split the comma-separated string
            .map(lang => lang.trim()) // Trim whitespace from each language
            .filter(lang => lang !== ''); // Remove any empty strings resulting from split/trim

        // Data to be sent to the backend using 'languages' key
        const movieData = {
            ...formData, // Spread existing form data
            languages: languagesArray, // Use the new key 'languages' and assign the array
            // Ensure other field names match the backend model exactly
            // (release_date, poster_url, trailer_url already match)
        };

        try {
            // Use the correct endpoint from your API setup
            const response = await api.post('/movies', movieData); // Assuming endpoint is /api/v1/movies

            console.log('Movie created:', response.data);
            // Access title from response structure which might be nested
            const movieTitle = response.data?.movie?.title || 'New Movie'; // Safer access
            setSuccessMessage(`Movie '${movieTitle}' added successfully!`);
            resetForm(); // Reset form fields on success

        } catch (error) {
            console.error('Error creating movie:', error.response ? error.response.data : error); // Log full error details

            // Extract user-friendly error message from backend response
            let friendlyErrorMessage = 'Failed to add movie. Please check the details and try again.'; // Default message
            if (error.response && error.response.data && error.response.data.message) {
                // Use the 'message' field sent by the backend error handler
                friendlyErrorMessage = error.response.data.message;
            }
            setErrorMessage(friendlyErrorMessage); // Set the user-friendly message string
        } finally {
            setIsLoading(false); // Stop loading regardless of success/failure
        }
    };

    return (
        <div className="create-movie-container">
            <h1>Add New Movie</h1>
            {/* Display Success/Error Messages */}
            {successMessage && <p className="success-message">{successMessage}</p>}
            {errorMessage && <p className="error-message">Error: {errorMessage}</p>}

            <form onSubmit={handleSubmit} className="create-movie-form">
                {/* Use formData state and handleChange for all inputs */}
                {/* ... other form groups (title, genre, etc. remain the same) ... */}
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="genre">Genre:</label>
                    <input
                        type="text"
                        id="genre"
                        name="genre"
                        value={formData.genre}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="duration">Duration (minutes):</label>
                    <input
                        type="number"
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                        min="1"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="release_date">Release Date:</label>
                    <input
                        type="date"
                        id="release_date"
                        name="release_date"
                        value={formData.release_date}
                        onChange={handleChange}
                        required
                    />
                </div>

                 {/* --- Updated Language Input --- */}
                <div className="form-group">
                    <label htmlFor="languages">Language(s) (comma-separated):</label>
                    <input
                        type="text"
                        id="languages"
                        name="languages" // Update name attribute to 'languages'
                        value={formData.languages} // Update value binding to formData.languages
                        onChange={handleChange}
                        placeholder="e.g., English, Hindi, Tamil" // Guide user
                        required
                    />
                </div>
                 {/* --- End Updated Language Input --- */}

                <div className="form-group">
                    <label htmlFor="rating">Rating:</label>
                    <select
                        id="rating"
                        name="rating"
                        value={formData.rating}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a rating</option>
                        <option value="U">U (Universal)</option>
                        <option value="UA">U/A (Parental Guidance)</option>
                        <option value="A">A (Adults Only)</option>
                        <option value="S">S (Specialized)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={4}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="poster_url">Poster URL:</label>
                    <input
                        type="url"
                        id="poster_url"
                        name="poster_url"
                        value={formData.poster_url}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="trailer_url">Trailer URL (YouTube/Vimeo etc.):</label>
                    <input
                        type="url"
                        id="trailer_url"
                        name="trailer_url"
                        value={formData.trailer_url}
                        onChange={handleChange}
                        placeholder="https://youtube.com/watch?v=..."
                    />
                </div>
                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Movie'}
                </button>
            </form>
        </div>
    );
};

export default CreateMovie;