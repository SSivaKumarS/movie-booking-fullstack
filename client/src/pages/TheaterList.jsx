// frontend/src/pages/TheaterList.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './TheaterList.css';
import { useNavigate } from 'react-router-dom';

const TheaterList = () => {
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTheaters = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch theaters - API response objects should have _id
                const response = await api.get('/theaters');
                console.log("Fetched Theaters:", response.data); // Log to confirm structure
                setTheaters(response.data);
            } catch (err) {
                console.error('Error fetching theaters:', err);
                setError('Failed to load theaters.');
            } finally {
                 setLoading(false);
            }
        };

        fetchTheaters();
    }, []);

    // --- Use the correct ID (_id) when navigating ---
    const handleAddScreenClick = (id) => { // Renamed parameter for clarity
        if (!id) {
            console.error("Add Screen Click: Invalid ID received!");
            setError("Cannot add screen: Invalid theater ID.");
            return;
        }
        navigate(`/admin/theaters/${id}/create-screen`);
    };

    const handleModifyScreensClick = (id) => { // Renamed parameter for clarity
         if (!id) {
            console.error("Modify Screens Click: Invalid ID received!");
            setError("Cannot modify screens: Invalid theater ID.");
            return;
        }
        navigate(`/admin/theaters/${id}/screens`); // Navigate to ScreenList page
    };
    // --- End Use the correct ID ---


    if (loading) {
        return <p>Loading theaters...</p>;
    }

    if (error) {
        return <p className="error-message">Error: {error}</p>; // Added error class
    }

    return (
        <div className="theater-list-container">
            <h2 className="theater-list-title">Theater List</h2>
            {theaters.length > 0 ? (
                <ul className="theaters-ul">
                    {theaters.map(theater => (
                         // --- Use theater._id as key and pass it to handlers ---
                        <li key={theater._id} className="theater-list-item">
                            <div className="theater-info">
                                <h3 className="theater-name">{theater.name}</h3>
                                <p className="theater-location">{theater.location}, {theater.city}</p>
                                {/* Optionally display _id for debugging */}
                                {/* <p style={{fontSize: '0.7em', color: 'grey'}}>ID: {theater._id}</p> */}
                            </div>
                            <div className="theater-actions">
                                <button
                                    className="modify-screens-button"
                                    onClick={() => handleModifyScreensClick(theater._id)} // Pass _id
                                >
                                    Modify Screens
                                </button>
                                <button
                                    className="add-screen-button"
                                    onClick={() => handleAddScreenClick(theater._id)} // Pass _id
                                >
                                    Add Screen
                                </button>
                            </div>
                        </li>
                         // --- End Use theater._id ---
                    ))}
                </ul>
            ) : (
                <p>No theaters found.</p>
            )}
        </div>
    );
};

export default TheaterList;