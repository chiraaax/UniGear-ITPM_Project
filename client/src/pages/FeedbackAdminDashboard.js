import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/FeedbackAdminDashboard.css';

const FeedbackAdminDashboard = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
  });
  const { token } = useAuth();

  const fetchFeedbacks = useCallback(async () => {
    if (!token) {
      setError('You must be logged in to view this page');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/feedback', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
        calculateStats(data);
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

  const calculateStats = (feedbackList) => {
    const total = feedbackList.length;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    feedbackList.forEach((fb) => {
      ratingCounts[fb.rating]++;
      totalRating += fb.rating;
    });

    setStats({
      total,
      avgRating: total > 0 ? (totalRating / total).toFixed(2) : 0,
      fiveStars: ratingCounts[5],
      fourStars: ratingCounts[4],
      threeStars: ratingCounts[3],
      twoStars: ratingCounts[2],
      oneStar: ratingCounts[1],
    });
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback permanently?')) return;

    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updated = feedbacks.filter((fb) => fb._id !== id);
        setFeedbacks(updated);
        calculateStats(updated);
      } else {
        setError('Failed to delete feedback');
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Error deleting feedback');
    }
  };

  const filterByRating = (rating) => {
    if (selectedTab === 'all') return feedbacks;
    return feedbacks.filter((fb) => fb.rating === parseInt(selectedTab));
  };

  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div key={rating} className="rating-bar-item">
        <span className="rating-label">{rating} ⭐</span>
        <div className="bar-container">
          <div
            className="bar-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="rating-count">{count}</span>
      </div>
    );
  };

  const displayedFeedbacks = filterByRating();

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Feedback Admin Dashboard</h1>
        <button className="refresh-btn" onClick={fetchFeedbacks}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Statistics Section */}
      <div className="stats-grid">
        <div className="stat-box primary">
          <div className="stat-icon">📈</div>
          <div className="stat-details">
            <p className="stat-title">Total Feedbacks</p>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>

        <div className="stat-box success">
          <div className="stat-icon">⭐</div>
          <div className="stat-details">
            <p className="stat-title">Average Rating</p>
            <p className="stat-number">{stats.avgRating}</p>
          </div>
        </div>

        <div className="stat-box info">
          <div className="stat-icon">👍</div>
          <div className="stat-details">
            <p className="stat-title">5-Star Reviews</p>
            <p className="stat-number">{stats.fiveStars}</p>
          </div>
        </div>

        <div className="stat-box warning">
          <div className="stat-icon">💭</div>
          <div className="stat-details">
            <p className="stat-title">Pending Review</p>
            <p className="stat-number">{stats.total - stats.fiveStars}</p>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="distribution-section">
        <h2>Rating Distribution</h2>
        <div className="rating-bars">
          {renderRatingBar(5, stats.fiveStars, stats.total)}
          {renderRatingBar(4, stats.fourStars, stats.total)}
          {renderRatingBar(3, stats.threeStars, stats.total)}
          {renderRatingBar(2, stats.twoStars, stats.total)}
          {renderRatingBar(1, stats.oneStar, stats.total)}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          All ({stats.total})
        </button>
        <button
          className={`tab-btn ${selectedTab === '5' ? 'active' : ''}`}
          onClick={() => setSelectedTab('5')}
        >
          ⭐⭐⭐⭐⭐ ({stats.fiveStars})
        </button>
        <button
          className={`tab-btn ${selectedTab === '4' ? 'active' : ''}`}
          onClick={() => setSelectedTab('4')}
        >
          ⭐⭐⭐⭐ ({stats.fourStars})
        </button>
        <button
          className={`tab-btn ${selectedTab === '3' ? 'active' : ''}`}
          onClick={() => setSelectedTab('3')}
        >
          ⭐⭐⭐ ({stats.threeStars})
        </button>
        <button
          className={`tab-btn ${selectedTab === '2' ? 'active' : ''}`}
          onClick={() => setSelectedTab('2')}
        >
          ⭐⭐ ({stats.twoStars})
        </button>
        <button
          className={`tab-btn ${selectedTab === '1' ? 'active' : ''}`}
          onClick={() => setSelectedTab('1')}
        >
          ⭐ ({stats.oneStar})
        </button>
      </div>

      {/* Feedbacks List */}
      <div className="feedbacks-list-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading feedbacks...</p>
          </div>
        ) : displayedFeedbacks.length === 0 ? (
          <div className="empty-state">
            <p>No feedbacks found for this rating</p>
          </div>
        ) : (
          <div className="feedbacks-table">
            <div className="table-header">
              <div className="col-name">Name</div>
              <div className="col-email">Email</div>
              <div className="col-rating">Rating</div>
              <div className="col-feedback">Feedback</div>
              <div className="col-date">Date</div>
              <div className="col-action">Action</div>
            </div>
            {displayedFeedbacks.map((feedback) => (
              <div key={feedback._id} className="table-row">
                <div className="col-name">
                  <strong>{feedback.name}</strong>
                </div>
                <div className="col-email">{feedback.email}</div>
                <div className="col-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < feedback.rating ? 'star-filled' : 'star-empty'}>
                      ★
                    </span>
                  ))}
                </div>
                <div className="col-feedback">
                  <p className="feedback-preview">{feedback.feedback.substring(0, 50)}...</p>
                </div>
                <div className="col-date">
                  {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="col-action">
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(feedback._id)}
                    title="Delete feedback"
                  >
                    
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackAdminDashboard;
