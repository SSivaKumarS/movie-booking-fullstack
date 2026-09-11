// src/components/Filter.jsx
import React, { useState, useEffect } from 'react';
import './Filter.css';

const Filter = ({ onFilterChange, availableLanguages }) => {
    const [language, setLanguage] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [showTiming, setShowTiming] = useState('');
    const [numberOfTickets, setNumberOfTickets] = useState('');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [processedLanguages, setProcessedLanguages] = useState([]); // New state for processed languages

    useEffect(() => {
        if (availableLanguages && availableLanguages.length > 0) {
            // Process availableLanguages to split comma-separated strings and get unique languages
            const uniqueLanguages = new Set();
            availableLanguages.forEach(langString => {
                if (langString && typeof langString === 'string') { // Check if langString is valid string
                    langString.split(',').map(lang => lang.trim()).forEach(lang => { // Split and trim
                        if (lang) { // Check if lang is not empty after trim
                            uniqueLanguages.add(lang);
                        }
                    });
                }
            });
            setProcessedLanguages(Array.from(uniqueLanguages)); // Convert Set to Array for rendering
        } else {
            setProcessedLanguages([]); // If no availableLanguages, set processedLanguages to empty array
        }
    }, [availableLanguages]); // Effect runs when availableLanguages prop changes


    const handleFilterSubmit = () => {
        const filters = {
            language,
            priceRange,
            showTiming,
            numberOfTickets: parseInt(numberOfTickets, 10) || '',
        };
        onFilterChange(filters);
        setIsFilterPanelOpen(false); // Close filter panel after applying
    };

    const toggleFilterPanel = () => {
        setIsFilterPanelOpen(prevState => !prevState);
    };

    return (
        <div className="filter-container">
            <h3>Filter By:</h3>
            <div className="filter-button-container">
                <button className="filters-button" onClick={toggleFilterPanel}>
                    Filters <span className="dropdown-icon">{isFilterPanelOpen ? '▲' : '▼'}</span>
                </button>
            </div>

            <div className={`filter-panel ${isFilterPanelOpen ? 'open' : ''}`}>
                <div className="filter-options">
                    {/* Language Filter */}
                    <div className="filter-group">
                        <label htmlFor="language">Language:</label>
                        <select
                            id="language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="">Any</option>
                            {/* Dynamically generate language options from processedLanguages */}
                            {processedLanguages.map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price Range Filter */}
                    <div className="filter-group">
                        <label htmlFor="priceRange">Price Range:</label>
                        <select
                            id="priceRange"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                        >
                            <option value="">Any</option>
                            <option value="0-150">₹0 - ₹150</option>
                            <option value="151-300">₹151 - ₹300</option>
                            <option value="300+">₹300 & Above</option>
                        </select>
                    </div>

                    {/* Show Timing Filter */}
                    <div className="filter-group">
                        <label htmlFor="showTiming">Show Timing:</label>
                        <select
                            id="showTiming"
                            value={showTiming}
                            onChange={(e) => setShowTiming(e.target.value)}
                        >
                            <option value="">Any</option>
                            <option value="EarlyMorning">Early Morning (Before 9 AM)</option>
                            <option value="Morning">Morning (9 AM - 12 PM)</option>
                            <option value="Afternoon">Afternoon (12 PM - 4 PM)</option>
                            <option value="Evening">Evening (4 PM - 8 PM)</option>
                            <option value="Night">Night (8 PM onwards)</option>
                        </select>
                    </div>

                    {/* Number of Tickets Filter */}
                    <div className="filter-group">
                        <label htmlFor="numberOfTickets">No. of Tickets:</label>
                        <input
                            type="number"
                            id="numberOfTickets"
                            min="1"
                            value={numberOfTickets}
                            onChange={(e) => setNumberOfTickets(e.target.value)}
                        />
                    </div>
                </div>
                <div className="filter-actions">
                    <button className="btn-primary" onClick={handleFilterSubmit}>Apply Filters</button>
                </div>
            </div>
        </div>
    );
};

export default Filter;