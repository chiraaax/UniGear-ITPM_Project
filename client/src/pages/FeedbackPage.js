import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/FeedbackPage.css';

const FeedbackPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    feedback: '',
    rating: 0,
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const { token } = useAuth();

  const fetchFeedbacks = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchFeedbacks();
    }
  }, [token, fetchFeedbacks]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    let newErrors = { ...errors };

    // Phone number validation: only allow digits, max 10 characters
    if (name === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      if (processedValue.length > 0 && processedValue.length < 10) {
        newErrors.phone = `Phone number must be exactly 10 digits (${processedValue.length}/10)`;
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

    if (!form.name.trim()) newErrors.name = 'Name is required';
    
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'Please enter a valid Gmail address (example@gmail.com)';
    }

    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (form.phone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (!form.feedback.trim()) newErrors.feedback = 'Feedback is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setError('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        alert('Thank you for your feedback! You will receive an SMS confirmation shortly.');
        setForm({ name: '', email: '', phone: '', feedback: '', rating: 0 });
        setErrors({});
        setError('');
        if (token) fetchFeedbacks();
      } else {
        setError('Failed to submit feedback');
      }
    } catch (err) {
      setError('Error submitting feedback');
    }
    setLoading(false);
  };

  const handleEdit = (feedback) => {
    setEditingId(feedback._id);
    setEditForm({ ...feedback });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditRating = (rating) => {
    setEditForm((prev) => ({ ...prev, rating }));
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/feedback/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        setEditingId(null);
        fetchFeedbacks();
      } else {
        alert('Failed to update feedback');
      }
    } catch (err) {
      alert('Error updating feedback');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchFeedbacks();
      } else {
        alert('Failed to delete feedback');
      }
    } catch (err) {
      alert('Error deleting feedback');
    }
  };

  const renderStars = (rating, onClick = null) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      const isSelected = starNumber <= rating;
      return (
        <button
          key={starNumber}
          type="button"
          onClick={onClick ? () => onClick(starNumber) : undefined}
          disabled={!onClick}
          className={`feedback-star-btn ${isSelected ? 'selected' : ''}`}
        >
          ★
        </button>
      );
    });
  };

  return (
    <div className="feedback-wrapper">
      <div className="feedback-container">
        <div className="feedback-header">
          <div className="feedback-header-top">
            <h1 className="feedback-title">Share Your Feedback</h1>
            <Link to="/feedbacks" className="feedback-btn-link">
              View Feedback Display
            </Link>
          </div>
        </div>

        <div className="feedback-form-wrapper">
          <h2 className="feedback-form-title">Tell Us Your Experience</h2>
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-field">
              <label className="feedback-label">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`feedback-input ${errors.name ? 'error' : ''}`}
                placeholder="Your name"
              />
              {errors.name && <p className="feedback-error">{errors.name}</p>}
            </div>
            <div className="feedback-field">
              <label className="feedback-label">Email (Gmail only)</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`feedback-input ${errors.email ? 'error' : ''}`}
                placeholder="example@gmail.com"
              />
              {errors.email && <p className="feedback-error">{errors.email}</p>}
            </div>
            <div className="feedback-field">
              <label className="feedback-label">Phone Number (10 digits only)</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength="10"
                className={`feedback-input ${errors.phone ? 'error' : ''}`}
                placeholder="1234567890"
              />
              {errors.phone && <p className="feedback-error">{errors.phone}</p>}
            </div>
            <div className="feedback-field">
              <label className="feedback-label">Feedback</label>
              <textarea
                name="feedback"
                value={form.feedback}
                onChange={handleChange}
                rows="4"
                className={`feedback-textarea ${errors.feedback ? 'error' : ''}`}
                placeholder="Tell us what you think..."
              />
              {errors.feedback && <p className="feedback-error">{errors.feedback}</p>}
            </div>
            <div className="feedback-rating-section">
              <label className="feedback-rating-label">Rating (Optional)</label>
              <div className="feedback-star-selector">
                {renderStars(form.rating, handleRating)}
              </div>
            </div>
            {error && <div className="feedback-error-message">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="feedback-submit-btn"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        {token && (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              onClick={() => {
                const newShowState = !showFeedbacks;
                setShowFeedbacks(newShowState);
                if (newShowState && feedbacks.length === 0) {
                  fetchFeedbacks();
                }
              }}
              className="feedback-view-btn"
            >
              {showFeedbacks ? 'Hide Feedbacks' : 'View All Feedbacks'}
            </button>
          </div>
        )}

        {token && showFeedbacks && (
          <div className="feedback-list-wrapper">
            <h2 className="feedback-list-title">All Feedback</h2>
            {feedbacks.length === 0 ? (
              <p className="feedback-list-empty">No feedback yet.</p>
            ) : (
              <div className="feedback-list">
                {feedbacks.map((fb) => (
                  <div key={fb._id} className="feedback-item">
                    {editingId === fb._id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          className="feedback-input"
                        />
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleEditChange}
                          className="feedback-input"
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={editForm.phone}
                          onChange={handleEditChange}
                          className="feedback-input"
                        />
                        <textarea
                          name="feedback"
                          value={editForm.feedback}
                          onChange={handleEditChange}
                          rows="3"
                          className="feedback-textarea"
                        />
                        <div className="feedback-star-selector" style={{ marginTop: '10px' }}>
                          {renderStars(editForm.rating, handleEditRating)}
                        </div>
                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                          <button
                            onClick={handleUpdate}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#718096',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <p className="feedback-item-name">{fb.name}</p>
                            <p className="feedback-item-email">{fb.email}</p>
                            {fb.rating && <p className="feedback-item-rating">★ {fb.rating}/5</p>}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(fb)}
                              style={{
                                padding: '6px 12px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(fb._id)}
                              style={{
                                padding: '6px 12px',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="feedback-item-text">{fb.feedback}</p>
                        <p className="feedback-item-date">{new Date(fb.createdAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;