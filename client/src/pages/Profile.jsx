import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserContext from '../context/UserContext';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useContext(UserContext);
    const navigate = useNavigate();

    if (!user) {
        navigate('/login');
        return null;
    }

    const { role } = user;
    const isAdminOrTheaterAdmin = role === 'admin' || role === 'theater_admin';

    return (
        <div className="profile-dashboard-container">
            <div className="profile-dashboard-header">
                {user.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="profile-dashboard-picture" />
                ) : (
                    <div className="profile-dashboard-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                    </div>
                )}
                <h1 className="profile-dashboard-name">{user.userName || user.name || 'User'}</h1>
                <p className="profile-dashboard-email">{user.email}</p>
            </div>

            <div className="profile-menu">
                <Link to="/myaccount" className="profile-menu-item">
                    <div className="menu-item-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                    <div className="menu-item-content">
                        <h3>My Account Details</h3>
                        <p>Edit your profile, picture & password</p>
                    </div>
                    <div className="menu-item-arrow">&rsaquo;</div>
                </Link>

                <Link to="/bookings" className="profile-menu-item">
                    <div className="menu-item-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                    </div>
                    <div className="menu-item-content">
                        <h3>My Bookings</h3>
                        <p>View your upcoming & past tickets</p>
                    </div>
                    <div className="menu-item-arrow">&rsaquo;</div>
                </Link>

                {isAdminOrTheaterAdmin && (
                    <Link to="/admin" className="profile-menu-item">
                        <div className="menu-item-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-.61.08-1.21.21-1.78L8 15v1c0 1.1.9 2 2 2v1.93C7.06 19.43 4 16.07 4 12zm13.89 5.4c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.11 5.4z"/>
                            </svg>
                        </div>
                        <div className="menu-item-content">
                            <h3>Admin Panel</h3>
                            <p>Manage content and settings</p>
                        </div>
                        <div className="menu-item-arrow">&rsaquo;</div>
                    </Link>
                )}

                {role === 'theater_admin' && (
                    <Link to="/admin/scanner" className="profile-menu-item">
                        <div className="menu-item-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                        </div>
                        <div className="menu-item-content">
                            <h3>Scanner</h3>
                            <p>Scan ticket QR codes</p>
                        </div>
                        <div className="menu-item-arrow">&rsaquo;</div>
                    </Link>
                )}
            </div>

            <div className="profile-dashboard-logout">
                <button 
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }} 
                    className="btn-logout"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Profile;