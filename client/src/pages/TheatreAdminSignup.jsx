// src/pages/TheatreAdminSignup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // If you are using React Router for navigation
import './TheatreAdminSignup.css'; // Optional CSS file
import { signupTheatreAdmin } from '../api/api'; // Assuming you have an api.js for API calls

const TheatreAdminSignup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [theaterName, setTheaterName] = useState('');
    const [theaterLocation, setTheaterLocation] = useState('');
    const [theaterCity, setTheaterCity] = useState('');
    const [theaterCapacity, setTheaterCapacity] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate(); // If using React Router

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        // Input validation can be added here if needed on frontend as well

        try {
            const response = await signupTheatreAdmin({ // Call API function
                name,
                email,
                password,
                phone_number: phoneNumber,
                theater_name: theaterName,
                theater_location: theaterLocation,
                theater_city: theaterCity,
                theater_capacity: parseInt(theaterCapacity), // Ensure capacity is sent as a number
            });

            if (response.status === 201) {
                setSuccessMessage(response.data.message);
                // Optionally redirect to admin panel or login page after successful signup
                // navigate('/admin'); // Example redirect using React Router
                // Clear form fields after successful signup if needed
                setName('');
                setEmail('');
                setPassword('');
                setPhoneNumber('');
                setTheaterName('');
                setTheaterLocation('');
                setTheaterCity('');
                setTheaterCapacity('');
            } else {
                setError(response.data.error || 'Signup failed'); // Handle specific error message from backend
            }
        } catch (err) {
            setError('Error signing up theatre admin');
            console.error('Theatre Admin Signup Error:', err);
        }
    };

    return (
        <div className="theatre-admin-signup-container">
            <h2>Theatre Admin Signup</h2>
            {successMessage && <p className="success-message">{successMessage}</p>}
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number:</label>
                    <input type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="theaterName">Theater Name:</label>
                    <input type="text" id="theaterName" value={theaterName} onChange={(e) => setTheaterName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="theaterLocation">Theater Location:</label>
                    <input type="text" id="theaterLocation" value={theaterLocation} onChange={(e) => setTheaterLocation(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="theaterCity">Theater City:</label>
                    <input type="text" id="theaterCity" value={theaterCity} onChange={(e) => setTheaterCity(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="theaterCapacity">Theater Capacity:</label>
                    <input type="number" id="theaterCapacity" value={theaterCapacity} onChange={(e) => setTheaterCapacity(e.target.value)} required />
                </div>

                <button type="submit" className="submit-button">Signup Theatre Admin</button>
            </form>
        </div>
    );
};

export default TheatreAdminSignup;