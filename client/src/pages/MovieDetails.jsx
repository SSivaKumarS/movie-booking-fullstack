import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMovieById, getMovieBookingStats, getReviewsByMovie, addOrUpdateMyReview, getMyReview, deleteMyReview, enableMovieNotification, disableMovieNotification } from "../api/api";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { FastAverageColor } from 'fast-average-color';
import "./MovieDetails.css";

const VerifiedIcon = ({ role }) => {
    if (role === 'admin') {
        return (
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#75d402" viewBox="0 0 24 24" style={{ marginLeft: '8px' }}>
                <path fillRule="evenodd" d="M12 2c-.791 0-1.55.314-2.11.874l-.893.893a.985.985 0 0 1-.696.288H7.04A2.984 2.984 0 0 0 4.055 7.04v1.262a.986.986 0 0 1-.288.696l-.893.893a2.984 2.984 0 0 0 0 4.22l.893.893a.985.985 0 0 1 .288.696v1.262a2.984 2.984 0 0 0 2.984 2.984h1.262c.261 0 .512.104.696.288l.893.893a2.984 2.984 0 0 0 4.22 0l.893-.893a.985.985 0 0 1 .696-.288h1.262a2.984 2.984 0 0 0 2.984-2.984V15.7c0-.261.104-.512.288-.696l.893-.893a2.984 2.984 0 0 0 0-4.22l-.893-.893a.985.985 0 0 1-.288-.696V7.04a2.984 2.984 0 0 0-2.984-2.984h-1.262a.985.985 0 0 1-.696-.288l-.893-.893A2.984 2.984 0 0 0 12 2Zm3.683 7.73a1 1 0 1 0-1.414-1.413l-4.253 4.253-1.277-1.277a1 1 0 0 0-1.415 1.414l1.985 1.984a1 1 0 0 0 1.414 0l4.96-4.96Z" clipRule="evenodd"/>
            </svg>
        );
    }
    if (role === 'theater_admin') {
        return (
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ marginLeft: '8px' }}>
                <path stroke="#0275d4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8.032 12 1.984 1.984 4.96-4.96m4.55 5.272.893-.893a1.984 1.984 0 0 0 0-2.806l-.893-.893a1.984 1.984 0 0 1-.581-1.403V7.04a1.984 1.984 0 0 0-1.984-1.984h-1.262a1.983 1.983 0 0 1-1.403-.581l-.893-.893a1.984 1.984 0 0 0-2.806 0l-.893.893a1.984 1.984 0 0 1-1.403.581H7.04A1.984 1.984 0 0 0 5.055 7.04v1.262c0 .527-.209 1.031-.581 1.403l-.893.893a1.984 1.984 0 0 0 0 2.806l.893.893c.372.372.581.876.581 1.403v1.262a1.984 1.984 0 0 0 1.984 1.984h1.262c.527 0 1.031.209 1.403.581l.893.893a1.984 1.984 0 0 0 2.806 0l.893-.893a1.985 1.985 0 0 1 1.403-.581h1.262a1.984 1.984 0 0 0 1.984-1.984V15.7c0-.527.209-1.031.581-1.403Z"/>
            </svg>
        );
    }
    return null;
};

const MovieDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for booking stats and timeframe toggle
    const [bookingCount, setBookingCount] = useState(null);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('24h'); // '24h' or '1h'
    
    const [backdropStyle, setBackdropStyle] = useState({});

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsHasMore, setReviewsHasMore] = useState(false);
    const [isReviewsLoading, setIsReviewsLoading] = useState(false);
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState("");
    const [myReviewId, setMyReviewId] = useState(null);
    const { isAuthenticated, user, setUser } = useContext(UserContext);
    const [menuOpenReviewId, setMenuOpenReviewId] = useState(null);
    const [isEditingMyReview, setIsEditingMyReview] = useState(false);
    const [myEligible, setMyEligible] = useState(false);
    const [myHasBooking, setMyHasBooking] = useState(false);
    const [notice, setNotice] = useState("");

    // Effect for fetching main movie details (runs only when 'id' changes)
    useEffect(() => {
        const fetchMovieDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const detailsResponse = await getMovieById(id);
                const movieData = detailsResponse.movie;
                
                setMovie(movieData);
                setShowtimes(detailsResponse.showtimes);

                if (movieData && movieData.poster_url) {
                    const fac = new FastAverageColor();
                    fac.getColorAsync(movieData.poster_url)
                        .then(color => {
                            setBackdropStyle({
                                background: `radial-gradient(ellipse at center, ${color.hex} 0%, #0a0a0a 100%)`
                            });
                        })
                        .catch(e => {
                            console.error("Could not get poster color:", e);
                            setBackdropStyle({
                                background: `radial-gradient(ellipse at center, #222 0%, #0a0a0a 100%)`
                            });
                        });
                }
            } catch (error) {
                console.error("Error fetching movie details:", error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchMovieDetails();
    }, [id]);

    // Effect for fetching booking stats (runs when 'id' or 'timeframe' changes)
    useEffect(() => {
        const fetchStats = async () => {
            if (!id) return;
            setIsStatsLoading(true);
            try {
                const statsResponse = await getMovieBookingStats(id, timeframe);
                setBookingCount(statsResponse.ticketCount);
            } catch (error) {
                console.error(`Error fetching stats for timeframe ${timeframe}:`, error);
                setBookingCount(0); // Default to 0 on error
            } finally {
                setIsStatsLoading(false);
            }
        };

        if (showtimes && showtimes.length > 0) {
            fetchStats();
        }
    }, [id, timeframe, showtimes]);

    // Load reviews
    useEffect(() => {
        const loadReviews = async () => {
            if (!id) return;
            setIsReviewsLoading(true);
            try {
                const res = await getReviewsByMovie(id, { page: reviewsPage, limit: 5 });
                if (reviewsPage === 1) {
                    setReviews(res.items || []);
                } else {
                    setReviews(prev => [...prev, ...(res.items || [])]);
                }
                setReviewsHasMore(res.hasMore);
            } catch (e) {
                console.error('Failed to load reviews', e);
            } finally {
                setIsReviewsLoading(false);
            }
        };
        loadReviews();
    }, [id, reviewsPage]);

    // Load my review to prefill
    useEffect(() => {
        const loadMyReview = async () => {
            if (!id || !isAuthenticated) return;
            try {
                const res = await getMyReview(id);
                setMyEligible(!!res?.eligible);
                setMyHasBooking(!!res?.hasBooking);
                if (res && res.review) {
                    setMyReviewId(res.review._id);
                    setMyRating(res.review.rating || 0);
                    setMyComment(res.review.comment || "");
                    setIsEditingMyReview(false);
                } else {
                    setMyReviewId(null);
                    setMyRating(0);
                    setMyComment("");
                    setIsEditingMyReview(false);
                }
            } catch (_) {
                // ignore
            }
        };
        loadMyReview();
    }, [id, isAuthenticated]);

    const handleDeleteMyReview = async () => {
        if (!isAuthenticated) return;
        if (!confirm('Delete your review?')) return;
        try {
            await deleteMyReview(id);
            const detailsResponse = await getMovieById(id);
            setMovie(detailsResponse.movie);
            setReviewsPage(1);
            setMyReviewId(null);
            setMyRating(0);
            setMyComment("");
            setIsEditingMyReview(false);
        } catch (e) {
            console.error('Failed to delete review', e);
            alert(e?.response?.data?.message || 'Failed to delete review');
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please login to submit a review.');
            return;
        }
        if (myRating < 0.5 || myRating > 5) {
            alert('Please select a rating between 0.5 and 5.');
            return;
        }
        try {
            const isUpdate = !!myReviewId;
            await addOrUpdateMyReview(id, { rating: myRating, comment: myComment });
            // Refresh movie to update avgRatingPoints and reviewCount
            const detailsResponse = await getMovieById(id);
            setMovie(detailsResponse.movie);
            // Reload reviews from first page
            setReviewsPage(1);
            // Show success notice
            setNotice(isUpdate ? 'Review updated successfully.' : 'Review submitted successfully.');
            setTimeout(() => setNotice(""), 3000);
            // Exit edit mode on save
            if (isUpdate) setIsEditingMyReview(false);
        } catch (e) {
            console.error('Failed to submit review', e);
            alert(e?.response?.data?.message || 'Failed to submit review');
        }
    };

    // Star rating components
    const Star = ({ fill = 0 }) => {
        const clamped = Math.max(0, Math.min(1, fill));
        return (
            <div style={{ position: 'relative', width: 24, height: 24, display: 'inline-block' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#444" />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: `${clamped * 100}%`, height: '100%', overflow: 'hidden' }}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#75d402" />
                    </svg>
                </div>
            </div>
        );
    };

    const StarRating = ({ value, onChange, readOnly = false }) => {
        const stars = [0,1,2,3,4];
        const handleClick = (index, e) => {
            if (readOnly) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const half = x < rect.width / 2 ? 0.5 : 1;
            const newValue = index + half;
            onChange(newValue);
        };
        return (
            <div className={`star-rating ${readOnly ? 'read-only' : ''}`} style={{ display: 'inline-flex', gap: 4 }}>
                {stars.map((i) => {
                    const fill = Math.max(0, Math.min(1, value - i));
                    return (
                        <div key={i} onClick={(e) => handleClick(i, e)} style={{ cursor: readOnly ? 'default' : 'pointer' }}>
                            <Star fill={fill} />
                        </div>
                    );
                })}
            </div>
        );
    };


    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">Error: {error.message}</div>;
    }

    if (!movie) {
        return <div className="not-found">Movie not found.</div>;
    }

    const handleBookNow = () => {
        navigate(`/showtimes/${id}`);
    };

    const handleTrailerClick = () => {
        if (movie.trailer_url) {
            window.open(movie.trailer_url, '_blank');
        } else {
            alert('Trailer link not available for this movie.');
        }
    };
    
    const otherReviews = reviews.filter(r => r._id !== myReviewId);
    const isFutureRelease = new Date(movie.release_date) > new Date();
    const notificationsOn = isAuthenticated && Array.isArray(user?.movieNotifications) && user.movieNotifications.some(mId => String(mId) === String(id));

    const toggleMovieNotification = async () => {
        if (!isAuthenticated) { alert('Please login to manage notifications.'); return; }
        try {
            let data;
            if (notificationsOn) {
                data = await disableMovieNotification(id);
            } else {
                data = await enableMovieNotification(id);
            }
            if (setUser && user) {
                setUser({ ...user, likedTheaters: data.likedTheaters, movieNotifications: data.movieNotifications });
            }
        } catch (e) {
            console.error('Failed to toggle movie notification', e);
            alert(e?.response?.data?.message || 'Failed to update notification');
        }
    };

    return (
        <div className="movie-details-wrapper">
            <div className="movie-backdrop" style={backdropStyle}>
                <div className="backdrop-overlay"></div>
            </div>

            <div className="movie-details-content">
                <div className="movie-details-container">
                    <div className="movie-details-poster">
                        <img src={movie.poster_url} alt={movie.title} />
                    </div>

                    <div className="movie-details-info">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h1 className="movie-details-title">{movie.title}</h1>
                            {isFutureRelease && isAuthenticated && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#ccc' }}>
                                        {notificationsOn ? "We'll notify you when booking starts" : "Notify when bookings start"}
                                    </span>
                                    <button 
                                        className={`notify-toggle-btn ${notificationsOn ? 'on' : 'off'}`} 
                                        onClick={toggleMovieNotification} 
                                        aria-pressed={notificationsOn}
                                        title={notificationsOn ? 'Disable notifications for this movie' : 'Enable notifications for this movie'}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', padding: 0 }}
                                    >
                                        {notificationsOn ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.429 2.413a.75.75 0 0 0-1.13-.986l-1.292 1.48a4.75 4.75 0 0 0-1.17 3.024L2.78 8.65a.75.75 0 0 0 1.5.031l.056-2.718a3.25 3.25 0 0 1 .801-2.069l1.292-1.48Z"/><path fill="currentColor" fillRule="evenodd" d="M6.237 7.7a4.214 4.214 0 0 1 4.206-3.95H11V3a1 1 0 1 1 2 0v.75h.557a4.214 4.214 0 0 1 4.206 3.95l.221 3.534a7.376 7.376 0 0 0 1.308 3.754a1.617 1.617 0 0 1-1.135 2.529l-3.407.408V19a2.75 2.75 0 1 1-5.5 0v-1.075l-3.407-.409a1.617 1.617 0 0 1-1.135-2.528a7.377 7.377 0 0 0 1.308-3.754l.221-3.533ZM10.75 19a1.25 1.25 0 0 0 2.5 0v-.75h-2.5V19Z" clipRule="evenodd"/><path fill="currentColor" d="M17.643 1.355a.75.75 0 0 0-.072 1.058l1.292 1.48a3.25 3.25 0 0 1 .8 2.07l.057 2.717a.75.75 0 1 0 1.5-.031l-.057-2.718a4.75 4.75 0 0 0-1.17-3.024l-1.292-1.48a.75.75 0 0 0-1.058-.072Z"/></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" d="M13 3a1 1 0 1 0-2 0v.75h-.557A4.214 4.214 0 0 0 6.237 7.7l-.221 3.534a7.377 7.377 0 0 1-1.308 3.754a1.617 1.617 0 0 0 1.135 2.529l3.407.408V19a2.75 2.75 0 1 0 5.5 0v-1.075l3.407-.409a1.617 1.617 0 0 0 1.135-2.528a7.376 7.376 0 0 1-1.308-3.754l-.221-3.533a4.214 4.214 0 0 0-4.206-3.951H13V3Zm-2.557 2.25a2.714 2.714 0 0 0-2.709 2.544l-.22 3.534a8.877 8.877 0 0 1-1.574 4.516a.117.117 0 0 0 .082.183l3.737.449c1.489.178 2.993.178 4.482 0l3.737-.449a.117.117 0 0 0 .082-.183a8.877 8.877 0 0 1-1.573-4.516l-.221-3.534a2.714 2.714 0 0 0-2.709-2.544h-3.114Zm1.557 15c-.69 0-1.25-.56-1.25-1.25v-.75h2.5V19c0 .69-.56 1.25-1.25 1.25Z" clipRule="evenodd"/></svg>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="movie-details-format">
                            <span className="format-pill">{Array.isArray(movie.languages) ? movie.languages.join(', ') : movie.languages}</span>
                            <span className="format-pill">{movie.duration}m</span>
                            {movie.rating && <span className="format-pill age-rating">{movie.rating}+</span>}
                        </div>

                        <div className="movie-details-misc">
                            <span>{new Date(movie.release_date).toLocaleDateString("en-GB", {
                                day: "numeric", month: "short", year: "numeric",
                            })}</span>
                            <span className="dot-separator">•</span>
                            <span>{movie.genre}</span>
                            {typeof movie.avgRatingPoints === 'number' && new Date(movie.release_date) <= new Date() && (
                                <>
                                    <span className="dot-separator">•</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#75d402">
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                        {movie.avgRatingPoints.toFixed(1)} / 5 ({movie.reviewCount || 0} reviews)
                                    </span>
                                </>
                            )}
                        </div>
                        
                        {/* UPDATED: Booking stats with toggle */}
                        {showtimes.length > 0 && (
                            <div className="booking-stats">
                                <div className="timeframe-toggle">
                                    <button 
                                        className={`toggle-btn ${timeframe === '24h' ? 'active' : ''}`}
                                        onClick={() => setTimeframe('24h')}>
                                        Last 24h
                                    </button>
                                    <button 
                                        className={`toggle-btn ${timeframe === '1h' ? 'active' : ''}`}
                                        onClick={() => setTimeframe('1h')}>
                                        Last 1h
                                    </button>
                                </div>
                                <div className="stats-display">
                                    {isStatsLoading ? (
                                        <span className="stats-loader"></span>
                                    ) : (
                                        <p>
                                            <strong>{bookingCount}</strong> tickets booked in the last {timeframe === '24h' ? '24 hours' : 'hour'}!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="movie-details-about">
                            <h3>About the movie</h3>
                            <p>{movie.description}</p>
                        </div>

                        <div className="action-buttons">
                            {showtimes.length > 0 ? (
                                <button className="book-tickets-button" onClick={handleBookNow}>
                                    <svg className="ticket-icon" viewBox="0 0 24 24">
                                        <path d="M15.58 16.8L12 14.5l-3.58 2.3 1.08-4.12L6.21 10l4.25-.26L12 5.8l1.54 3.94 4.25.26-3.29 2.68 1.08 4.12zM20 12c0-1.1.9-2 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2z" />
                                    </svg>
                                    Book Tickets
                                </button>
                            ) : (
                                <div className="no-showtimes">
                                    <p>No showtimes available currently</p>
                                </div>
                            )}

                            <button className="trailer-button" onClick={handleTrailerClick}>
                                <svg className="play-icon" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Watch Trailer
                            </button>
                        </div>
                    </div>
                {/* Reviews Section */}
                <div className="reviews-section">
                    <h3>Reviews & Ratings</h3>
                    {notice && (
                        <div className="review-notice">
                            {notice}
                        </div>
                    )}
                    {isAuthenticated && (
                        <>
                            {myReviewId && !isEditingMyReview ? (
                                <div className="my-review-card">
                                    <button 
                                        type="button"
                                        aria-label="More options"
                                        onClick={() => setMenuOpenReviewId(menuOpenReviewId === 'mine' ? null : 'mine')}
                                        className="review-menu-btn"
                                    >
                                        ⋮
                                    </button>
                                    {menuOpenReviewId === 'mine' && (
                                        <div className="review-menu">
                                            {myEligible && (
                                                <button type="button" onClick={() => { setIsEditingMyReview(true); setMenuOpenReviewId(null); }}>Edit</button>
                                            )}
                                            <button type="button" onClick={() => { setMenuOpenReviewId(null); handleDeleteMyReview(); }} className="delete-btn">Delete</button>
                                        </div>
                                    )}
                                    <div className="review-header">
                                        <img src={user?.profile_picture || 'https://ui-avatars.com/api/?background=222&color=fff&name=' + encodeURIComponent(user?.name || 'U')}
                                            alt="avatar"
                                            className="review-avatar" />
                                        <div className="review-meta">
                                            <div className="review-author" style={{ display: 'flex', alignItems: 'center' }}>
                                                Your Review
                                                <VerifiedIcon role={user?.role} />                                            </div>
                                            <div className="star-rating-display">
                                                <StarRating value={myRating} readOnly={true} />
                                                <span className="rating-value">{myRating.toFixed(1)} / 5</span>
                                            </div>
                                        </div>
                                    </div>
                                    {myComment && (
                                        <div className="review-body">
                                            <p className="review-comment">{myComment}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {myEligible ? (
                                        <form onSubmit={handleSubmitReview} className="review-form">
                                            <div className="form-group">
                                                <label>Your Rating</label>
                                                <div className="rating-group">
                                                    <StarRating value={myRating} onChange={setMyRating} />
                                                    <div className="rating-value-display">{myRating ? myRating.toFixed(1) : '0.0'}</div>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="review-comment">Your Comment (optional)</label>
                                                <textarea id="review-comment" value={myComment} onChange={(e) => setMyComment(e.target.value)} rows={4} placeholder="Share your thoughts about the movie..."/>
                                            </div>
                                            <div className="form-actions">
                                                <button type="submit">{myReviewId ? 'Save Changes' : 'Submit Review'}</button>
                                                {myReviewId && isEditingMyReview && (
                                                    <button type="button" onClick={() => setIsEditingMyReview(false)} className="cancel-btn">Cancel</button>
                                                )}
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="review-notice">{myHasBooking ? 'You can review this movie after your show has ended.' : 'First book ticket to review.'}</div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                    {isReviewsLoading && otherReviews.length === 0 ? (
                        <p>Loading reviews...</p>
                    ) : (
                        <ul className="reviews-list">
                            {otherReviews.map((r) => (
                                <li key={r._id} className="review-card">
                                    <div className="review-header">
                                        <img src={r.userId?.profile_picture || 'https://ui-avatars.com/api/?background=222&color=fff&name=' + encodeURIComponent(r.userId?.name || 'U')}
                                            alt="avatar"
                                            className="review-avatar" />
                                        <div className="review-meta">
                                            <div className="review-author" style={{ display: 'flex', alignItems: 'center' }}>
                                                {r.userId?.name || 'User'}
                                                <VerifiedIcon role={r.userId?.role} />
                                            </div>
                                            <div className="review-date">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        </div>
                                    </div>
                                    <div className="review-body">
                                        <div className="star-rating-display" style={{ marginBottom: '1rem' }}>
                                            <StarRating value={r.rating} readOnly={true} />
                                            <span className="rating-value">{r.rating.toFixed(1)} / 5</span>
                                        </div>
                                        {r.comment && <p className="review-comment">{r.comment}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {reviewsHasMore && (
                        <button disabled={isReviewsLoading} onClick={() => setReviewsPage(p => p + 1)} className="load-more-reviews">
                            {isReviewsLoading ? 'Loading...' : 'Load More Reviews'}
                        </button>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetails;