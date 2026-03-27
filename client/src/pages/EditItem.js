import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const EditItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    dailyRate: '',
    category: '',
  });
  const [loading, setLoading] = useState(true);

  // LOAD EXISTING DATA
  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    fetch(`${API_BASE}/rentals/my-items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const item = data.find(i => i._id === id);
        if (item) {
          setForm({
            title: item.title || '',
            description: item.description || '',
            dailyRate: item.dailyRate || '',
            category: item.category || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // UPDATE
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/rentals/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          dailyRate: Number(form.dailyRate),
        }),
      });

      if (res.ok) {
        navigate('/me');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="module-page-container">
      <h1>Edit Rental Item</h1>

      <form onSubmit={handleUpdate} className="module-form">
        <label>
          Title
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Category
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Books">Books</option>
            <option value="Sports">Sports</option>
            <option value="Tools">Tools</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Daily Rate (LKR)
          <input
            type="number"
            min="0"
            name="dailyRate"
            value={form.dailyRate}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit">Update Item</button>
      </form>
    </div>
  );
};

export default EditItem;