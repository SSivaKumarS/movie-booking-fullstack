import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api";
import TrailerModal from "../components/TrailerModal";

function MovieDetails() {
  const { movieId } = useParams();

  const [shows, setShows] = useState([]);
  const [movie, setMovie] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");

  const token = localStorage.getItem("token");

  const fetchReviews = () => {
    API.get(`/api/reviews/movie/${movieId}`)
      .then((res) => {
        setReviews(res.data.reviews || []);
        setAvgRating(res.data.avgRating || 0);
        setTotalRatings(res.data.totalRatings || 0);
      })
      .catch((err) => {
        console.log("Reviews fetch error:", err);
        setReviews([]);
        setAvgRating(0);
        setTotalRatings(0);
      });
  };

  useEffect(() => {
    //  Get movie info
    API.get(`/api/movies/${movieId}`)
      .then((res) => setMovie(res.data))
      .catch((err) => console.log("Movie fetch error:", err));

    //  Get shows
    API.get(`/api/shows/movie/${movieId}`)
      .then((res) => setShows(res.data))
      .catch((err) => console.log("Shows fetch error:", err));

    //  Get reviews
    fetchReviews();

    //  Check watchlist status if logged in
    if (token) {
      API.get(`/api/users/watchlist`)
        .then((res) => {
          const found = (res.data || []).some((m) => m._id === movieId || m === movieId);
          setIsBookmarked(found);
        })
        .catch(() => {});
    }
  }, [movieId, token]);

  const handleToggleWatchlist = async () => {
    if (!token) {
      alert("Please log in to add movies to your watchlist!");
      return;
    }
    try {
      const res = await API.post(`/api/users/watchlist/toggle`, { movieId });
      setIsBookmarked(res.data.isBookmarked);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update watchlist");
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please log in to submit a review!");
      return;
    }
    if (!userComment.trim()) return;

    try {
      await API.post(`/api/reviews`, {
        movieId,
        rating: userRating,
        comment: userComment,
      });
      setReviewMsg("Review submitted successfully! 🎉");
      setUserComment("");
      fetchReviews();
      setTimeout(() => setReviewMsg(""), 3000);
    } catch (err) {
      setReviewMsg(err.response?.data?.message || "Route updating... Please retry in a moment.");
    }
  };

  if (!movie) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-6 md:p-12">
      {/* 🎬 Hero Banner Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 bg-gray-900/60 p-8 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-xl mb-12">
        
        {/* Poster */}
        <div className="flex flex-col items-center">
          <img
            src={movie.poster}
            alt={movie.title}
            className="rounded-2xl shadow-2xl object-cover h-[450px] w-full border border-gray-800"
          />
          
          <div className="flex gap-3 mt-6 w-full">
            <button
              onClick={() => setIsTrailerOpen(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/30"
            >
              <span>▶</span> Watch Trailer
            </button>
            
            <button
              onClick={handleToggleWatchlist}
              className={`p-3 rounded-xl border transition flex items-center justify-center ${
                isBookmarked
                  ? "bg-red-950/80 border-red-500 text-red-500"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
              }`}
              title={isBookmarked ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {isBookmarked ? "❤️" : "🤍"}
            </button>
          </div>
        </div>

        {/* Movie Info & Shows */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <h1 className="text-4xl font-extrabold text-white tracking-wide">
                {movie.title}
              </h1>
              <span className="bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                {movie.genre}
              </span>
            </div>

            {/* Ratings & Meta */}
            <div className="flex items-center gap-6 mb-6 text-sm text-gray-400">
              <div className="flex items-center gap-1 text-yellow-400 font-bold text-base">
                ★ {avgRating > 0 ? avgRating : "N/A"}
                <span className="text-gray-400 font-normal text-xs">
                  ({totalRatings} {totalRatings === 1 ? "review" : "reviews"})
                </span>
              </div>
              <div>⏱ {movie.duration} mins</div>
            </div>

            <p className="text-gray-300 leading-relaxed text-base mb-8">
              {movie.description}
            </p>
          </div>

          {/*  Shows Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <span></span> Available Showtimes
            </h2>

            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {shows.length === 0 ? (
                <p className="text-gray-500 py-6 text-center border border-dashed border-gray-800 rounded-xl">
                  No upcoming shows scheduled for this movie.
                </p>
              ) : (
                shows.map((show) => (
                  <div
                    key={show._id}
                    className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between gap-4 hover:border-gray-700 transition"
                  >
                    <div>
                      <h4 className="font-bold text-lg text-white">
                        {show.theatre}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                         <span className="text-gray-300">{show.date}</span> &nbsp;|&nbsp; 
                         <span className="text-gray-300">{show.time}</span>
                      </p>
                    </div>

                    <Link to={`/seats/${show._id}`}>
                      <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md">
                        Select Seats
                      </button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/*  Reviews & Ratings Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Submit Review */}
        <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span></span> Rate & Review
          </h3>

          {reviewMsg && (
            <div className="p-3 mb-4 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
              {reviewMsg}
            </div>
          )}

          <form onSubmit={handleAddReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Your Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className={`text-2xl transition ${
                      star <= userRating ? "text-yellow-400 scale-110" : "text-gray-600"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Review Comment
              </label>
              <textarea
                rows="4"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="What did you think of the movie?"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 font-semibold text-white py-2.5 rounded-xl transition text-sm shadow-md"
            >
              Post Review
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="md:col-span-2 bg-gray-900/60 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span></span> Audience Reviews ({totalRatings})
          </h3>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No audience reviews yet. Be the first to leave a review!
              </p>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {rev.userName}
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span></span> Verified Buyer
                      </span>
                    </div>
                    <span className="text-yellow-400 font-bold text-sm">
                      {"★".repeat(rev.rating)}
                      <span className="text-gray-600">
                        {"★".repeat(5 - rev.rating)}
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {rev.comment}
                  </p>
                  <p className="text-[10px] text-gray-500 text-right">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailerUrl}
        movieTitle={movie.title}
      />
    </div>
  );
}

export default MovieDetails;
