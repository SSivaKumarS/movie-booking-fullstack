import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/api';
import './Checkout.css';

// Icon Components
const MovieIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>;
const TheaterIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/></svg>;
const ScreenIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>;
const SeatIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18v3h3v-3h10v3h3v-6H4v3zm15-8h3v3h-3v-3zM2 10h3v3H2v-3zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8z"/></svg>;
const ClockIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>;
const TicketIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z"/></svg>;
const SecurityIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>;
const GiftIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>;

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL;
    const { booking } = location.state || {};

    const [promoCode, setPromoCode] = useState('');
    const [pricing, setPricing] = useState({ subtotal: 0, discount: 0, finalTotal: 0, applied: null });
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [isPromoVisible, setIsPromoVisible] = useState(false);

    useEffect(() => {
        if (!booking) {
            navigate('/');
            return;
        }
        const subtotal = booking.subtotalAmount ?? booking.totalAmount ?? 0;
        setPricing({ subtotal, discount: booking.discountAmount || 0, finalTotal: booking.totalAmount || subtotal, applied: booking.appliedOffer || null });
        
        (async () => {
            try {
                const res = await api.post('/offers/apply-to-booking', { bookingId: booking._id });
                const data = res.data?.data;
                if (data) {
                    setPricing({
                        subtotal: data.subtotalAmount,
                        discount: data.discountAmount,
                        finalTotal: data.totalAmount,
                        applied: data.appliedOffer,
                    });
                }
            } catch (e) {
                console.warn('[Checkout] Auto-apply conditional offer failed:', e.response?.data || e.message);
            }
        })();
    }, [booking, navigate]);

    const applyOffer = async () => {
        try {
            setError('');
            const res = await api.post('/offers/apply-to-booking', { bookingId: booking._id, promoCode: promoCode?.trim() || undefined });
            const data = res.data?.data;
            setPricing({
                subtotal: data.subtotalAmount,
                discount: data.discountAmount,
                finalTotal: data.totalAmount,
                applied: data.appliedOffer,
            });
        } catch (e) {
            setError(e.response?.data?.message || 'Invalid or expired promo code.');
        }
    };

    const proceedToPayment = async () => {
        try {
            setIsProcessing(true);
            setError('');
            const orderResponse = await axios.post(`${API_URL}/payments/create-order`, {
                amount: pricing.finalTotal,
                bookingId: booking._id
            });
            const { order } = orderResponse.data;

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
            script.onload = () => {
                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'CinePlus',
                    description: 'Movie Ticket Booking',
                    order_id: order.id,
                    handler: async function (response) {
                        try {
                            await axios.post(`${API_URL}/payments/verify-payment`, {
                                order_id: response.razorpay_order_id,
                                payment_id: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                bookingId: booking._id
                            });
                            navigate('/bookings');
                        } catch (error) {
                            setError('Payment verification failed. Please contact support.');
                            // Mark payment failed to release seats
                            try { await api.post('/payments/payment-failed', { bookingId: booking._id, reason: 'verification_failed' }); } catch {}
                        }
                    },
                    prefill: {
                        // You can prefill user details here if available
                    },
                    theme: { color: '#75d402' },
                    modal: {
                        ondismiss: async () => {
                            // User closed the modal without paying; release seats
                            try { await api.post('/payments/payment-failed', { bookingId: booking._id, reason: 'user_dismissed' }); } catch {}
                        }
                    }
                };
                const razorpay = new window.Razorpay(options);
                // Catch explicit payment failed event
                razorpay.on('payment.failed', async (response) => {
                    setError(response.error?.description || 'Payment failed. Please try again.');
                    try { await api.post('/payments/payment-failed', { bookingId: booking._id, reason: 'payment_failed' }); } catch {}
                });
                razorpay.open();
                setIsProcessing(false);
            };
            script.onerror = () => {
                setError('Failed to load payment gateway. Please check your connection.');
                setIsProcessing(false);
            };
        } catch (e) {
            setError(e.response?.data?.message || 'An error occurred while preparing your payment.');
            setIsProcessing(false);
        }
    };

    const formatShowtime = (dateString) => {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    if (!booking) return null;

    return (
        <div className="checkout-container">
            <div className="checkout-card">
                <div className="checkout-header">
                    <div className="header-icon">
                        <TicketIcon />
                    </div>
                    <h1>Checkout Summary</h1>
                    <p className="header-subtitle">Complete your booking experience</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                
                <div className="booking-details">
                    <h3>Booking Information</h3>
                    <div className="details-grid">
                        {booking?.movieTitle && (
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <MovieIcon />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Movie</span>
                                    <span className="detail-value">{booking.movieTitle}</span>
                                </div>
                            </div>
                        )}
                        {booking?.theaterName && (
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <TheaterIcon />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Theater</span>
                                    <span className="detail-value">{booking.theaterName}</span>
                                </div>
                            </div>
                        )}
                        {booking?.screenNumber && (
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <ScreenIcon />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Screen</span>
                                    <span className="detail-value">{booking.screenNumber}</span>
                                </div>
                            </div>
                        )}
                        {booking?.seatLabels && (
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <SeatIcon />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Seats</span>
                                    <span className="detail-value seats">{booking.seatLabels}</span>
                                </div>
                            </div>
                        )}
                        {booking?.showtimeTime && (
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <ClockIcon />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Showtime</span>
                                    <span className="detail-value">{formatShowtime(booking.showtimeTime)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pricing-section">
                    <h3>Payment Summary</h3>
                    <div className="price-breakdown">
                        <div className="price-item">
                            <span>Subtotal</span>
                            <span>₹{pricing.subtotal.toFixed(2)}</span>
                        </div>
                        
                        {pricing.discount > 0 && (
                            <div className="price-item discount">
                                <span>Discount {pricing.applied?.title ? `(${pricing.applied.title})` : ''}</span>
                                <span>-₹{pricing.discount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="price-total">
                            <span>Total Payable</span>
                            <span>₹{pricing.finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="promo-section">
                    {!isPromoVisible ? (
                        <button className="promo-toggle" onClick={() => setIsPromoVisible(true)}>
                            <GiftIcon />
                            <span>Add Promo Code</span>
                        </button>
                    ) : (
                        <div className="promo-input-group">
                            <div className="input-wrapper">
                                <input 
                                    placeholder="Enter your promo code" 
                                    value={promoCode} 
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    className="promo-input"
                                />
                                <span className="input-icon">
                                    <TicketIcon />
                                </span>
                            </div>
                            <button onClick={applyOffer} className="promo-apply">Apply</button>
                        </div>
                    )}
                </div>

                <div className="payment-actions">
                    <button 
                        onClick={proceedToPayment} 
                        disabled={isProcessing}
                        className="payment-button"
                    >
                        {isProcessing ? (
                            <div className="loading-spinner">
                                <div className="spinner"></div>
                                Processing...
                            </div>
                        ) : (
                            `Pay ₹${pricing.finalTotal.toFixed(2)}`
                        )}
                    </button>
                    <p className="secure-payment">
                        <SecurityIcon />
                        Your payment is secure and encrypted
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Checkout;