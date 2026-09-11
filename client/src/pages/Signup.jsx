// src/pages/Signup.jsx

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Import API functions
import { sendSignupOtp, completeSignup } from '../api/api';

import './Signup.css';

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [stars, setStars] = useState([]);

  // Starfield effect
  useEffect(() => {
    const generateStars = () => {
      const starCount = 80;

      const newStars = Array.from({ length: starCount }, (_, index) => ({
        id: index,
        style: {
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          animationDuration: `${Math.random() * 3 + 2}s`,
          animationDelay: `${Math.random() * 5}s`
        }
      }));

      setStars(newStars);
    };

    generateStars();
  }, []);

  // Handle changes in regular form fields
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });

    // Clear errors when user starts typing
    setError('');
    setOtpError('');
  };

  // Handle changes in OTP field
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');

    if (value.length <= 4) {
      setOtp(value);
      setOtpError('');
    }
  };

  // Step 1: Request OTP
  const handleSendOtp = async (event) => {
    event.preventDefault();

    setError('');
    setOtpError('');
    setSuccess('');

    // Frontend Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone_number
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!/^\d{10}$/.test(formData.phone_number)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoadingOtp(true);

    try {
      await sendSignupOtp(formData.email);

      setSuccess(
        'OTP sent successfully to your email. Please check your inbox (and spam folder).'
      );

      setIsOtpSent(true);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        'Failed to send OTP. Please try again.';

      setError(errorMessage);
    } finally {
      setLoadingOtp(false);
    }
  };

  // Step 2: Verify OTP and Complete Signup
  const handleCompleteSignup = async (event) => {
    event.preventDefault();

    setOtpError('');
    setError('');
    setSuccess('');

    if (otp.length !== 4) {
      setOtpError('Please enter the 4-digit OTP.');
      return;
    }

    setLoadingSignup(true);

    try {
      const signupData = {
        ...formData,
        otp
      };

      const response = await completeSignup(signupData);

      setSuccess(
        response.message ||
          'Signup successful! Redirecting to login...'
      );

      // Redirect after success message display
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        'Signup failed. Please try again.';

      if (errorMessage.toLowerCase().includes('otp')) {
        setOtpError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoadingSignup(false);
    }
  };

  // Determine which submit handler to use based on the step
  const handleSubmit = isOtpSent
    ? handleCompleteSignup
    : handleSendOtp;

  return (
    <div className="signup-container">

      <div className="stars">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={star.style}
          />
        ))}
      </div>

      <div className="signup-box">

        <h2>
          {isOtpSent
            ? 'Verify Your Email'
            : 'Create Your XavierCinema Account'}
        </h2>

        {/* General Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Success Message Display */}
        {success && !loadingSignup && (
          <div className="success-message">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Details Input Fields */}
          {!isOtpSent && (
            <>
              <div className="input-group">
                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={loadingOtp}
                  aria-required="true"
                />
              </div>

              <div className="input-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  disabled={loadingOtp}
                  aria-required="true"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">
                  Password
                </label>

                <div className="password-input-container">

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    minLength="6"
                    required
                    disabled={loadingOtp}
                    aria-required="true"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    disabled={loadingOtp}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>

                </div>
              </div>

              <div className="input-group">
                <label htmlFor="phone_number">
                  Phone Number
                </label>

                <input
                  type="tel"
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="10 digits"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                  disabled={loadingOtp}
                  aria-required="true"
                />
              </div>
            </>
          )}

          {/* OTP Input Field */}
          {isOtpSent && (
            <div className="input-group">

              <label htmlFor="otp">
                Enter 4-Digit OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                id="otp"
                value={otp}
                onChange={handleOtpChange}
                placeholder="----"
                maxLength="4"
                required
                disabled={loadingSignup}
                aria-required="true"
                aria-describedby="otp-error"
                className={
                  otpError
                    ? 'input-error'
                    : ''
                }
                autoComplete="one-time-code"
              />

              {otpError && (
                <div
                  id="otp-error"
                  className="error-message otp-error-message"
                >
                  {otpError}
                </div>
              )}

            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="signup-button"
            disabled={
              loadingOtp ||
              loadingSignup
            }
          >
            {loadingOtp &&
              'Sending OTP...'}

            {loadingSignup &&
              'Verifying & Signing Up...'}

            {!loadingOtp &&
              !loadingSignup &&
              (isOtpSent
                ? 'Verify & Sign Up'
                : 'Send OTP & Continue')}
          </button>

          {/* Link to Login */}
          {!isOtpSent && (
            <p className="login-link">
              Already have an account?{' '}
              <Link to="/login">
                Log In
              </Link>
            </p>
          )}

          {/* Placeholder for Resend OTP */}
          {/*
          {isOtpSent && (
            <button
              type="button"
              className="resend-otp-button"
              disabled={resendDisabled || loadingOtp}
            >
              Resend OTP
              {timer > 0 ? ` (${timer}s)` : ''}
            </button>
          )}
          */}

        </form>
      </div>
    </div>
  );
}

export default Signup;