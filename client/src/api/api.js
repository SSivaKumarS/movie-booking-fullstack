import axios from 'axios';

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Remove /api/v1 if it's already in the base URL to prevent duplication
const normalizedBaseURL = API_BASE_URL.endsWith('/api/v1') 
    ? API_BASE_URL
    : `${API_BASE_URL}/api/v1`;

console.log("API Base URL:", normalizedBaseURL);

// Create an axios instance with the base URL and default headers
const api = axios.create({
    baseURL: normalizedBaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Track active requests
let activeRequests = 0;
let loadingTimeout;

// Custom event for loading state
const LOADING_EVENT = 'api-loading-state-change';

// Function to dispatch loading state changes
const dispatchLoadingState = (isLoading) => {
    window.dispatchEvent(new CustomEvent(LOADING_EVENT, { detail: { isLoading } }));
};

// --- Request Interceptor ---
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        activeRequests++;
        
        loadingTimeout = setTimeout(() => {
            if (activeRequests > 0) {
                dispatchLoadingState(true);
            }
        }, 1000);

        return config;
    },
    (error) => {
        console.error('[API Interceptor] Request Error:', error);
        return Promise.reject(error);
    }
);

export const sendSignupOtp = async (email) => {
    const response = await api.post('/auth/send-otp', { email });
    return response.data;
};

export const completeSignup = async (signupData) => {
    const response = await api.post('/auth/complete-signup', signupData);
    return response.data;
};

// --- Response Interceptor ---
api.interceptors.response.use(
    (response) => {
        activeRequests--;
        
        clearTimeout(loadingTimeout);
        
        if (activeRequests === 0) {
            dispatchLoadingState(false);
        }

        return response;
    },
    (error) => {
        activeRequests--;
        
        clearTimeout(loadingTimeout);
        
        if (activeRequests === 0) {
            dispatchLoadingState(false);
        }

        if (error.response) {
            console.error('[API Error Response]', error.response.data);
            console.error('[API Error Status]', error.response.status);
            console.error('[API Error Headers]', error.response.headers);
        } else if (error.request) {
            console.error('[API Error Request] No response received:', error.request);
        } else {
            console.error('[API Error Setup] Request setup error:', error.message);
        }
        return Promise.reject(error);
    }
);

// =========================================
// API Function Exports
// =========================================

// --- Auth ---
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const signup = async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
};

export const signupTheatreAdmin = async (signupData) => {
    const response = await api.post('/auth/theatreadminsignup', signupData);
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data.user;
};

export const changePassword = async (passwordData) => {
    const response = await api.put('/auth/password', passwordData);
    return response.data;
};

// --- Movies ---
export const getAllMovies = async (queryParams = {}) => {
    const response = await api.get('/movies', { params: queryParams });
    return response.data;
};

export const getMovieById = async (movieId) => {
    const response = await api.get(`/movies/${movieId}`);
    return response.data;
};

export const getMovieBookingStats = async (movieId, timeframe) => {
    const response = await api.get(`/movies/${movieId}/booking-stats`, {
        params: { timeframe } // Pass timeframe as a query parameter
    });
    return response.data; // Expects { ticketCount: number }
};

export const getPopularMovies = async () => {
    const response = await api.get('/movies/popular');
    return response.data;
};

export const getUpcomingMovies = async () => {
    const response = await api.get('/movies/upcoming');
    return response.data;
};

export const getNowInCinemasMovies = async () => {
    const response = await api.get('/movies/now-in-cinemas');
    return response.data;
};

export const getComingSoonMoviesPage = async () => {
    const response = await api.get('/movies/coming-soon-page');
    return response.data;
};

export const searchMovies = async (query) => {
    const response = await api.get('/movies/search', { params: { query } });
    return response.data;
};

// --- Reviews ---
export const addOrUpdateMyReview = async (movieId, { rating, comment }) => {
    const response = await api.post(`/movies/${movieId}/reviews`, { rating, comment });
    return response.data;
};

export const updateReviewById = async (movieId, reviewId, { rating, comment }) => {
    const response = await api.put(`/movies/${movieId}/reviews/${reviewId}`, { rating, comment });
    return response.data;
};

export const getReviewsByMovie = async (movieId, { page = 1, limit = 10 } = {}) => {
    const response = await api.get(`/movies/${movieId}/reviews`, { params: { page, limit } });
    return response.data; // { items, page, limit, total, hasMore }
};

export const getMyReview = async (movieId) => {
    const response = await api.get(`/movies/${movieId}/reviews/me`);
    return response.data; // { review }
};

export const deleteMyReview = async (movieId) => {
    const response = await api.delete(`/movies/${movieId}/reviews/me`);
    return response.data;
};

// --- Movie CRUD (Admin) ---
export const createMovie = async (movieData) => {
    const response = await api.post('/movies', movieData);
    return response.data;
};

export const updateMovie = async (movieId, movieData) => {
    const response = await api.put(`/movies/${movieId}`, movieData);
    return response.data;
};

export const deleteMovie = async (movieId) => {
    const response = await api.delete(`/movies/${movieId}`);
    return response.data;
};


// --- Theaters ---
export const getAllTheaters = async (queryParams = {}) => {
    const response = await api.get('/theaters', { params: queryParams });
    return response.data;
};

export const searchTheaters = async (query) => {
    const response = await api.get('/theaters/search', { params: { query } });
    return response.data;
};

export const getTheatersByCity = async (city) => {
    const response = await api.get('/theaters', { params: { city } });
    return response.data;
};

export const getTheaterById = async (theaterId) => {
    const response = await api.get(`/theaters/${theaterId}`);
    return response.data;
};

export const getTheaterDetails = async (theaterId) => {
    const response = await api.get(`/theaters/${theaterId}`);
    return response.data;
};

// --- Theater CRUD (Admin / Theatre Admin) ---
export const createTheater = async (theaterData) => {
    const response = await api.post('/theaters', theaterData);
    return response.data;
};

export const updateTheater = async (theaterId, theaterData) => {
    const response = await api.put(`/theaters/${theaterId}`, theaterData);
    return response.data;
};

export const deleteTheater = async (theaterId) => {
    const response = await api.delete(`/theaters/${theaterId}`);
    return response.data;
};


// --- Screens (Nested under Theaters) ---
export const getScreensByTheater = async (theaterId) => {
    const response = await api.get(`/theaters/${theaterId}/screens`);
    return response.data;
};

export const createScreen = async (theaterId, screenData) => {
    const response = await api.post(`/theaters/${theaterId}/screens`, screenData);
    return response.data;
};

export const deleteScreen = async (theaterId, screenId) => {
    const response = await api.delete(`/theaters/${theaterId}/screens/${screenId}`);
    return response.data;
};

// --- Seats ---
export const getSeatLayout = async (screenId, showtimeId) => {
    const apiUrl = `/seats/screens/${screenId}/showtimes/${showtimeId}`;
    try {
        const response = await api.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error('[API Error] getSeatLayout failed:', error);
        throw error;
    }
};

// --- Showtimes ---
export const getShowtimesByMovie = async (movieId, city, date, filters = {}) => {
    const response = await api.get(`/showtimes/movies/${movieId}`, {
        params: {
            city,
            date,
            language: filters.language,
            showTiming: filters.showTiming,
            priceRange: filters.priceRange,
            numberOfTickets: filters.numberOfTickets,
        },
    });
    return response.data;
};

export const getShowtimesByTheaterId = async (theaterId, queryParams = {}) => {
    const response = await api.get(`/showtimes/theaters/${theaterId}`, { params: queryParams });
    return Array.isArray(response.data) ? response.data : [];
};

export const getShowtimeDetailsById = async (showtimeId) => {
    const response = await api.get(`/showtimes/${showtimeId}/details`);
    return response.data;
};

// --- Showtime CRUD (Admin/Theatre Admin) ---
export const createShowtime = async (screenId, showtimeData) => {
    const apiUrl = `/showtimes/screens/${screenId}`;
    const response = await api.post(apiUrl, showtimeData);
    return response.data;
};

export const updateShowtime = async (showtimeId, showtimeData) => {
    const response = await api.put(`/showtimes/${showtimeId}`, showtimeData);
    return response.data;
};

export const cancelShowtime = async (showtimeId) => {
    const response = await api.delete(`/showtimes/${showtimeId}`);
    return response.data;
};

export const addMultipleShowtimes = async (bulkShowtimeData) => {
    const response = await api.post('/showtimes/multiple', bulkShowtimeData);
    return response.data;
};


// --- Bookings ---
export const createBooking = async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
};

export const getMyBookings = async () => {
    const response = await api.get('/bookings/me');
    return response.data;
};

export const cancelBooking = async (bookingId) => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
};

// --- Offers ---
export const listOffers = async (params = {}) => {
    const response = await api.get('/offers', { params });
    return response.data;
};

export const createOfferApi = async (offer) => {
    const response = await api.post('/offers', offer);
    return response.data;
};

export const updateOfferApi = async (id, offer) => {
    const response = await api.put(`/offers/${id}`, offer);
    return response.data;
};

export const deleteOfferApi = async (id) => {
    const response = await api.delete(`/offers/${id}`);
    return response.data;
};

export const evaluateOfferApi = async ({ numTickets, subtotal, promoCode }) => {
    const response = await api.post('/offers/evaluate', { numTickets, subtotal, promoCode });
    return response.data;
};

// --- Cities ---
export const getCities = async () => {
    const response = await api.get('/cities');
    return response.data;
};

// --- Profile Picture Upload ---
export const uploadProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);

    const response = await api.post('/users/upload-profile-picture', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// --- User Likes & Notifications ---
export const likeTheater = async (theaterId) => {
    const response = await api.post(`/users/liked-theaters/${theaterId}`);
    return response.data; // { likedTheaters, movieNotifications }
};

export const unlikeTheater = async (theaterId) => {
    const response = await api.delete(`/users/liked-theaters/${theaterId}`);
    return response.data;
};

export const enableMovieNotification = async (movieId) => {
    const response = await api.post(`/users/movie-notifications/${movieId}`);
    return response.data;
};

export const disableMovieNotification = async (movieId) => {
    const response = await api.delete(`/users/movie-notifications/${movieId}`);
    return response.data;
};

export default api;