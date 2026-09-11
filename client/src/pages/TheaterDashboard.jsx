import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TheaterDashboard.css';
import api from '../api/api';

const TheaterDashboard = () => {
    const [stats, setStats] = useState({
        today: {
            ticketsSold: 0,
            revenue: 0,
            showsRunning: 0,
            occupancyRate: 0,
            topMovie: null
        },
        week: {
            ticketsSold: 0,
            revenue: 0
        },
        month: {
            ticketsSold: 0,
            revenue: 0
        }
    });
    const [todayShows, setTodayShows] = useState([]);
    const [movieStats, setMovieStats] = useState([]);
    const [screenStats, setScreenStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch today's statistics
                const todayStats = await api.get('/theater/stats/today');
                const weekStats = await api.get('/theater/stats/week');
                const monthStats = await api.get('/theater/stats/month');
                const shows = await api.get('/theater/shows/today');
                const movies = await api.get('/theater/movies/stats');
                const screens = await api.get('/theater/screens/stats');

                setStats({
                    today: todayStats.data,
                    week: weekStats.data,
                    month: monthStats.data
                });
                setTodayShows(shows.data);
                setMovieStats(movies.data);
                setScreenStats(screens.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="loading">Loading dashboard data...</div>;
    }

    return (
        <div className="theater-dashboard">
            <header className="dashboard-header">
                <h1>Theater Dashboard</h1>
                <p className="last-updated">Last updated: {new Date().toLocaleTimeString()}</p>
            </header>

            {/* Overview Section */}
            <section className="dashboard-section overview">
                <h2>Overview</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Today's Tickets</h3>
                        <p className="stat-value">{stats.today.ticketsSold}</p>
                        <div className="stat-comparison">
                            <span>Week: {stats.week.ticketsSold}</span>
                            <span>Month: {stats.month.ticketsSold}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Today's Revenue</h3>
                        <p className="stat-value">₹{stats.today.revenue.toLocaleString()}</p>
                        <div className="stat-comparison">
                            <span>Week: ₹{stats.week.revenue.toLocaleString()}</span>
                            <span>Month: ₹{stats.month.revenue.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Shows Running Today</h3>
                        <p className="stat-value">{stats.today.showsRunning}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Current Occupancy</h3>
                        <p className="stat-value">{stats.today.occupancyRate}%</p>
                    </div>
                </div>
            </section>

            {/* Today's Shows Section */}
            <section className="dashboard-section shows">
                <h2>Today's Shows</h2>
                <div className="shows-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Movie</th>
                                <th>Screen</th>
                                <th>Occupancy</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayShows.map((show) => (
                                <tr key={show._id}>
                                    <td>{new Date(show.start_time).toLocaleTimeString()}</td>
                                    <td>{show.movie.title}</td>
                                    <td>{show.screen.screen_number}</td>
                                    <td>
                                        <div className="occupancy-bar">
                                            <div 
                                                className="occupancy-fill" 
                                                style={{ width: `${show.occupancy}%` }}
                                            />
                                            <span>{show.occupancy}%</span>
                                        </div>
                                    </td>
                                    <td>₹{show.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Movie Statistics Section */}
            <section className="dashboard-section movies">
                <h2>Movie Performance</h2>
                <div className="movies-grid">
                    {movieStats.map((movie) => (
                        <div key={movie._id} className="movie-stat-card">
                            <h3>{movie.title}</h3>
                            <div className="movie-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Tickets Sold</span>
                                    <span className="stat-number">{movie.ticketsSold}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Revenue</span>
                                    <span className="stat-number">₹{movie.revenue.toLocaleString()}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Avg. Occupancy</span>
                                    <div className="occupancy-bar">
                                        <div 
                                            className="occupancy-fill" 
                                            style={{ width: `${movie.avgOccupancy}%` }}
                                        />
                                        <span>{movie.avgOccupancy}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Screen Statistics Section */}
            <section className="dashboard-section screens">
                <h2>Screen Utilization</h2>
                <div className="screens-grid">
                    {screenStats.map((screen) => (
                        <div key={screen._id} className="screen-stat-card">
                            <h3>Screen {screen.screen_number}</h3>
                            <div className="screen-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Shows Today</span>
                                    <span className="stat-number">{screen.showsToday}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Utilization</span>
                                    <div className="occupancy-bar">
                                        <div 
                                            className="occupancy-fill" 
                                            style={{ width: `${screen.utilization}%` }}
                                        />
                                        <span>{screen.utilization}%</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Revenue</span>
                                    <span className="stat-number">₹{screen.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default TheaterDashboard; 