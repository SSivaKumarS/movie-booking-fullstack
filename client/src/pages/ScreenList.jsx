// frontend/src/pages/ScreenList.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';
import './ScreenList.css'; // Create ScreenList.css for styling

const ScreenList = () => {
    const { theaterId } = useParams(); // Get theaterId from URL params
    const [screens, setScreens] = useState([]);
    const [seats, setSeats] = useState({}); // Object to store seats for each screen
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingScreen, setEditingScreen] = useState(null);
    const [screenNumber, setScreenNumber] = useState('');
    const [format, setFormat] = useState('');
    const [seatRowsConfig, setSeatRowsConfig] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchScreensAndSeats = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch screens
                const screensResponse = await api.get(`/theaters/${theaterId}/screens`);
                const fetchedScreens = screensResponse.data;
                setScreens(fetchedScreens);

                // Fetch seats for each screen
                const seatsData = {};
                for (const screen of fetchedScreens) {
                    try {
                        const seatsResponse = await api.get(`/seats/screens/${screen._id}`);
                        seatsData[screen._id] = seatsResponse.data;
                    } catch (err) {
                        console.error(`Error fetching seats for screen ${screen._id}:`, err);
                        seatsData[screen._id] = []; // Set empty array if fetch fails
                    }
                }
                setSeats(seatsData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load screens and seats.');
                setLoading(false);
            }
        };

        fetchScreensAndSeats();
    }, [theaterId]); // Re-fetch screens and seats when theaterId changes

    const handleDeleteScreen = async (screenId) => {
        if (window.confirm('Are you sure you want to delete this screen?')) {
            try {
                await api.delete(`/theaters/screens/${screenId}`);
                alert('Screen deleted successfully.');
                // Refresh the data
                const screensResponse = await api.get(`/theaters/${theaterId}/screens`);
                setScreens(screensResponse.data);
                
                // Update seats data
                const seatsData = { ...seats };
                delete seatsData[screenId];
                setSeats(seatsData);
            } catch (err) {
                console.error('Error deleting screen:', err);
                alert('Failed to delete screen.');
            }
        }
    };

    const handleEditScreen = (screen) => {
        setEditingScreen(screen);
        setScreenNumber(screen.screen_number);
        setFormat(screen.format);
        
        // Convert seats to row configuration format
        const screenSeats = seats[screen._id] || [];
        const rowConfig = {};
        
        screenSeats.forEach(seat => {
            if (!rowConfig[seat.row]) {
                rowConfig[seat.row] = {
                    row_name: seat.row,
                    seat_numbers: seat.number_in_row.toString(),
                    seat_type: seat.seat_type,
                    price: seat.price
                };
            } else {
                rowConfig[seat.row].seat_numbers += `,${seat.number_in_row}`;
            }
        });

        setSeatRowsConfig(Object.values(rowConfig));
        setIsEditing(true);
        setErrorMessage('');
    };

    const validateRowNames = (rows) => {
        const rowNames = new Set();
        for (const row of rows) {
            const rowName = row.row_name.trim().toUpperCase();
            if (rowNames.has(rowName)) {
                return `Duplicate row name found: ${rowName}`;
            }
            rowNames.add(rowName);
        }
        return '';
    };

    const handleUpdateScreen = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        // Validate for duplicate row names
        const duplicateError = validateRowNames(seatRowsConfig);
        if (duplicateError) {
            setErrorMessage(duplicateError);
            return;
        }

        try {
            // First update the screen details
            const screenPayload = {
                screen_number: screenNumber.trim(),
                format: format.trim()
            };
            await api.put(`/theaters/${theaterId}/screens/${editingScreen._id}`, screenPayload);

            // Then update the seats
            const seatsPayload = seatRowsConfig.flatMap(row => {
                const seatNumbers = row.seat_numbers.split(',').map(num => num.trim());
                return seatNumbers.map(number => ({
                    row: row.row_name.trim().toUpperCase(),
                    number_in_row: parseFloat(number),
                    seat_type: row.seat_type.trim(),
                    price: parseFloat(row.price)
                }));
            });

            await api.put(`/seats/screens/${editingScreen._id}`, { seats: seatsPayload });
            
            alert('Screen and seats updated successfully!');
            setIsEditing(false);
            
            // Refresh the data
            const screensResponse = await api.get(`/theaters/${theaterId}/screens`);
            setScreens(screensResponse.data);
            
            const seatsResponse = await api.get(`/seats/screens/${editingScreen._id}`);
            setSeats(prev => ({
                ...prev,
                [editingScreen._id]: seatsResponse.data
            }));
        } catch (err) {
            console.error('Error updating screen:', err);
            setErrorMessage(err.response?.data?.message || 'Failed to update screen.');
        }
    };

    const handleRowConfigChange = (index, field, value) => {
        const updatedRows = seatRowsConfig.map((row, i) => {
            if (i === index) {
                return { ...row, [field]: value };
            }
            return row;
        });
        setSeatRowsConfig(updatedRows);
        setErrorMessage(''); // Clear error when making changes
    };

    const addRowConfig = () => {
        const newRows = [
            ...seatRowsConfig,
            { row_name: '', seat_numbers: '', seat_type: 'Regular', price: '' }
        ];
        const duplicateError = validateRowNames(newRows);
        if (duplicateError) {
            setErrorMessage(duplicateError);
            return;
        }
        setSeatRowsConfig(newRows);
    };

    const removeRowConfig = (index) => {
        if (seatRowsConfig.length <= 1) {
            alert("At least one row configuration is required.");
            return;
        }
        const updatedRows = seatRowsConfig.filter((_, i) => i !== index);
        setSeatRowsConfig(updatedRows);
        setErrorMessage(''); // Clear error when removing rows
    };

    if (loading) {
        return <p>Loading screens...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="screen-list-container">
            <h2 className="screen-list-title">Screens for Theater ID: {theaterId}</h2>
            {screens.length > 0 ? (
                <ul className="screens-ul">
                    {screens.map(screen => {
                        const screenSeats = seats[screen._id] || [];
                        const rows = {};
                        
                        // Group seats by row
                        screenSeats.forEach(seat => {
                            if (!rows[seat.row]) {
                                rows[seat.row] = {
                                    seats: [],
                                    type: seat.seat_type,
                                    price: seat.price
                                };
                            }
                            rows[seat.row].seats.push(seat.number_in_row);
                        });

                        return (
                            <li key={screen._id} className="screen-list-item">
                                <div className="screen-info">
                                    <h3 className="screen-number">Screen {screen.screen_number}</h3>
                                    <p className="screen-format">Format: {screen.format}</p>
                                    
                                    {/* Display Seat Configuration */}
                                    <div className="seat-configuration">
                                        <h4>Seat Configuration:</h4>
                                        {Object.keys(rows).length > 0 ? (
                                            <div className="seat-rows">
                                                {Object.entries(rows).map(([rowName, rowData]) => (
                                                    <div key={rowName} className="seat-row">
                                                        <div className="row-header">
                                                            <span className="row-name">Row {rowName}</span>
                                                            <span className="seat-type">({rowData.type})</span>
                                                            <span className="seat-price">₹{rowData.price}</span>
                                                        </div>
                                                        <div className="seat-numbers">
                                                            Seats: {rowData.seats.sort((a, b) => a - b).join(', ')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="no-seats">No seats configured for this screen</p>
                                        )}
                                    </div>
                                </div>
                                <div className="screen-actions">
                                    <button className="edit-screen-button" onClick={() => handleEditScreen(screen)}>Edit Screen</button>
                                    <button className="delete-screen-button" onClick={() => handleDeleteScreen(screen._id)}>Delete Screen</button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p>No screens found for this theater.</p>
            )}
            <button className="back-to-theaters-button" onClick={() => navigate('/admin/theaters')}>Back to Theater List</button>

            {/* Edit Screen Modal */}
            {isEditing && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Screen</h2>
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        <form onSubmit={handleUpdateScreen} className="edit-screen-form">
                            <div className="form-group">
                                <label htmlFor="screenNumber">Screen Number/Name:</label>
                                <input
                                    type="text"
                                    id="screenNumber"
                                    value={screenNumber}
                                    onChange={(e) => setScreenNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="format">Screen Format:</label>
                                <input
                                    type="text"
                                    id="format"
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    required
                                    placeholder="e.g., 4K Dolby Atmos, Standard, IMAX Laser"
                                />
                            </div>

                            <h3>Seat Configuration</h3>
                            {seatRowsConfig.map((rowConfig, index) => (
                                <div key={index} className="seat-row-config">
                                    <h4>Row {index + 1} Configuration</h4>
                                    <div className="form-group">
                                        <label htmlFor={`rowName-${index}`}>Row Name (e.g., A, B, C):</label>
                                        <input
                                            type="text"
                                            id={`rowName-${index}`}
                                            value={rowConfig.row_name}
                                            onChange={(e) => handleRowConfigChange(index, 'row_name', e.target.value)}
                                            required
                                            maxLength={3}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`seatNumbers-${index}`}>Seat Numbers (comma-separated):</label>
                                        <input
                                            type="text"
                                            id={`seatNumbers-${index}`}
                                            value={rowConfig.seat_numbers}
                                            onChange={(e) => handleRowConfigChange(index, 'seat_numbers', e.target.value)}
                                            required
                                            placeholder="e.g., 1,2,3,4,5,10,11"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`seatType-${index}`}>Seat Type:</label>
                                        <input
                                            type="text"
                                            id={`seatType-${index}`}
                                            value={rowConfig.seat_type}
                                            onChange={(e) => handleRowConfigChange(index, 'seat_type', e.target.value)}
                                            required
                                            placeholder="e.g., Regular, Premium, Recliner"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`price-${index}`}>Price:</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            id={`price-${index}`}
                                            value={rowConfig.price}
                                            onChange={(e) => handleRowConfigChange(index, 'price', e.target.value)}
                                            required
                                            placeholder="e.g., 150.00"
                                        />
                                    </div>
                                    {seatRowsConfig.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-row-button"
                                            onClick={() => removeRowConfig(index)}
                                        >
                                            Remove Row {index + 1}
                                        </button>
                                    )}
                                    <hr />
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addRowConfig}
                                className="add-row-button"
                            >
                                Add Row Configuration
                            </button>

                            <div className="modal-buttons">
                                <button type="submit" className="submit-button">Update Screen</button>
                                <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenList;