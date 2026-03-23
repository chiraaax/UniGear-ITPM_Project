import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Feedback = ({ itemId }) => {
  const [feedback, setFeedback] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/feedback/item/${itemId}`);
      setFeedback(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch feedback.');
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (itemId) fetchFeedback();
  }, [itemId, fetchFeedback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/feedback',
        { item: itemId, rating, comment },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
        }
      );
      setRating(5);
      setComment('');
      fetchFeedback();
    } catch (err) {
      setError('Failed to submit feedback.');
    }
  };

  return (
    <div className="mt-10 max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6 border">
      
      <h3 className="text-3xl font-bold mb-6 text-gray-800 text-center">
         Feedback
      </h3>

      {error && (
        <p className="text-red-500 bg-red-100 p-2 rounded mb-4 text-center">
          {error}
        </p>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-5 mb-8">
        
        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Rating
          </label>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full p-2 border rounded-lg shadow-sm text-black bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            <option value="5" className="text-black"> Excellent</option>
            <option value="4" className="text-black"> Good</option>
            <option value="3" className="text-black"> Average</option>
            <option value="2" className="text-black"> Fair</option>
            <option value="1" className="text-black"> Poor</option>
          </select>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Comment
          </label>
          <textarea
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            placeholder="Write your feedback..."
            className="w-full p-3 border rounded-lg shadow-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
        >
          Submit Feedback
        </button>
      </form>

      {/* FEEDBACK LIST */}
      {loading ? (
        <p className="text-center text-gray-500">Loading feedback...</p>
      ) : (
        <div className="space-y-4">
          {feedback.length > 0 ? (
            feedback.map((fb) => (
              <div
                key={fb._id}
                className="p-4 border rounded-xl shadow-sm hover:shadow-md transition duration-300 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-gray-800">
                    {fb.user.name}
                  </p>
                  <div className="text-yellow-400 text-lg">
                    {'★'.repeat(fb.rating)}
                    <span className="text-gray-300">
                      {'★'.repeat(5 - fb.rating)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700">{fb.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No feedback yet for this item.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Feedback;