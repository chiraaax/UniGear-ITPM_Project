import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ItemRating.css';

const ItemRating = ({ itemId }) => {
  const { token } = useAuth();
  const [ratings, setRatings] = useState({
    average: 0,
    count: 0,
    ratings: [],
  });
  const [userRating, setUserRating] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch ratings for this item
  const fetchRatings = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/ratings/item/${itemId}`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  // Fetch user's existing rating
  const fetchUserRating = useCallback(async () => {
    if (!itemId || !token) return;
    try {
      const response = await fetch(`/api/ratings/item/${itemId}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.hasRated) {
          setUserRating(data.userRating);
          setHasRated(true);
        }
      }
    } catch (err) {
      console.error('Error fetching user rating:', err);
    }
  }, [itemId, token]);

  // Load ratings on mount and when itemId changes
  useEffect(() => {
    fetchRatings();
    fetchUserRating();
  }, [itemId, fetchRatings, fetchUserRating]);

  // Submit rating
  const handleSubmitRating = async (rating) => {
    if (!token) {
      setMessage('Please sign in to rate this item');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId,
          rating,
        }),
      });

      if (response.ok) {
        setUserRating(rating);
        setHasRated(true);
        setMessage('Rating submitted successfully!');
        setTimeout(() => setMessage(''), 2000);
        // Refresh ratings
        await fetchRatings();
      } else {
        setMessage('Failed to submit rating');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      setMessage('Error submitting rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="item-rating loading">Loading ratings...</div>;
  }

  return (
    <div className="item-rating">
      {/* Rating Summary */}
      <div className="rating-summary">
        <div className="rating-stats">
          <div className="average-rating">
            <span className="big-number">{ratings.average}</span>
            <span className="out-of">/ 5.0</span>
          </div>
          <div className="rating-info">
            <div className="stars-display">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= Math.round(ratings.average) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="rating-count">Based on {ratings.count} {ratings.count === 1 ? 'rating' : 'ratings'}</p>
          </div>
        </div>
      </div>

      {/* User Rating Area */}
      <div className="user-rating">
        <p className="rating-prompt">
          {hasRated ? '⭐ Your Rating:' : 'Rate this item:'}
        </p>

        <div className="star-selector">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`rating-star ${
                hoverRating >= star
                  ? 'hover'
                  : userRating >= star
                  ? 'selected'
                  : ''
              }`}
              onClick={() => handleSubmitRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={submitting}
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>

        {message && (
          <p className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}

        {hasRated && (
          <p className="your-rating-text">You rated this {userRating} star{userRating > 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Recent Ratings */}
      {ratings.ratings.length > 0 && (
        <div className="recent-ratings">
          <h4>Recent Ratings</h4>
          <div className="ratings-list">
            {ratings.ratings.slice(0, 5).map((rating) => (
              <div key={rating._id} className="rating-item">
                <div className="rating-header">
                  <span className="rater-name">{rating.user?.name || 'Anonymous'}</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`star ${star <= rating.rating ? 'filled' : ''}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <span className="rating-date">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemRating;
