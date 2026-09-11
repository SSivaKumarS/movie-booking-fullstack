// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCity } from '../context/CityContext';
import UserContext from '../context/UserContext';
import { searchMovies, searchTheaters } from '../api/api';
import './Navbar.css';
import logoIcon from '../../icon.png';
const Navbar = () => {
    // --- State ---
    const {
        selectedCity,
        setSelectedCity,
        availableCities,
        loadingCities,
        cityError
    } = useCity();
    const { isAuthenticated, logout, user } = useContext(UserContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    // --- New State for Mobile Search Toggle ---
    const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

    // --- Refs ---
    const searchContainerRef = useRef(null);
    // --- Ref for the search input itself ---
    const searchInputRef = useRef(null);


    // --- Other Hooks ---
    const navigate = useNavigate();
    const isAdminOrTheaterAdmin = user && (user.role === 'admin' || user.role === 'theater_admin');

    // --- Effects ---
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

    // Click Outside Effect - Updated
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close search results OR the entire mobile search input
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsSearchFocused(false); // Close results dropdown
                // If mobile search is active, close it too
                if (isMobileSearchActive) {
                    // Check if the click was on the icon button itself
                    const iconButton = document.querySelector('.search-icon-button');
                    if (!iconButton || !iconButton.contains(event.target)) {
                         setIsMobileSearchActive(false);
                    }
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMobileSearchActive]); // Add isMobileSearchActive dependency

    // Focus input when mobile search becomes active
    useEffect(() => {
        if (isMobileSearchActive && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isMobileSearchActive]);


    // --- Handlers ---
    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
    };

    const handleSearchResultClick = (result) => {
        if (result.type === 'city') {
            setSelectedCity(result._id);
        }
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchFocused(false);
        setIsMobileSearchActive(false); // Close mobile search on result click
    };

    // --- Handler for mobile search icon click ---
    const handleMobileSearchToggle = () => {
        setIsMobileSearchActive(!isMobileSearchActive);
        // Clear search query when closing? Optional.
        // if (isMobileSearchActive) setSearchQuery('');
    };

    // --- Search Results Renderer ---
    const renderSearchResults = () => {
         // Don't render if mobile search isn't active OR if desktop search isn't focused
        if (!isSearchFocused) return null;

        return searchResults.map((result) => {
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
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSearchResultClick(result)}
                        >
                            <span className="result-icon">
                                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
                            </span>
                            <span className="result-title">{result.displayTitle}</span>
                            <span className="result-subtitle">City</span>
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
                                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" fill="currentColor"/></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h12v2H6z" fill="currentColor"/></svg>
                            )}
                        </span>
                        <span className="result-title">{result.displayTitle}</span>
                        {result.type === 'theater' && result.location && result.city && (
                            <span className="result-subtitle">{result.location}, {result.city}</span>
                        )}
                    </Link>
                </li>
            );
        });
    };


    // --- JSX ---
    return (
        // Add class to navbar when mobile search is active to potentially hide other elements
        <nav className={`navbar ${isMobileSearchActive ? 'mobile-search-active' : ''}`}>
            <Link to="/" className="navbar-brand">
                <img src={logoIcon} alt="CinePlus+ Logo" style={{ height: '160px', marginTop: '-80px', marginBottom: '-70px', marginLeft: '-10px' }} />
            </Link>

            {/* Container for controls, search icon moved here */}
            <div className="nav-controls">

                 {/* Mobile Search Icon Button */}
                 <button
                    className="search-icon-button"
                    onClick={handleMobileSearchToggle}
                    aria-label="Open search"
                 >
                     <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                         <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                     </svg>
                 </button>

                {/* Search Bar and Results Container */}
                {/* Add 'mobile-active' class when mobile search is toggled */}
                <div
                    className={`search-container ${isMobileSearchActive ? 'mobile-active' : ''}`}
                    ref={searchContainerRef}
                >
                    <input
                        ref={searchInputRef} // Assign ref
                        type="text"
                        placeholder="Search movies, theaters, cities..."
                        className="search-input"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={handleSearchFocus} // Still needed for showing results
                    />
                     {/* Mobile Close Button */}
                    <button
                        className="search-close-button"
                        onClick={() => setIsMobileSearchActive(false)}
                        aria-label="Close search"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                           <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>

                    {/* Results dropdown - logic adjusted in renderSearchResults */}
                    {(isSearchFocused || isMobileSearchActive) && searchResults.length > 0 && (
                        <div className="search-results">
                            <ul className="results-list">
                                {renderSearchResults()}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Navigation Tools */}
                <div className="nav-tools">
                    {/* City Selector */}
                    <div className="city-selector">
                        {/* ... select element ... */}
                         <select
                            value={selectedCity}
                            onChange={handleCityChange}
                            disabled={loadingCities}
                            aria-label="Select City"
                        >
                            <option value="">
                                {loadingCities ? "Loading..." :
                                cityError ? "Error" :
                                availableCities.length === 0 ? "No cities" :
                                "Select City"}
                            </option>
                            {availableCities.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    {/* Movies Link */}
                    <Link to="/movies" className="nav-link">
                        Movies
                    </Link>

                    {/* QR Scanner Link - Desktop ONLY */}
                    {user?.role === 'theater_admin' && (
                        <Link to="/admin/scanner" className="nav-link scanner-link scanner-link-desktop">
                            <svg viewBox="0 0 24 24" width="20" height="20" className="scanner-icon">
                                <path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
                            </svg>
                            <span className="scanner-link-text">Scanner</span>
                        </Link>
                    )}

                    {/* Conditional Auth Section */}
                    {isAuthenticated ? (
                        <div className="profile-dropdown">
                             <Link to="/profile" className="profile-button">
                                {/* ... profile icon/picture ... */}
                                {user?.profile_picture ? (
                                    <img
                                        src={user.profile_picture}
                                        alt="Profile"
                                        className="profile-picture-nav"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/default_profile.png'; }}
                                    />
                                ) : (
                                    <svg viewBox="0 0 24 24" className="profile-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                                )}
                                <span className="profile-text">{user?.userName || user?.name || 'Profile'}</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className="auth-link">Login</Link>
                            <Link to="/signup" className="auth-link signup-link">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;