import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminPanel.css';
import { UserContext } from '../context/UserContext';
import api from '../api/api';

const AdminPanel = () => {
    const { user } = useContext(UserContext);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                setUserName(response.data.name);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUserProfile();
    }, []);

    const isTheatreAdmin = user?.role === 'theater_admin';
    const isAdmin = user?.role === 'admin';
    const isUser = user?.role === 'user';

    return (
        <div>
            {!isUser ? (
                <div className="admin-panel-container">
                    <header className="admin-header">
                        <h1 className="admin-title">Admin Dashboard</h1>
                        <p className="admin-greeting">Welcome back, {userName}</p>
                    </header>

                    <div className="admin-grid">
                        {/* Theater Dashboard - Only visible to theater admin */}
                        {isTheatreAdmin && (
                            <section className="admin-card">
                                <Link to="/admin/theater-dashboard" className="card-link full-link">
                                    <span className="link-icon">📊</span>
                                    <div className="link-content">
                                        <h3>Theater Dashboard</h3>
                                        <p>View theater statistics and performance</p>
                                    </div>
                                </Link>
                            </section>
                        )}

                        {/* Movie Management */}
                        {!isTheatreAdmin && (
                            <section className="admin-card">
                                <h2 className="card-title">Movie Management</h2>
                                <div className="card-links">
                                    <Link to="/admin/add-movie" className="card-link">
                                        <span className="link-icon">＋</span>
                                        <div className="link-content">
                                            <h3>Add New Movie</h3>
                                            <p>Create new movie listing</p>
                                        </div>
                                    </Link>
                                    <Link to="/admin/edit-movie" className="card-link">
                                        <span className="link-icon">✎</span>
                                        <div className="link-content">
                                            <h3>Edit Movies</h3>
                                            <p>Modify existing listings</p>
                                        </div>
                                    </Link>
                                    <Link to="/admin/delete-movie" className="card-link">
                                        <span className="link-icon">✕</span>
                                        <div className="link-content">
                                            <h3>Remove Movies</h3>
                                            <p>Delete movie entries</p>
                                        </div>
                                    </Link>
                                </div>
                            </section>
                        )}

                        {/* Offers Management - Admin only */}
                        {isAdmin && (
                            <section className="admin-card">
                                <Link to="/admin/offers" className="card-link full-link">
                                    <span className="link-icon">💸</span>
                                    <div className="link-content">
                                        <h3>Offers & Promo Codes</h3>
                                        <p>Create and manage discounts</p>
                                    </div>
                                </Link>
                            </section>
                        )}

                        {/* Theater Management */}
                        <section className="admin-card">
                            <Link to="/admin/theaters" className="card-link full-link">
                                <span className="link-icon">🏢</span>
                                <div className="link-content">
                                    <h3>Theater Controls</h3>
                                    <p>Manage theaters & screens</p>
                                </div>
                            </Link>
                        </section>

                        {/* Show Management */}
                        {!isAdmin && (
                            <section className="admin-card">
                                <h2 className="card-title">Show Management</h2>
                                <div className="card-links">
                                    <Link to="/admin/add-show" className="card-link">
                                        <span className="link-icon">＋</span>
                                        <div className="link-content">
                                            <h3>Add Shows</h3>
                                            <p>Create new screenings</p>
                                        </div>
                                    </Link>
                                    <Link to="/admin/add-multiple-shows" className="card-link">
                                        <span className="link-icon">＋</span>
                                        <div className="link-content">
                                            <h3>Add Multiple Shows</h3>
                                            <p>Add shows in bulk for a time period</p>
                                        </div>
                                    </Link>
                                    <Link to="/admin/delete-show" className="card-link">
                                        <span className="link-icon">✕</span>
                                        <div className="link-content">
                                            <h3>Remove Shows</h3>
                                            <p>Delete existing screenings</p>
                                        </div>
                                    </Link>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            ) : (
                <div className="access-denied">
                    <h1>Access Restricted</h1>
                    <p>You don't have permission to view this page</p>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;