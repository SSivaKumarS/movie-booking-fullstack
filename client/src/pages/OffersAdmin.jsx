import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { listOffers, createOfferApi, updateOfferApi, deleteOfferApi, searchMovies } from '../api/api';
import './OffersAdmin.css';

// Icon Components
const OfferIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>;
const EditIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const DeleteIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const CancelIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const SaveIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>;
const SearchIcon = () => <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;

const initialForm = {
    title: '',
    type: 'conditional',
    condition: { minTickets: 3, code: '' },
    discountType: 'percentage',
    discountValue: 10,
    isActive: true,
};

const OffersAdmin = () => {
    const { user } = useContext(UserContext);
    const isAdmin = user?.role === 'admin';
    const [offers, setOffers] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [movieSearchTerm, setMovieSearchTerm] = useState('');
    const [movieResults, setMovieResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const loadOffers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await listOffers();
            setOffers(res.data || []);
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                title: form.title,
                type: form.type,
                condition: form.type === 'conditional'
                    ? { minTickets: Number(form.condition.minTickets || 0) }
                    : { code: String(form.condition.code || '').toUpperCase(), minTickets: Number(form.condition.minTickets || 0) },
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                isActive: Boolean(form.isActive),
                scope: form.scope || 'all',
                movie_id: form.scope === 'movie' ? (form.movie_id || undefined) : undefined,
            };
            if (editingId) {
                await updateOfferApi(editingId, payload);
            } else {
                await createOfferApi(payload);
            }
            setForm(initialForm);
            setEditingId(null);
            await loadOffers();
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    const onEdit = (offer) => {
        setEditingId(offer._id);
        setForm({
            title: offer.title,
            type: offer.type,
            condition: offer.type === 'conditional'
                ? { minTickets: offer.condition?.minTickets || 0 }
                : { code: offer.condition?.code || '', minTickets: offer.condition?.minTickets || 0 },
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            isActive: offer.isActive,
            scope: offer.scope || 'all',
            movie_id: offer.movie_id || '',
        });
        window.scrollTo(0, 0);
    };

    // Search movies when scope is 'movie'
    useEffect(() => {
        if (form.scope !== 'movie' || !movieSearchTerm) {
            setMovieResults([]);
            return;
        }
        let active = true;
        const t = setTimeout(async () => {
            try {
                setIsSearching(true);
                const res = await searchMovies(movieSearchTerm);
                if (!active) return;
                const items = Array.isArray(res) ? res : res.items || [];
                setMovieResults(items);
            } catch (e) {
                if (!active) return;
                setMovieResults([]);
            } finally {
                if (active) setIsSearching(false);
            }
        }, 300);
        return () => { active = false; clearTimeout(t); };
    }, [form.scope, movieSearchTerm]);

    const onDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;
        setLoading(true);
        try {
            await deleteOfferApi(id);
            await loadOffers();
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="admin-container">
                <div className="access-denied">
                    <h1>Access Restricted</h1>
                    <p>This area is for administrators only.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-card">
                <div className="admin-header">
                    <div className="header-icon">
                        <OfferIcon />
                    </div>
                    <div className="header-content">
                        <h1>Offers & Promo Codes</h1>
                        <p>Manage promotional offers and discount codes</p>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={onSubmit} className="admin-form">
                    <div className="form-section">
                        <h3>{editingId ? 'Edit Offer' : 'Create New Offer'}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                    placeholder="Enter offer title"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Type</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                    <option value="conditional">Conditional</option>
                                    <option value="promocode">Promo Code</option>
                                </select>
                            </div>

                            {form.type === 'conditional' ? (
                                <div className="form-group">
                                    <label>Minimum Tickets</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.condition.minTickets}
                                        onChange={(e) => setForm({ ...form, condition: { ...form.condition, minTickets: e.target.value } })}
                                        placeholder="0"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Promo Code</label>
                                        <input
                                            value={form.condition.code}
                                            onChange={(e) => setForm({ ...form, condition: { ...form.condition, code: e.target.value } })}
                                            placeholder="Enter promo code"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Min Tickets (Promo)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.condition.minTickets || 0}
                                            onChange={(e) => setForm({ ...form, condition: { ...form.condition, minTickets: e.target.value } })}
                                            placeholder="0"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Scope</label>
                                <select value={form.scope || 'all'} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                                    <option value="all">All Movies</option>
                                    <option value="movie">Specific Movie</option>
                                    <option value="first_time">First-time Booking</option>
                                </select>
                            </div>

                            {form.scope === 'movie' && (
                                <div className="form-group">
                                    <label>Movie</label>
                                    {form.movie_id ? (
                                        <div className="selected-movie">
                                            <span>Selected: {form.movie_id}</span>
                                            <button type="button" onClick={() => { setForm({ ...form, movie_id: '' }); setMovieSearchTerm(''); setMovieResults([]); }} className="change-button">
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="search-input-wrapper">
                                                <input
                                                    value={movieSearchTerm}
                                                    onChange={(e) => setMovieSearchTerm(e.target.value)}
                                                    placeholder="Search movie by title"
                                                />
                                                <SearchIcon />
                                            </div>
                                            {isSearching && <div className="search-loading">Searching...</div>}
                                            {movieResults && movieResults.length > 0 && (
                                                <div className="search-results">
                                                    {movieResults.map((m) => (
                                                        <div key={m._id} className="search-result-item">
                                                            <span>{m.title}</span>
                                                            <button type="button" onClick={() => { setForm({ ...form, movie_id: m._id }); setMovieSearchTerm(''); setMovieResults([]); }} className="select-button">
                                                                Select
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Discount Type</label>
                                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                                    <option value="percentage">Percentage</option>
                                    <option value="flat">Flat</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Discount Value</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.discountValue}
                                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    />
                                    <span className="checkmark"></span>
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="submit-button">
                                <SaveIcon />
                                {loading ? 'Saving...' : (editingId ? 'Update Offer' : 'Create Offer')}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setForm(initialForm);
                                    }}
                                >
                                    <CancelIcon />
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <div className="admin-table-section">
                    <h3>Existing Offers</h3>
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Scope</th>
                                    <th>Condition</th>
                                    <th>Discount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offers.map((o) => (
                                    <tr key={o._id}>
                                        <td className="title-cell">{o.title}</td>
                                        <td>
                                            <span className={`type-badge ${o.type}`}>
                                                {o.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="scope-text">
                                                {o.scope || 'all'}
                                                {o.scope === 'movie' && o.movie_id && (
                                                    <span className="movie-id">({o.movie_id})</span>
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="condition-text">
                                                {o.type === 'conditional'
                                                    ? `Min Tickets: ${o.condition?.minTickets ?? '-'}`
                                                    : `Code: ${o.condition?.code ?? '-'}${o.condition?.minTickets ? `, Min Tickets: ${o.condition.minTickets}` : ''}`}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="discount-value">
                                                {o.discountValue}{o.discountType === 'percentage' ? '%' : '₹'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${o.isActive ? 'active' : 'inactive'}`}>
                                                {o.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="edit-button" onClick={() => onEdit(o)}>
                                                <EditIcon />
                                                Edit
                                            </button>
                                            <button className="delete-button" onClick={() => onDelete(o._id)}>
                                                <DeleteIcon />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {offers.length === 0 && (
                            <div className="empty-state">
                                <p>No offers created yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OffersAdmin;