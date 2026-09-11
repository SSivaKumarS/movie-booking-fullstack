// frontend/src/context/CityContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCities } from '../api/api'; // Import the function to fetch cities

// 1. Create the context
const CityContext = createContext();

// 2. Create the Provider component
export const CityProvider = ({ children }) => {
    const [selectedCity, setSelectedCity] = useState(""); // Initial state is empty
    const [availableCities, setAvailableCities] = useState([]); // State to hold fetched cities
    const [loadingCities, setLoadingCities] = useState(true); // Loading state
    const [cityError, setCityError] = useState(null); // Error state

    // Fetch available cities when the provider mounts
    useEffect(() => {
        let isMounted = true; // Prevent state update on unmounted component
        const fetchAndSetCities = async () => {
            setLoadingCities(true);
            setCityError(null);
            try {
                const citiesData = await getCities(); // Fetch cities from API
                if (isMounted) {
                    const validCities = citiesData || []; // Ensure it's an array
                    setAvailableCities(validCities);

                    // --- Set Default City Logic ---
                    // Check if a city is already stored (e.g., from previous session)
                    const storedCity = localStorage.getItem('selectedCity');
                    if (storedCity && validCities.includes(storedCity)) {
                        // If stored city exists and is valid, use it
                        setSelectedCity(storedCity);
                         console.log("[CityContext] Loaded stored city:", storedCity);
                    } else if (validCities.length > 0) {
                        // Otherwise, if no valid stored city, set the first fetched city as default
                        setSelectedCity(validCities[0]);
                        localStorage.setItem('selectedCity', validCities[0]); // Store the default
                        console.log("[CityContext] Set default city:", validCities[0]);
                    } else {
                        // No cities available
                         setSelectedCity(""); // Ensure it's empty if no cities
                         localStorage.removeItem('selectedCity'); // Remove potentially invalid stored item
                    }
                    // --- End Set Default City Logic ---
                }
            } catch (error) {
                console.error("[CityContext] Error fetching cities:", error);
                 if (isMounted) {
                    setCityError("Could not load available cities.");
                    setAvailableCities([]); // Clear cities on error
                    setSelectedCity(""); // Reset selection
                     localStorage.removeItem('selectedCity');
                 }
            } finally {
                 if (isMounted) setLoadingCities(false);
            }
        };

        fetchAndSetCities();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Function to update selected city and store it
    const handleSetSelectedCity = (city) => {
        if (availableCities.includes(city) || city === "") { // Allow setting empty or a valid city
            setSelectedCity(city);
            if (city) {
                localStorage.setItem('selectedCity', city); // Store selection
                 console.log("[CityContext] City selected and stored:", city);
            } else {
                 localStorage.removeItem('selectedCity'); // Remove if selection is cleared
                 console.log("[CityContext] City selection cleared.");
            }

        } else {
            console.warn(`[CityContext] Attempted to set invalid city: ${city}`);
        }
    };

    // Value provided by the context
    const contextValue = {
        selectedCity,
        setSelectedCity: handleSetSelectedCity, // Provide the wrapped setter function
        availableCities, // Provide the list of cities
        loadingCities, // Provide loading state
        cityError // Provide error state
    };

    return (
        <CityContext.Provider value={contextValue}>
            {children}
        </CityContext.Provider>
    );
};

// 3. Custom hook to use the context
export const useCity = () => {
     const context = useContext(CityContext);
     if (context === undefined) {
        throw new Error('useCity must be used within a CityProvider');
     }
     return context;
};

// Optional: Default export of the context object itself (if needed)
// export default CityContext;