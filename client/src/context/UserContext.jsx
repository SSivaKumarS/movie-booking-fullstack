// frontend/src/context/UserContext.js
import { createContext, useState, useEffect } from 'react';
import api from '../api/api';

export const UserContext = createContext(); // Add 'export' here to make it a named export

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    useEffect(() => {
        const checkLoginStatus = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setUser(null);
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/me');
                setUser(response.data);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error checking login status:', error);
                
                // Only clear token and state if it's definitely an auth error
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    localStorage.removeItem('token');
                    setUser(null);
                    setIsAuthenticated(false);
                } else {
                    // For other errors (network issues, server down), keep the existing state
                    console.warn('Non-auth error during status check, maintaining existing state');
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();

        // Set up a periodic check for authentication status
        const authCheckInterval = setInterval(checkLoginStatus, 30000); // Check every 30 seconds

        return () => clearInterval(authCheckInterval);
    }, []); // Empty dependency array means run once on mount

    const login = (userData) => {
        if (userData.token) {
            localStorage.setItem('token', userData.token);
        }
        // Store the user object from the response
        const userToStore = userData.user || userData;
        setUser(userToStore);
        setIsAuthenticated(true);
        setIsLoading(false);
        console.log("UserContext: User logged in", userToStore);
    };

    const logout = () => {
        console.log("UserContext: Logging out user.");
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false); // Ensure loading is false after logout
        // Optionally redirect via navigate hook if passed down or using window.location
        // window.location.href = '/login';
    };

    // Provide isLoading state as well if components need it
    return (
        <UserContext.Provider value={{ user, setUser, isAuthenticated, login, logout, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};

// Default export is usually the context itself for useContext hook,
// but exporting Provider is also common. Adjust based on your import patterns.
export default UserContext; // Keep if you import { UserContext }
// Or export { UserProvider, UserContext }; // Alternative named exports