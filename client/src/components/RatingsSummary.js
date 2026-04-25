import React, { useState, useEffect } from 'react';
import '../styles/RatingsSummary.css';

const RatingsSummary = ({ itemId }) => {
  const [ratings, setRatings] = useState({
    average: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
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
    };

    fetchRatings();
  }, [itemId]);

  if (loading) {
    return null;
  }

  if (ratings.count === 0) {
    return <div className="rating-summary-empty">No ratings yet</div>;
  }

  return (
    <div className="rating-summary">
      <div className="rating-stars-compact">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= Math.round(ratings.average) ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
      <div className="rating-text">
        <span className="average">{ratings.average}</span>
        <span className="count">({ratings.count} {ratings.count === 1 ? 'rating' : 'ratings'})</span>
      </div>
    </div>
  );
};

export default RatingsSummary;
