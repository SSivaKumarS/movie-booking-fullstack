// frontend/src/pages/Movies.jsx
import React, { useState, useEffect } from 'react'; // Added React import
// import { Link } from 'react-router-dom'; // Link seems unused based on commented sections
import api from '../api/api'; // Assuming API functions exported, or use instance directly
// Import specific API functions if preferred:
// import { getNowInCinemasMovies, getComingSoonMoviesPage } from '../api/api';
import { useCity } from '../context/CityContext'; // Add this import
import MovieCard from '../components/MovieCard';
import './Movies.css'; // Ensure this CSS file exists

const Movies = () => {
  // State for movie lists
  const [nowInCinemasMovies, setNowInCinemasMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);

  // State for loading and errors
  const [loadingNowInCinemas, setLoadingNowInCinemas] = useState(true);
  const [loadingComingSoon, setLoadingComingSoon] = useState(true);
  const [error, setError] = useState('');
  const { selectedCity } = useCity(); // Add this line

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component

    const fetchAllMoviesData = async () => {
        if (!selectedCity) {
            setNowInCinemasMovies([]);
            setComingSoonMovies([]);
            setLoadingNowInCinemas(false);
            setLoadingComingSoon(false);
            return;
        }

        setLoadingNowInCinemas(true);
        setLoadingComingSoon(true);
        setError(''); // Clear previous errors

        try {
            // Fetch both lists concurrently
            const [nowInCinemasResponse, comingSoonResponse] = await Promise.all([
                api.get('/movies/now-in-cinemas', { params: { city: selectedCity } }), // Pass city as query param
                api.get('/movies/coming-soon-page')
                // Alternatively:
                // getNowInCinemasMovies(),
                // getComingSoonMoviesPage()
            ]);

            if (isMounted) {
                 // Ensure data is an array, reverse coming soon if needed
                 setNowInCinemasMovies(nowInCinemasResponse.data || []);
                 // Reverse the coming soon movies list as in original code
                 setComingSoonMovies(comingSoonResponse.data ? [...comingSoonResponse.data].reverse() : []);
            }
        } catch (err) {
            console.error('Error fetching movies page data:', err);
             if (isMounted) {
                 setError('Could not load movie lists. Please try refreshing the page.');
                 setNowInCinemasMovies([]); // Reset on error
                 setComingSoonMovies([]); // Reset on error
            }
        } finally {
             if (isMounted) {
                 setLoadingNowInCinemas(false);
                 setLoadingComingSoon(false);
            }
        }
    };

    fetchAllMoviesData();

    // Cleanup function
    return () => {
        isMounted = false;
    };
}, [selectedCity]); // Add selectedCity to dependency array


 // Helper function to render movie grids (similar to Home.jsx)
 const renderMovieGrid = (movies, isLoading, sectionTitle) => {
    if (isLoading) {
        return <p>Loading {sectionTitle} movies...</p>; // Or a spinner
    }
    if (!movies || movies.length === 0) {
        return <p>No {sectionTitle.toLowerCase()} movies found.</p>;
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
    <div className="movies-page">
      <div className="container">
         {/* Display general error if fetching failed */}
         {error && <p className="error-message">{error}</p>}

        {/* Now Showing Section */}
        <section className="movie-section">
          <div className="section-header">
            <h2>Now in Cinemas</h2>
            {/* View All Link (Optional) - Link to where? Maybe filter param? */}
            {/* <Link to="/movies?filter=now_showing" className="section-link"> ... </Link> */}
          </div>
           {/* Use render helper */}
           {renderMovieGrid(nowInCinemasMovies, loadingNowInCinemas, "Now in Cinemas")}
        </section>

        {/* Coming Soon Section */}
        <section className="movie-section">
          <div className="section-header">
            <h2>Coming Soon</h2>
             {/* View All Link (Optional) */}
             {/* <Link to="/movies?filter=coming_soon" className="section-link"> ... </Link> */}
          </div>
           {/* Use render helper */}
           {renderMovieGrid(comingSoonMovies, loadingComingSoon, "Coming Soon")}
        </section>
      </div>
    </div>
  );
};

export default Movies;