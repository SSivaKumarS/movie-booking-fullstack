import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext';
import './BottomNavigation.css';

const BottomNavigation = () => {
    const { isAuthenticated, user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Search functionality moved to /search route
    return (
        <div className="bottom-navigation">
            <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                <span>Home</span>
            </Link>

            <Link to="/search" className={`bottom-nav-item ${location.pathname === '/search' ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <span>Search</span>
            </Link>

            {user?.role === 'theater_admin' || user?.role === 'admin' ? (
                <>
                    <Link to="/admin" className={`bottom-nav-item ${location.pathname === '/admin' || location.pathname === '/admin/theater-dashboard' ? 'active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                        </svg>
                        <span>Dashboard</span>
                    </Link>
                    {user?.role === 'theater_admin' && (
                        <Link to="/admin/scanner" className={`bottom-nav-item ${location.pathname === '/admin/scanner' ? 'active' : ''}`}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z" />
                            </svg>
                            <span>Scanner</span>
                        </Link>
                    )}
                </>
            ) : (
                <Link to="/movies" className={`bottom-nav-item ${location.pathname.startsWith('/movies') ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                    </svg>
                    <span>Movies</span>
                </Link>
            )}

            <Link to={isAuthenticated ? "/profile" : "/login"} className={`bottom-nav-item ${location.pathname === '/profile' || location.pathname === '/login' ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                <span>Profile</span>
            </Link>
        </div>
    );
};

export default BottomNavigation;
