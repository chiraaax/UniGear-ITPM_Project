import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/FeedbackDisplay.css';

const FeedbackDisplayPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuth();

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch('/api/feedback', { headers });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
        setError('');
      } else {
        setError('Failed to load feedbacks');
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Error loading feedbacks');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Filter and sort feedbacks
  useEffect(() => {
    let filtered = [...feedbacks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (fb) =>
          fb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fb.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fb.feedback.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Rating filter
    if (filterRating !== 'all') {
      filtered = filtered.filter((fb) => fb.rating === parseInt(filterRating));
    }

    // Sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    }

    setFilteredFeedbacks(filtered);
  }, [feedbacks, sortBy, filterRating, searchQuery]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFeedbacks((prev) => prev.filter((fb) => fb._id !== id));
      } else {
        setError('Failed to delete feedback');
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Error deleting feedback');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="feedback-display-container">
      <div className="feedback-header">
        <h1>📋 Feedback Submissions</h1>
        <p className="subtitle">Total Feedbacks: {filteredFeedbacks.length} of {feedbacks.length}</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by name, email, or feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="sort">Sort by:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="rating">Rating:</label>
            <select
              id="rating"
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
              <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
              <option value="3">⭐⭐⭐ (3 Stars)</option>
              <option value="2">⭐⭐ (2 Stars)</option>
              <option value="1">⭐ (1 Star)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="feedbacks-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading feedbacks...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📭</p>
            <p className="empty-text">
              {feedbacks.length === 0 ? 'No feedbacks yet' : 'No feedbacks match your filters'}
            </p>
          </div>
        ) : (
          <div className="feedbacks-grid">
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback._id} className="feedback-card">
                <div className="card-header">
                  <div className="user-info">
                    <h3 className="user-name">{feedback.name}</h3>
                    <p className="user-email">{feedback.email}</p>
                    {feedback.phone && <p className="user-phone">📞 {feedback.phone}</p>}
                  </div>
                  {token && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(feedback._id)}
                      title="Delete feedback"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className="card-rating">
                  {renderStars(feedback.rating)}
                  <span className="rating-text">{feedback.rating}/5</span>
                </div>

                <div className="card-content">
                  <p className="feedback-text">{feedback.feedback}</p>
                </div>

                <div className="card-footer">
                  <span className="date">{formatDate(feedback.createdAt)}</span>
                  {feedback.user && (
                    <span className="user-badge">👤 User</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <p className="stat-label">Average Rating</p>
          <p className="stat-value">
            {feedbacks.length > 0
              ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
              : 'N/A'}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">5-Star Reviews</p>
          <p className="stat-value">
            {feedbacks.filter((fb) => fb.rating === 5).length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Feedbacks</p>
          <p className="stat-value">{feedbacks.length}</p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDisplayPage;
