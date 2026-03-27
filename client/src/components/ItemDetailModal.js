import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ItemRating from './ItemRating';
import '../styles/ItemDetailModal.css';

const ItemDetailModal = ({ item, isOpen, onClose }) => {
  const { token } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    feedback: '',
    rating: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchFeedbacks = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback/item/${item._id}`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (isOpen && item) {
      fetchFeedbacks();
    }
  }, [isOpen, item, fetchFeedbacks]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRating = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.feedback) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          feedback: form.feedback,
          rating: form.rating || undefined,
          itemId: item._id,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Thank you for your feedback!');
        setForm({ name: '', email: '', phone: '', feedback: '', rating: 0 });
        await fetchFeedbacks();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>{item.title}</h2>
          <p className="category-tag">{item.category}</p>
        </div>

        <div className="modal-body">
          {/* Item Details Section */}
          <section className="item-details">
            <div className="detail-row">
              <span className="label">Daily Rate:</span>
              <span className="value">LKR {item.dailyRate} / day</span>
            </div>
            <div className="detail-row">
              <span className="label">Owner:</span>
              <span className="value">
                {item.owner?.name} <span className="trust-score">(Trust {item.owner?.trustScore?.toFixed(1)})</span>
              </span>
            </div>
            {item.description && (
              <div className="detail-row full-width">
                <span className="label">Description:</span>
                <p className="description">{item.description}</p>
              </div>
            )}
          </section>

          {/* Star Ratings Section */}
          <section className="ratings-section">
            <h3>Star Ratings</h3>
            <ItemRating itemId={item._id} />
          </section>

          {/* Feedback List */}
          <section className="feedbacks-section">
            <h3>Customer Feedback</h3>
            {loading ? (
              <p className="loading">Loading feedbacks...</p>
            ) : feedbacks.length > 0 ? (
              <div className="feedbacks-list">
                {feedbacks.map((feedback) => (
                  <div key={feedback._id} className="feedback-item">
                    <div className="feedback-header">
                      <span className="reviewer-name">{feedback.name}</span>
                      <div className="feedback-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`star ${star <= feedback.rating ? 'filled' : ''}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="feedback-text">{feedback.feedback}</p>
                    <span className="feedback-date">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-feedbacks">No feedback yet. Be the first to review!</p>
            )}
          </section>

          {/* Leave Feedback Form */}
          <section className="feedback-form-section">
            <h3>Leave Your Feedback</h3>
            {successMessage && <div className="success-message">{successMessage}</div>}
            <form onSubmit={handleSubmit} className="feedback-form">
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  required
                />
              </label>

              <label>
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  required
                />
              </label>

              <label>
                Rating (Optional)
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`rating-star ${form.rating >= star ? 'selected' : ''}`}
                      onClick={() => handleRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </label>

              <label>
                Your Feedback
                <textarea
                  name="feedback"
                  value={form.feedback}
                  onChange={handleChange}
                  placeholder="Share your experience with this item..."
                  rows="5"
                  required
                ></textarea>
              </label>

              <button type="submit" disabled={submitting} className="submit-btn">
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
