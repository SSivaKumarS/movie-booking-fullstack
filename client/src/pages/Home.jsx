// frontend/src/pages/Home.jsx
import React, { useState, useEffect, useContext } from 'react'; // Added React import
import { Link } from 'react-router-dom';
import api from '../api/api'; // Assuming API functions are exported from api.js now
// Import specific API functions if preferred:
// import { getPopularMovies, getUpcomingMovies } from '../api/api';
import UserContext from '../context/UserContext';
import { useCity } from '../context/CityContext'; // Add this import
import MovieCard from '../components/MovieCard';
import GradientText from '../components/GradientText';
import './Home.css';

const Home = () => {
    const [popularMovies, setPopularMovies] = useState([]);
    const [upcomingMovies, setUpcomingMovies] = useState([]);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [loadingUpcoming, setLoadingUpcoming] = useState(true);
    const [error, setError] = useState(''); // General error state for the page
    const { user, isAuthenticated } = useContext(UserContext);
    const { selectedCity } = useCity(); // Add this line

    useEffect(() => {
        let isMounted = true; // Prevent state update on unmounted component

        const fetchMovies = async () => {
            if (!selectedCity) {
                setPopularMovies([]);
                setUpcomingMovies([]);
                setLoadingPopular(false);
                setLoadingUpcoming(false);
                return;
            }

            setLoadingPopular(true);
            setLoadingUpcoming(true);
            setError(''); // Clear previous errors
            try {
                // Fetch popular and upcoming movies concurrently
                const [popularResponse, upcomingResponse] = await Promise.all([
                    api.get('/movies/popular', { params: { city: selectedCity } }), // Pass city as query param
                    api.get('/movies/upcoming') // Use instance or imported function
                    // Alternatively:
                    // getPopularMovies(),
                    // getUpcomingMovies()
                ]);

                if (isMounted) {
                    setPopularMovies(popularResponse.data || []); // Ensure array
                    setUpcomingMovies(upcomingResponse.data || []); // Ensure array
                }
            } catch (err) {
                console.error("Error fetching homepage movies:", err);
                if (isMounted) {
                     setError('Could not load movie lists. Please try again later.');
                     setPopularMovies([]); // Set empty on error
                     setUpcomingMovies([]); // Set empty on error
                }
            } finally {
                if (isMounted) {
                     setLoadingPopular(false);
                     setLoadingUpcoming(false);
                }
            }
        };

        fetchMovies();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [selectedCity]); // Add selectedCity to dependency array


    // Helper to render movie grids (avoids repetition)
    const renderMovieGrid = (movies, isLoading) => {
        if (isLoading) {
            return <p>Loading movies...</p>; // Or a spinner component
        }
        if (!movies || movies.length === 0) {
            return <p>No movies to display currently.</p>;
        }
        return (
            <div className="movie-grid">
                {movies.map((movie) => (
                    // --- FIX HERE: Use movie._id for the key ---
                    <MovieCard key={movie._id} movie={movie} />
                    // --- END FIX ---
                ))}
            </div>
        );
    };


    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                 {/* ... hero content ... */}
                 <div className="hero-content">
                    <h1>
                        <GradientText
                          colors={["#58a002", "#75d402", "#b4ec51", "#75d402", "#58a002"]}
                          animationSpeed={3}
                        >
                          Experience Cinema Magic
                        </GradientText>
                    </h1>
                    <p>Book tickets for the latest blockbusters in seconds</p>
                    <Link to="/movies" className="cta-button">
                        Explore Movies
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M11.293 4.707 17.586 11H4v2h13.586l-6.293 6.293 1.414 1.414L21.414 12l-8.707-8.707-1.414 1.414z"/>
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Main Content Container */}
            <div className="container">
                {/* Display general error if fetching failed */}
                 {error && <p className="error-message">{error}</p>}

                {/* Now Showing Section */}
                <section className="movie-section">
                    <div className="section-header">
                        <h2>Now Showing</h2>
                        <Link to="/movies" className="section-link"> {/* Consider linking to /movies?filter=now_showing */}
                            View All
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M13.172 12 8.222 7.05 9.636 5.636 16 12l-6.364 6.364-1.414-1.414z"/></svg>
                        </Link>
                    </div>
                     {/* Use render helper */}
                     {renderMovieGrid(popularMovies, loadingPopular)}
                </section>

                {/* Coming Soon Section */}
                <section className="movie-section">
                    <div className="section-header">
                        <h2>Coming Soon</h2>
                        <Link to="/movies" className="section-link"> {/* Consider linking to /movies?filter=coming_soon */}
                            View All
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M13.172 12 8.222 7.05 9.636 5.636 16 12l-6.364 6.364-1.414-1.414z"/></svg>
                        </Link>
                    </div>
                     {/* Use render helper */}
                    {renderMovieGrid(upcomingMovies, loadingUpcoming)}
                </section>
            </div>
        </div>
    );
};

export default Home;