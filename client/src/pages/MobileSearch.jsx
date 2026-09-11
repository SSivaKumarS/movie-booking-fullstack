import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCity } from '../context/CityContext';
import { searchMovies, searchTheaters } from '../api/api';
import './MobileSearch.css';

const MobileSearch = () => {
    const { availableCities, setSelectedCity } = useCity();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();

    // Debounced Search Effect
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const debounceTimer = setTimeout(async () => {
            try {
                const [movieResults, theaterResults] = await Promise.all([
                    searchMovies(searchQuery.trim()),
                    searchTheaters(searchQuery.trim())
                ]);

                const cityResults = availableCities
                    .filter(city => city.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                    .map(city => ({
                        _id: city,
                        type: 'city',
                        displayTitle: city
                    }));

                const combinedResults = [
                    ...(movieResults || []).map(movie => ({
                        ...movie,
                        type: 'movie',
                        displayTitle: movie.title
                    })),
                    ...(theaterResults || []).map(theater => ({
                        ...theater,
                        type: 'theater',
                        displayTitle: theater.name
                    })),
                    ...cityResults
                ];

                setSearchResults(combinedResults || []);
            } catch (error) {
                console.error('Error searching:', error);
                setSearchResults([{ _id: 'error', displayTitle: 'Error fetching results' }]);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, availableCities]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchResultClick = (result) => {
        if (result.type === 'city') {
            setSelectedCity(result._id);
        }
    };

    useEffect(() => {
        if (window.innerWidth > 768) {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="mobile-search-page">
            <div className="mobile-search-header">
                <input
                    type="text"
                    placeholder="Search movies, theaters, cities..."
                    className="mobile-search-input"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                />
            </div>

            {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="mobile-search-empty">No results found</div>
            )}

            <div className="mobile-search-results">
                <ul className="results-list">
                    {searchResults.map((result) => {
                        if (result._id === 'error') {
                            return <li key="search-error" className="result-item result-error">{result.displayTitle}</li>;
                        }

                        if (result.type === 'city') {
                            return (
                                <li key={result._id} className="result-item">
                                    <div
                                        className="result-link"
                                        onClick={() => handleSearchResultClick(result)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <span className="result-icon">
                                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
                                        </span>
                                        <div className="result-text">
                                            <span className="result-title">{result.displayTitle}</span>
                                            <span className="result-subtitle">City</span>
                                        </div>
                                    </div>
                                </li>
                            );
                        }

                        const link = result.type === 'movie'
                            ? `/movies/${result._id}`
                            : `/theaters/${result._id}`;

                        return (
                            <li key={result._id} className="result-item">
                                <Link
                                    to={link}
                                    className="result-link"
                                    onClick={() => handleSearchResultClick(result)}
                                >
                                    <span className="result-icon">
                                        {result.type === 'movie' ? (
                                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" fill="currentColor"/></svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h12v2H6z" fill="currentColor"/></svg>
                                        )}
                                    </span>
                                    <div className="result-text">
                                        <span className="result-title">{result.displayTitle}</span>
                                        {result.type === 'theater' && result.location && result.city && (
                                            <span className="result-subtitle">{result.location}, {result.city}</span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default MobileSearch;
