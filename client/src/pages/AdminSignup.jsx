// frontend/src/pages/AdminSignup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import './Signup.css'; // You can reuse Signup.css or create a new one

function AdminSignup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone_number, setPhone_number] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/adminsignup', { // Changed endpoint to /auth/adminsignup
        name,
        email,
        password,
        phone_number,
      });

      setSuccess(response.data.message); // "Admin user created successfully"
      setTimeout(() => {
           navigate('/login'); // Redirect to login after 2 seconds
         }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Admin signup failed. Please try again.'); // Updated error message
      }
    }
  };

  return (
    <div className="signup-container">
    <div className="signup-box">
      <h2>Create Admin Account</h2> {/* Updated heading */}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="phone_number">Phone Number:</label>
          <input
            type="tel"
            id="phone_number"
            value={phone_number}
            onChange={(e) => setPhone_number(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="signup-button">
          Sign Up as Admin
        </button> {/* Updated button text */}
      </form>
    </div>
  </div>
   );
}

export default AdminSignup;