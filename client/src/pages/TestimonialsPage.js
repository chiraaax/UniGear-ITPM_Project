import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Testimonials.css';

const TestimonialsPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(3);
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
        setError('Failed to load testimonials');
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Error loading testimonials');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Adjust display count based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDisplayCount(1);
      } else if (window.innerWidth < 1024) {
        setDisplayCount(2);
      } else {
        setDisplayCount(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, feedbacks.length - displayCount) : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev + displayCount >= feedbacks.length ? 0 : prev + 1
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#667eea',
      '#764ba2',
      '#f093fb',
      '#4facfe',
      '#00f2fe',
      '#43e97b',
      '#fa709a',
      '#fee140',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const visibleFeedbacks = feedbacks.slice(currentIndex, currentIndex + displayCount);

  if (error) {
    return (
      <div className="testimonials-container error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="testimonials-wrapper">
      <div className="testimonials-container">
        {/* Header */}
        <div className="testimonials-header">
          <div className="testimonials-label"></div>
          <h2 className="testimonials-title">What Our Customers Say</h2>
          <p className="testimonials-subtitle">
            Discover what our valued users think about our platform. Real feedback from real users.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="testimonials-loading">
            <div className="spinner"></div>
            <p>Loading testimonials...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="testimonials-empty">
            <p>No testimonials yet. Be the first to share your feedback!</p>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="testimonials-grid">
              {visibleFeedbacks.map((feedback) => (
                <div key={feedback._id} className="testimonial-card">
                  {/* Avatar */}
                  <div className="testimonial-avatar-wrapper">
                    <div
                      className="testimonial-avatar"
                      style={{ backgroundColor: getAvatarColor(feedback.name) }}
                    >
                      {getInitials(feedback.name)}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`star ${i < feedback.rating ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  {/* Feedback Text */}
                  <p className="testimonial-text">{feedback.feedback}</p>

                  {/* Author Info */}
                  <div className="testimonial-author">
                    <h4 className="author-name">{feedback.name}</h4>
                    <p className="author-role">Verified User</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {feedbacks.length > displayCount && (
              <div className="testimonials-navigation">
                <button
                  className="nav-button prev"
                  onClick={handlePrev}
                  aria-label="Previous testimonials"
                >
                  <span>‹</span>
                </button>
                <div className="nav-dots">
                  {[...Array(Math.ceil(feedbacks.length / displayCount))].map((_, i) => (
                    <div
                      key={i}
                      className={`dot ${
                        i === Math.floor(currentIndex / displayCount) ? 'active' : ''
                      }`}
                    />
                  ))}
                </div>
                <button
                  className="nav-button next"
                  onClick={handleNext}
                  aria-label="Next testimonials"
                >
                  <span>›</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {}
      <div className="leaf leaf-1"></div>
      <div className="leaf leaf-2"></div>
      <div className="leaf leaf-3"></div>
      <div className="leaf leaf-4"></div>
    </div>
  );
};

export default TestimonialsPage;
