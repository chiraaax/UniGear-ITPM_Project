import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FeedbackPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    feedback: '',
    rating: 0,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRating = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.feedback || form.rating === 0) {
      setError('Please fill all fields and select a rating.');
      return;
    }
    // For now, just log the feedback
    console.log('Feedback submitted:', form);
    alert('Thank you for your feedback!');
    navigate('/');
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      const isSelected = starNumber <= form.rating;
      const color = form.rating === 1 ? 'text-red-500' : 'text-yellow-500';
      return (
        <button
          key={starNumber}
          type="button"
          onClick={() => handleRating(starNumber)}
          className={`text-2xl ${isSelected ? color : 'text-gray-400'} hover:text-yellow-500`}
        >
          ★
        </button>
      );
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 shadow-xl">
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
              {renderStars()}
            </div>
          </div>
          {error && <p className="text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-sky-500 py-2 font-medium text-slate-950 hover:bg-sky-400 focus:outline-none"
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;