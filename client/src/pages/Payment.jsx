import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedSeats = state?.selectedSeats || [];

  const handlePayment = () => {
    alert('Redirecting to payment gateway...');
    navigate('/');
  };

  return (
    <div className="payment">
      <h2>Payment Summary</h2>
      <p>Seats Selected: {selectedSeats.join(', ')}</p>
      <button onClick={handlePayment}>Confirm Payment</button>
    </div>
  );
};

export default Payment;