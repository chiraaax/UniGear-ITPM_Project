import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const RentalPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    dailyRate: '',
  });

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/rentals/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert('Please sign in to create a rental listing.');
      navigate('/auth');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rentals/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          dailyRate: Number(form.dailyRate),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Failed to create item');
        return;
      }

      setForm({
        title: '',
        description: '',
        category: 'Electronics',
        dailyRate: '',
      });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="module-page-container">
      <h1>UniGear Rental System</h1>
      <p className="module-description">
        Publish item listings and browse gear available from other students. This is your campus
        "goods" engine.
      </p>

      <div className="module-layout">
        <section className="module-section">
          <h2>Create a New Item Listing</h2>
          <form className="module-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleChange} />
            </label>
            <label>
              Category
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="Electronics">Electronics</option>
                <option value="Lab Gear">Lab Gear</option>
                <option value="Sports">Sports</option>
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
            <button type="submit">Publish Listing</button>
          </form>
        </section>

        <section className="module-section">
          <h2>Available Items Near Campus</h2>
          <div className="list-grid">
            {items.map((item) => (
              <div key={item._id} className="list-card">
                <h3>{item.title}</h3>
                <p className="tag">{item.category}</p>
                <p className="muted">LKR {item.dailyRate} / day</p>
                {item.owner && (
                  <p className="muted small">
                    Owner: {item.owner.name} (Trust {item.owner.trustScore?.toFixed(1)})
                  </p>
                )}
              </div>
            ))}
            {items.length === 0 && <p className="muted">No items listed yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RentalPage;

