// frontend/src/components/MovieCard.jsx
import { Link } from 'react-router-dom';
import './MovieCard.css'; // Import MovieCard.css

const MovieCard = ({ movie }) => {
  // Check if movie and movie._id exist before creating the link
  if (!movie || !movie._id) {
    console.error("Invalid movie data passed to MovieCard:", movie);
    return null; // Don't render card if data is invalid
  }

  return (
    // Use movie._id directly (it's a string) - Remove Number() conversion
    <Link to={`/movies/${movie._id}`} className="movie-card-link"> {/* Use _id */}
      <div className="movie-card">
        {/* Add a check for poster_url */}
        <img
          src={movie.poster_url || '/default_poster.jpg'} // Provide fallback image
          alt={movie.title || 'Movie Poster'}
          onError={(e) => { e.target.onerror = null; e.target.src = '/default_poster.jpg' }} // Handle image loading errors
        />
        <div className="movie-info">
          <h3 className="movie-title">{movie.title || 'Untitled Movie'}</h3>
          {/* Check if genre exists */}
          {movie.genre && <p className="movie-genre">{movie.genre}</p>}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;