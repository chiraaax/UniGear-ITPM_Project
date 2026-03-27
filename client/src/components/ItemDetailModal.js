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
  const [errors, setErrors] = useState({});

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
    let processedValue = value;
    let newErrors = { ...errors };

    // Phone number validation: only allow digits, max 10 characters
    if (name === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      if (processedValue.length > 0 && processedValue.length < 10) {
        newErrors.phone = `Phone number must be exactly 10 digits (${processedValue.length}/10)`;
      } else if (processedValue.length === 10) {
        newErrors.phone = '';
      } else {
        newErrors.phone = '';
      }
    }

    // Email validation
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@gmail\.com$/;
      if (value && !emailRegex.test(value)) {
        newErrors.email = 'Please enter a valid Gmail address (example@gmail.com)';
      } else {
        newErrors.email = '';
      }
    }

    setErrors(newErrors);
    setForm((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleRating = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Validate name
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'Please enter a valid Gmail address (example@gmail.com)';
    }

    // Validate phone
    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (form.phone.length !== 10 || isNaN(form.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Validate feedback
    if (!form.feedback.trim()) {
      newErrors.feedback = 'Feedback is required';
    }

    setErrors(newErrors);

    // Stop if there are validation errors
    if (Object.keys(newErrors).length > 0) {
      alert('Please fix all errors before submitting');
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
        setErrors({});
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
                  className={errors.name ? 'error' : ''}
                  required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </label>

              <label>
                Email (Gmail only)
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  className={errors.email ? 'error' : ''}
                  required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </label>

              <label>
                Phone (10 digits only)
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="1234567890"
                  maxLength="10"
                  className={errors.phone ? 'error' : ''}
                  required
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
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
                  className={errors.feedback ? 'error' : ''}
                  required
                ></textarea>
                {errors.feedback && <span className="error-message">{errors.feedback}</span>}
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
