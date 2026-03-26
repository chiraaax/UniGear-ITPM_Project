import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRating = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.feedback || form.rating === 0) {
      setError('Please fill all fields and select a rating.');
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
      const color = rating === 1 ? 'text-red-500' : 'text-yellow-500';
      return (
        <button
          key={starNumber}
          type="button"
          onClick={onClick ? () => onClick(starNumber) : undefined}
          disabled={!onClick}
          className={`text-lg ${isSelected ? color : 'text-gray-400'} ${onClick ? 'hover:text-yellow-500' : ''}`}
        >
          ★
        </button>
      );
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-50">Share Your Feedback</h1>
        <Link
          to="/feedbacks"
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-slate-600 transition"
        >
          View Feedback Display
        </Link>
      </div>
      <div className="mb-8 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-50">Share Your Feedback</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-50 focus:border-sky-400 focus:outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-50 focus:border-sky-400 focus:outline-none"
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-50 focus:border-sky-400 focus:outline-none"
              placeholder="+94712345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Feedback</label>
            <textarea
              name="feedback"
              value={form.feedback}
              onChange={handleChange}
              rows="4"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-50 focus:border-sky-400 focus:outline-none"
              placeholder="Tell us what you think..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Rating</label>
            <div className="mt-1 flex space-x-1">
              {renderStars(form.rating, handleRating)}
            </div>
          </div>
          {error && <p className="text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 py-2 font-medium text-slate-950 hover:bg-sky-400 focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      {token && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => {
              const newShowState = !showFeedbacks;
              setShowFeedbacks(newShowState);
              if (newShowState && feedbacks.length === 0) {
                fetchFeedbacks();
              }
            }}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-500 focus:outline-none"
          >
            {showFeedbacks ? 'Hide Feedbacks' : 'View All Feedbacks'}
          </button>
        </div>
      )}

      {token && showFeedbacks && (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-slate-50">All Feedback</h2>
          {feedbacks.length === 0 ? (
            <p className="text-slate-400">No feedback yet.</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div key={fb._id} className="rounded-lg border border-slate-600 bg-slate-800 p-4">
                  {editingId === fb._id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-50"
                      />
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-50"
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditChange}
                        className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-50"
                      />
                      <textarea
                        name="feedback"
                        value={editForm.feedback}
                        onChange={handleEditChange}
                        rows="3"
                        className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-50"
                      />
                      <div className="flex space-x-1">
                        {renderStars(editForm.rating, handleEditRating)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdate}
                          className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-50">{fb.name}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(fb)}
                            className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(fb._id)}
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">{fb.email}</p>
                      <p className="text-sm text-slate-400">{fb.phone}</p>
                      <p className="mt-2 text-slate-300">{fb.feedback}</p>
                      <div className="mt-2 flex items-center space-x-1">
                        {renderStars(fb.rating)}
                        <span className="text-sm text-slate-400">({fb.rating}/5)</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;