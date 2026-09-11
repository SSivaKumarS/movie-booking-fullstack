// src/pages/CreateScreen.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import './CreateMovie.css'; // Reuse CreateMovie.css for styling (or rename/create CreateScreen.css)

const CreateScreen = () => {
    const { theaterId } = useParams(); // Get theaterId from URL params
    const navigate = useNavigate();

    // State Initialization
    const [screenNumber, setScreenNumber] = useState('');
    const [format, setFormat] = useState(''); // <-- Add state for format
    // Initialize with one default row configuration
    const [seatRowsConfig, setSeatRowsConfig] = useState([
        { row_name: '', seat_numbers: '', seat_type: 'Regular', price: '' } // Start price empty for validation
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // State for error messages

    // Effect to log theaterId on component mount or when it changes (for debugging)
    useEffect(() => {
        console.log("CreateScreen component mounted with theaterId:", theaterId);
        if (!theaterId || theaterId === 'undefined') {
             setErrorMessage("Error: Invalid Theater ID provided in URL.");
             // Optionally redirect or disable form
        }
    }, [theaterId]);


    const handleScreenNumberChange = (e) => {
        setScreenNumber(e.target.value);
    };

    // <-- Add handler for format change -->
    const handleFormatChange = (e) => {
        setFormat(e.target.value);
    };

    // Handle changes within a specific row configuration
    const handleRowConfigChange = (index, field, value) => {
        // Create a deep copy to avoid direct state mutation
        const updatedRows = seatRowsConfig.map((row, i) => {
            if (i === index) {
                return { ...row, [field]: value };
            }
            return row;
        });
        setSeatRowsConfig(updatedRows);
    };

    // Add a new blank row configuration
    const addRowConfig = () => {
        setSeatRowsConfig([
            ...seatRowsConfig,
            { row_name: '', seat_numbers: '', seat_type: 'Regular', price: '' } // Default new row
        ]);
    };

    // Remove a row configuration by its index
    const removeRowConfig = (index) => {
        // Prevent removing the last row if desired, or handle accordingly
        if (seatRowsConfig.length <= 1) {
            setErrorMessage("At least one row configuration is required.");
            return;
        }
        const updatedRows = seatRowsConfig.filter((_, i) => i !== index);
        setSeatRowsConfig(updatedRows);
        setErrorMessage(''); // Clear error if removing row fixes it
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Clear previous errors
        setIsLoading(true);

        // --- Basic Validation ---
        if (!theaterId || theaterId === 'undefined') {
            setErrorMessage("Error: Theater ID is missing. Cannot create screen.");
            setIsLoading(false);
            return;
        }
         if (!screenNumber || isNaN(parseInt(screenNumber, 10))) {
            setErrorMessage("Please enter a valid screen number.");
            setIsLoading(false);
            return;
        }
        // <-- Add validation for format -->
        if (!format || format.trim() === '') {
            setErrorMessage("Please enter the screen format description.");
            setIsLoading(false);
            return;
        }
        // Add more validation for seatRowsConfig if needed (e.g., check for empty fields)
        const hasEmptyFields = seatRowsConfig.some(row =>
             !row.row_name.trim() || !row.seat_numbers.trim() || !row.seat_type.trim() || row.price === '' || isNaN(parseFloat(row.price))
         );
         if (hasEmptyFields) {
            setErrorMessage("Please fill in all fields for each seat row configuration and ensure price is a number.");
            setIsLoading(false);
            return;
         }
        // --- End Basic Validation ---


        // --- Prepare Payload ---
        // Ensure row names are uppercase, prices are numbers
        const seatRows = seatRowsConfig.map(row => ({
            row_name: row.row_name.trim().toUpperCase(),
            seat_numbers: row.seat_numbers.trim(), // Backend will handle parsing comma-separated string
            seat_type: row.seat_type.trim(),
            price: parseFloat(row.price) // Ensure price is sent as a number
        }));

        const payload = {
            screen_number: screenNumber.trim(), // Send screen number as string, backend handles type if needed
            seatRows: seatRows,
            format: format.trim(), // <-- Add format to payload -->
        };

        console.log("Payload being sent to create screen API:", JSON.stringify(payload, null, 2)); // Log the formatted payload
        console.log(`API Endpoint URL: /theaters/${theaterId}/screens`);

        try {
            // API call using the correct theaterId
            await api.post(`/theaters/${theaterId}/screens`, payload);
            alert('Screen created successfully!'); // Simple success feedback
            // Optionally navigate away after success
            navigate(`/admin/theaters/${theaterId}`); // Example: Navigate to theater detail page
            // Or navigate('/admin'); // Back to main admin panel

        } catch (error) {
            console.error('Error creating screen:', error.response ? error.response.data : error);
             // Set user-friendly error message from backend if available
             let friendlyErrorMessage = 'Failed to create screen. Please check details or try again later.';
             if (error.response && error.response.data && error.response.data.message) {
                 friendlyErrorMessage = error.response.data.message;
             } else if (error.response && error.response.status === 403) {
                 friendlyErrorMessage = "Forbidden: You might not have permission to add screens to this theater.";
             } else if (error.response && error.response.status === 409) { // Conflict (e.g., duplicate screen number)
                friendlyErrorMessage = `Conflict: ${friendlyErrorMessage}`; // Prepend Conflict
             }
             setErrorMessage(friendlyErrorMessage);
        } finally {
            setIsLoading(false); // Stop loading
        }
    };

    return (
        // Using create-movie-container but consider creating CreateScreen.css
        <div className="create-movie-container">
            {/* Display Theater ID clearly */}
            <h2>Create Screen {screenNumber ? `(#${screenNumber})` : ''} for Theater</h2>
             {theaterId && theaterId !== 'undefined' ? (
                 <p>Theater ID: {theaterId}</p>
             ) : (
                 <p className="error-message">Loading Theater ID or Invalid URL...</p>
             )}

            {/* Display Error Messages */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <form onSubmit={handleSubmit} className="create-movie-form">
                <div className="form-group">
                    <label htmlFor="screenNumber">Screen Number/Name:</label>
                    <input
                        type="text" // Allow text like 'Audi 1', 'IMAX' etc.
                        id="screenNumber"
                        value={screenNumber}
                        onChange={handleScreenNumberChange}
                        required
                        disabled={isLoading} // Disable during loading
                    />
                </div>
                {/* <-- Add Format Input Field --> */}
                <div className="form-group">
                    <label htmlFor="format">Screen Format:</label>
                    <input
                        type="text"
                        id="format"
                        value={format}
                        onChange={handleFormatChange}
                        required
                        disabled={isLoading}
                        placeholder="e.g., 4K Dolby Atmos, Standard, IMAX Laser"
                    />
                </div>

                <h3>Seat Configuration</h3>
                {seatRowsConfig.map((rowConfig, index) => (
                    <div key={index} className="seat-row-config"> {/* Add a class for styling row blocks */}
                        <h4>Row {index + 1} Configuration</h4>
                        <div className="form-group">
                            <label htmlFor={`rowName-${index}`}>Row Name (e.g., A, B, C):</label>
                            <input
                                type="text"
                                id={`rowName-${index}`}
                                value={rowConfig.row_name}
                                onChange={(e) => handleRowConfigChange(index, 'row_name', e.target.value)}
                                required
                                disabled={isLoading}
                                maxLength={3} // Example constraint
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
                                disabled={isLoading}
                                placeholder="e.g., 1,2,3,4,5,10,11"
                            />
                             <p className="form-instruction">No spaces, just comma-separated numbers.</p>
                        </div>
                        <div className="form-group">
                            <label htmlFor={`seatType-${index}`}>Seat Type:</label>
                            <input // Consider changing to a <select> if types are predefined
                                type="text"
                                id={`seatType-${index}`}
                                value={rowConfig.seat_type}
                                onChange={(e) => handleRowConfigChange(index, 'seat_type', e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="e.g., Regular, Premium, Recliner"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`price-${index}`}>Price:</label>
                            <input
                                type="number" // Use number for better input control
                                step="0.01" // Allow decimals if needed
                                min="0" // Prevent negative prices
                                id={`price-${index}`}
                                value={rowConfig.price}
                                onChange={(e) => handleRowConfigChange(index, 'price', e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="e.g., 150.00"
                            />
                        </div>
                        {/* Only show Remove button if more than one row exists */}
                        {seatRowsConfig.length > 1 && (
                            <button
                                type="button"
                                className="remove-row-button" // Add class for styling
                                onClick={() => removeRowConfig(index)}
                                disabled={isLoading}
                            >
                                Remove Row {index + 1}
                            </button>
                        )}
                        <hr /> {/* Separator between row configs */}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addRowConfig}
                    disabled={isLoading}
                    className="add-row-button" // Add class for styling
                >
                    Add Row Configuration
                </button>

                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Screen'}
                </button>
            </form>
        </div>
    );
};

export default CreateScreen;