// frontend/src/pages/Showtimes.jsx
import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import moment from 'moment-timezone';
import { getShowtimesByMovie, getMovieById, likeTheater, unlikeTheater } from "../api/api"; // Ensure path is correct
import { UserContext } from "../context/UserContext";
import { useCity } from "../context/CityContext";
import "./Showtimes.css";

const TARGET_TIMEZONE = 'Asia/Kolkata';
const MOBILE_BREAKPOINT = 768; // Define consistent breakpoint (adjust if needed)

const Showtimes = () => {
    const { id: movieId } = useParams();
    const { selectedCity } = useCity();
    const [rawShowtimes, setRawShowtimes] = useState([]);
    const [groupedShowtimes, setGroupedShowtimes] = useState({});
    const [selectedDate, setSelectedDate] = useState(moment().tz(TARGET_TIMEZONE).format('YYYY-MM-DD'));
    const [movieDetails, setMovieDetails] = useState(null);
    const [loadingMovieDetails, setLoadingMovieDetails] = useState(true);
    const [loadingShowtimes, setLoadingShowtimes] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({});
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [filterState, setFilterState] = useState({
        language: '',
        priceRange: '',
        showTiming: '',
        numberOfTickets: ''
    });
    const [datesWithShows, setDatesWithShows] = useState({});
    const [loadingDateAvailability, setLoadingDateAvailability] = useState(false);
    const [firstDateWithShows, setFirstDateWithShows] = useState(null);
    const { isAuthenticated, user, setUser } = useContext(UserContext);

    // State for collapsible filters - starts visible for desktop logic
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    const filterSectionRef = useRef(null); // Ref for potential height calculations

    // Effect to set initial filter visibility based on screen width
    // This ensures it's collapsed on initial mobile load
    useEffect(() => {
        const checkScreenWidth = () => {
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                setIsFilterVisible(false); // Collapse initially on mobile
            } else {
                setIsFilterVisible(true); // Ensure visible on desktop
            }
        };
        checkScreenWidth(); // Check on initial mount
        // Optional: Add resize listener if needed, but initial check is often enough
        // window.addEventListener('resize', checkScreenWidth);
        // return () => window.removeEventListener('resize', checkScreenWidth);
    }, []); // Run only once on mount


    // --- Fetch Movie Details ---
    useEffect(() => {
        let isMounted = true;
        const fetchMovieDetails = async () => {
            if (!movieId) { if (isMounted) setLoadingMovieDetails(false); return; }
            setLoadingMovieDetails(true);
            try {
                const response = await getMovieById(movieId);
                if (isMounted) {
                    setMovieDetails(response.movie);
                    let initialDate = moment().tz(TARGET_TIMEZONE).format('YYYY-MM-DD');
                    if (response.movie?.release_date) {
                        const releaseDate = moment(response.movie.release_date).tz(TARGET_TIMEZONE).startOf('day');
                        const today = moment().tz(TARGET_TIMEZONE).startOf('day');
                        if (releaseDate.isAfter(today)) initialDate = releaseDate.format('YYYY-MM-DD');
                    }
                    setSelectedDate(initialDate);
                }
            } catch (error) { console.error("Error fetching movie details:", error); if (isMounted) setMovieDetails(null); }
            finally { if (isMounted) setLoadingMovieDetails(false); }
        };
        fetchMovieDetails();
        return () => { isMounted = false; };
    }, [movieId]);

     // --- Fetch Showtimes for Selected Date ---
     useEffect(() => {
        let isMounted = true;
        const fetchShowtimesAndLanguages = async () => {
            if (!selectedCity || !movieId || !selectedDate || loadingMovieDetails) return;
            setLoadingShowtimes(true);
            try {
                const response = await getShowtimesByMovie(movieId, selectedCity, selectedDate, appliedFilters);
                if (isMounted) {
                    const fetchedShowtimes = response?.showtimes || [];
                    setRawShowtimes(fetchedShowtimes);
                    const languagesOnDate = [...new Set(fetchedShowtimes.map(s => s.language).filter(Boolean))];
                    setAvailableLanguages(languagesOnDate);
                    groupShowtimesByTheater(fetchedShowtimes); // Group immediately
                    setDatesWithShows(prev => ({ ...prev, [selectedDate]: fetchedShowtimes.length > 0 }));
                }
            } catch (error) {
                console.error("Error fetching showtimes:", error);
                if (isMounted) {
                    setRawShowtimes([]); setGroupedShowtimes({}); setAvailableLanguages([]);
                    setDatesWithShows(prev => ({ ...prev, [selectedDate]: false }));
                }
            } finally { if (isMounted) setLoadingShowtimes(false); }
        };
        fetchShowtimesAndLanguages();
        return () => { isMounted = false; };
    }, [movieId, selectedCity, selectedDate, appliedFilters, loadingMovieDetails, movieDetails]); // Added dependencies

    // --- Fetch Date Availability Range ---
    useEffect(() => {
        let isMounted = true;
        const fetchDateAvailability = async () => {
            if (!selectedCity || !movieId || !movieDetails) return;
            setLoadingDateAvailability(true);
            let determinedFirstDate = null;
            try {
                const today = moment().tz(TARGET_TIMEZONE).startOf('day');
                let startDate = today;
                if (movieDetails.release_date) {
                    const releaseMoment = moment(movieDetails.release_date).tz(TARGET_TIMEZONE).startOf('day');
                    if (releaseMoment.isAfter(today)) startDate = releaseMoment;
                }
                const dateRange = Array.from({ length: 10 }, (_, i) => startDate.clone().add(i, 'day').format('YYYY-MM-DD'));
                const availabilityResults = {};
                const promises = dateRange.map(async (date) => {
                    try {
                        const res = await getShowtimesByMovie(movieId, selectedCity, date, {});
                        const hasShows = (res?.showtimes || []).length > 0;
                        availabilityResults[date] = hasShows;
                        if (hasShows && !determinedFirstDate) determinedFirstDate = date;
                    } catch (err) { availabilityResults[date] = false; }
                });
                await Promise.all(promises);
                if (isMounted) {
                    setDatesWithShows(availabilityResults);
                    setFirstDateWithShows(determinedFirstDate);
                    // Auto-select first available date if current selection has no shows
                    if (determinedFirstDate && availabilityResults[selectedDate] === false) {
                       setSelectedDate(determinedFirstDate);
                    }
                }
            } catch (error) { console.error("Error fetching date availability range:", error); }
             finally { if (isMounted) setLoadingDateAvailability(false); }
        };
        fetchDateAvailability();
        return () => { isMounted = false; };
    }, [movieId, selectedCity, movieDetails]);


    // --- Group Showtimes ---
    const groupShowtimesByTheater = useCallback((shows) => {
        const groups = shows.reduce((acc, showtime) => {
            if (!showtime?._id || !showtime.start_time) return acc;
            const theaterName = showtime.theater_name || showtime.theater_id?.name || 'Unknown Theater';
            const theaterId = showtime.theater_id?._id || showtime.theater_id || null;
            if (!acc[theaterName]) acc[theaterName] = { showtimes: [], theaterId: theaterId };
            if (moment(showtime.start_time).tz(TARGET_TIMEZONE).isAfter(moment().tz(TARGET_TIMEZONE))) {
                 acc[theaterName].showtimes.push(showtime);
            }
            return acc;
        }, {});
        const filteredGroups = Object.entries(groups).reduce((acc, [name, data]) => {
            if (data.showtimes.length > 0) {
                data.showtimes.sort((a, b) => moment(a.start_time).valueOf() - moment(b.start_time).valueOf());
                acc[name] = data;
            }
            return acc;
        }, {});
        setGroupedShowtimes(filteredGroups);
    }, []);


    // --- Handlers ---
    const handleDateChange = (date) => {
        if (loadingDateAvailability || datesWithShows[date] !== false) setSelectedDate(date);
    };
    const handleFilterChange = (e) => setFilterState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const applyFilters = () => {
        const numTickets = filterState.numberOfTickets ? parseInt(filterState.numberOfTickets, 10) : '';
        setAppliedFilters({
            language: filterState.language || undefined, priceRange: filterState.priceRange || undefined,
            showTiming: filterState.showTiming || undefined,
            numberOfTickets: isNaN(numTickets) || numTickets <= 0 ? undefined : numTickets
        });
        if (window.innerWidth <= MOBILE_BREAKPOINT) setIsFilterVisible(false);
    };
    const handleClearFilters = () => {
        setFilterState({ language: '', priceRange: '', showTiming: '', numberOfTickets: '' });
        setAppliedFilters({});
         if (window.innerWidth <= MOBILE_BREAKPOINT) setIsFilterVisible(false);
    };
    const toggleFilterVisibility = () => setIsFilterVisible(prev => !prev);

    // --- Utility Functions ---
    const generateDateRange = useCallback((startDate, days) => {
        const range = []; let startMoment = moment().tz(TARGET_TIMEZONE).startOf('day');
        if (movieDetails?.release_date) { const releaseMoment = moment(movieDetails.release_date).tz(TARGET_TIMEZONE).startOf('day'); if (releaseMoment.isAfter(startMoment)) startMoment = releaseMoment; }
        const currentDate = startMoment.clone();
        for (let i = 0; i < days; i++) { range.push(currentDate.format('YYYY-MM-DD')); currentDate.add(1, 'day'); }
        return range;
    }, [movieDetails]);
    const formatDateForCard = (dateString) => { const d = moment.tz(dateString, 'YYYY-MM-DD', TARGET_TIMEZONE); return { dayName: d.format('ddd').toUpperCase(), dayOfMonth: d.format('D'), monthName: d.format('MMM').toUpperCase() }; };
    const formatTimeIST = (utc) => moment(utc).tz(TARGET_TIMEZONE).format('h:mm A');
    const getAvailabilityStatus = (st) => { const t = st.total_seats||0, b = Number(st.booked_seats_count)||0; if(t<=0) return {status:'unknown'}; const a=t-b; if(a<=0) return {status:'soldout'}; const p=(a/t)*100; if(p<=10) return {status:'few'}; if(p<=50) return {status:'limited'}; return {status:'plenty'}; };
    const getStatusText = (s) => ({ few: 'Few Left', limited: 'Limited', soldout: 'Sold Out', plenty: '' }[s] || '');


    // --- Render Logic ---
    if (loadingMovieDetails) return <div className="loading">Loading Movie Details...</div>;
    if (!movieDetails) return <div className="error">Movie details could not be loaded.</div>;

    const dateRange = generateDateRange(new Date(), 10);

    return (
        <div className="showtimes-container">
            {/* Movie Header */}
            <div className="movie-header">
                 <h1>{movieDetails.title}</h1>
                {movieDetails.genre && <p className="genre-tag">{movieDetails.genre}</p>}
                {movieDetails.release_date && moment(movieDetails.release_date).tz(TARGET_TIMEZONE).isAfter(moment().tz(TARGET_TIMEZONE).startOf('day')) && ( <p className="release-info">Releasing on {moment(movieDetails.release_date).tz(TARGET_TIMEZONE).format('DD MMM YYYY')}</p> )}
            </div>

            <div className="controls-section">
                {/* Date Selector */}
                {loadingDateAvailability && <div className="loading-dates">Checking date availability...</div>}
                <div className="date-selector">
                     {dateRange.map(date => {
                         const { dayName, dayOfMonth, monthName } = formatDateForCard(date);
                         const isDisabled = !loadingDateAvailability && datesWithShows[date] === false;
                         const isLoading = loadingDateAvailability && datesWithShows[date] === undefined;
                        return ( <button key={date} className={`date-card ${selectedDate === date ? 'active' : ''} ${isDisabled ? 'no-shows' : ''} ${isLoading ? 'loading' : ''}`} onClick={() => handleDateChange(date)} aria-label={`Select date ${dayName} ${dayOfMonth} ${monthName}${isDisabled ? ' (No shows)' : ''}`} disabled={isDisabled || isLoading} title={isDisabled ? "No shows available" : (isLoading ? "Checking..." : "")}><span className="day-name">{dayName}</span><span className="date-day">{dayOfMonth}</span><span className="date-month">{monthName}</span>{isLoading && <span className="spinner"></span>}</button> );
                    })}
                </div>

                {/* Filter Section Wrapper */}
                <div className="filter-section-wrapper">
                    <button className="filter-toggle-button" onClick={toggleFilterVisibility} aria-expanded={isFilterVisible} aria-controls="filter-content-area">
                        <span>Filters</span>
                        <svg className={`filter-arrow-icon ${isFilterVisible ? 'open' : ''}`} viewBox="0 0 10 6" width="10" height="6" fill="currentColor" aria-hidden="true"><path d="M0 0.714286L5 5.71429L10 0.714286L9.28571 0L5 4.28571L0.714286 0L0 0.714286Z"/></svg>
                    </button>
                    <div ref={filterSectionRef} id="filter-content-area" className={`filter-section ${isFilterVisible ? 'visible' : ''}`}>
                        <div className="filter-group">
                            <label htmlFor="language-filter">Language</label>
                            <select id="language-filter" name="language" value={filterState.language} onChange={handleFilterChange} disabled={availableLanguages.length === 0}> <option value="">All</option> {availableLanguages.map(lang => ( <option key={lang} value={lang}>{lang}</option> ))} </select>
                        </div>
                         <div className="filter-group">
                            <label htmlFor="price-filter">Price Range</label>
                            <select id="price-filter" name="priceRange" value={filterState.priceRange} onChange={handleFilterChange}> <option value="">Any</option> <option value="0-150">₹0-150</option> <option value="151-300">₹151-300</option> <option value="300+">₹300+</option> </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="timing-filter">Show Timing</label>
                            <select id="timing-filter" name="showTiming" value={filterState.showTiming} onChange={handleFilterChange}> <option value="">Any</option> <option value="EarlyMorning">Before 9AM</option> <option value="Morning">9AM-12PM</option> <option value="Afternoon">12PM-4PM</option> <option value="Evening">4PM-8PM</option> <option value="Night">After 8PM</option> </select>
                        </div>
                         <div className="filter-group">
                            <label htmlFor="tickets-filter">Min. Tickets</label>
                            <input id="tickets-filter" type="number" name="numberOfTickets" min="1" value={filterState.numberOfTickets} onChange={handleFilterChange} placeholder="Any" />
                        </div>
                        <div className="filter-actions">
                            <button className="clear-filters-button" onClick={handleClearFilters} disabled={loadingShowtimes}>Clear</button>
                            <button className="apply-filters" onClick={applyFilters} disabled={loadingShowtimes}>Apply</button>
                        </div>
                    </div>
                </div>
            </div>

             {/* Theaters and Showtimes List */}
            {loadingShowtimes ? ( <div className="loading">Loading Showtimes...</div> )
            : Object.keys(groupedShowtimes).length > 0 ? (
                <div className="theaters-list">
                    {Object.entries(groupedShowtimes)
                        .sort((a, b) => {
                            const aId = a[1].theaterId; const bId = b[1].theaterId;
                            const aLiked = isAuthenticated && Array.isArray(user?.likedTheaters) && user.likedTheaters.some(id => String(id) === String(aId));
                            const bLiked = isAuthenticated && Array.isArray(user?.likedTheaters) && user.likedTheaters.some(id => String(id) === String(bId));
                            if (aLiked === bLiked) return 0; return aLiked ? -1 : 1;
                        })
                        .map(([theaterName, { showtimes: theaterShowtimes, theaterId }]) => (
                        <div key={theaterId || theaterName} className="theater-card">
                            <div className="theater-header">
                                <div className="theater-title-row">
                                    <h3>{theaterName}</h3>
                                    {theaterId && isAuthenticated && (
                                        <button
                                            className={`like-theater-inline-btn ${Array.isArray(user?.likedTheaters) && user.likedTheaters.some(id => String(id) === String(theaterId)) ? 'liked' : ''}`}
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                try {
                                                    const isLiked = Array.isArray(user?.likedTheaters) && user.likedTheaters.some(id => String(id) === String(theaterId));
                                                    const data = isLiked ? await unlikeTheater(theaterId) : await likeTheater(theaterId);
                                                    if (setUser && user) {
                                                        setUser({ ...user, likedTheaters: data.likedTheaters, movieNotifications: data.movieNotifications });
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to toggle like', err);
                                                    alert(err?.response?.data?.message || 'Failed to update like');
                                                }
                                            }}
                                            aria-label={Array.isArray(user?.likedTheaters) && user.likedTheaters.some(id => String(id) === String(theaterId)) ? 'Unlike theatre' : 'Like theatre'}
                                            title={Array.isArray(user?.likedTheaters) && user.likedTheaters.some(id => String(id) === String(theaterId)) ? 'Unlike theatre' : 'Like theatre'}
                                        >
                                            {Array.isArray(user?.likedTheaters) && user.likedTheaters.some(id => String(id) === String(theaterId)) ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M2 9.137C2 14 6.02 16.591 8.962 18.911C10 19.729 11 20.5 12 20.5s2-.77 3.038-1.59C17.981 16.592 22 14 22 9.138c0-4.863-5.5-8.312-10-3.636C7.5.825 2 4.274 2 9.137Z"/></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m8.962 18.91l.464-.588l-.464.589ZM12 5.5l-.54.52a.75.75 0 0 0 1.08 0L12 5.5Zm3.038 13.41l.465.59l-.465-.59Zm-5.612-.588C7.91 17.127 6.253 15.96 4.938 14.48C3.65 13.028 2.75 11.334 2.75 9.137h-1.5c0 2.666 1.11 4.7 2.567 6.339c1.43 1.61 3.254 2.9 4.68 4.024l.93-1.178ZM2.75 9.137c0-2.15 1.215-3.954 2.874-4.713c1.612-.737 3.778-.541 5.836 1.597l1.08-1.04C10.1 2.444 7.264 2.025 5 3.06C2.786 4.073 1.25 6.425 1.25 9.137h1.5ZM8.497 19.5c.513.404 1.063.834 1.62 1.16c.557.325 1.193.59 1.883.59v-1.5c-.31 0-.674-.12-1.126-.385c-.453-.264-.922-.628-1.448-1.043L8.497 19.5Zm7.006 0c1.426-1.125 3.25-2.413 4.68-4.024c1.457-1.64 2.567-3.673 2.567-6.339h-1.5c0 2.197-.9 3.891-2.188 5.343c-1.315 1.48-2.972 2.647-4.488 3.842l.929 1.178ZM22.75 9.137c0-2.712-1.535-5.064-3.75-6.077c-2.264-1.035-5.098-.616-7.54 1.92l1.08 1.04c2.058-2.137 4.224-2.333 5.836-1.596c1.659.759 2.874 2.562 2.874 4.713h1.5Zm-8.176 9.185c-.526.415-.995.779-1.448 1.043c-.452.264-.816.385-1.126.385v1.5c.69 0 1.326-.265 1.883-.59c.558-.326 1.107-.756 1.62-1.16l-.929-1.178Z"/></svg>
                                            )}
                                        </button>
                                    )}
                                </div>
                                {theaterId && <Link to={`/theaters/${theaterId}`} className="theater-info-link">Info</Link>}
                            </div>
                             <div className="showtimes-grid">
                                 {theaterShowtimes.map(showtime => {
                                    const screenIdForLink = showtime.screen_id?._id || showtime.screen_id;
                                    const showtimeIdForLink = showtime._id;
                                    if (!screenIdForLink || !showtimeIdForLink) return null;
                                    const displayTime = formatTimeIST(showtime.start_time);
                                    const { status } = getAvailabilityStatus(showtime);
                                    const statusText = getStatusText(status);
                                    if (status === 'soldout') return ( <div key={showtimeIdForLink} className={`showtime-slot ${status}`} title="Sold Out">{displayTime}{showtime.screen_format && showtime.screen_format !== 'N/A' && (<span className="screen-format">{showtime.screen_format}</span>)}</div> );
                                    return ( <Link key={showtimeIdForLink} to={`/booking/screen/${screenIdForLink}/showtime/${showtimeIdForLink}`} className={`showtime-slot ${status}`} title={`Book ${displayTime} show${statusText ? ' - ' + statusText : ''}`} aria-label={`Book tickets for ${displayTime} at ${theaterName}${statusText ? ' (' + statusText + ')' : ''}`}>{displayTime}{showtime.screen_format && showtime.screen_format !== 'N/A' && (<span className="screen-format">{showtime.screen_format}</span>)}</Link> );
                                 })}
                             </div>
                         </div>
                     ))}
                 </div>
             ) : ( <div className="no-showtimes">{selectedCity ? `No showtimes available for "${movieDetails.title}" in ${selectedCity} on ${moment(selectedDate).format('DD MMM')} with the current filters.` : "Please select a city." }<br/>{Object.keys(appliedFilters).length > 0 && "Try adjusting the date or clearing filters."}</div> )}
        </div>
    );
};

export default Showtimes;