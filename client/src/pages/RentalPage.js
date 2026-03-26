import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const RentalPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    dailyRate: '',
  });

  const [bookingData, setBookingData] = useState({});
  const [isBooking, setIsBooking] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // 🔥 NEW STATES
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // 🔥 CALENDAR AVAILABILITY STATE
  const [availability, setAvailability] = useState({});
  const [selectedCalendarItem, setSelectedCalendarItem] = useState(null);

  const fetchItems = async () => {
    try {
      const url = categoryFilter
          ? `${API_BASE}/rentals/items?category=${categoryFilter}`
          : `${API_BASE}/rentals/items`;

      const res = await fetch(url);
      const data = await res.json();
      setItems(data);

      // 🔥 fetch availability for each item
      data.forEach(item => {
        fetchAvailability(item._id);
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  // 🔥 FETCH AVAILABILITY
  const fetchAvailability = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/rentals/items/${itemId}/availability`);
      const data = await res.json();

      setAvailability(prev => ({
        ...prev,
        [itemId]: data
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 FIXED: CHECK IF DATE IS BOOKED (timezone fix)
  const isDateBooked = (itemId, date) => {
    const bookings = availability[itemId] || [];

    return bookings.some(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);

      const check = date.toISOString().split('T')[0];
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      return check >= startStr && check <= endStr;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔥 EDIT HANDLER
  const handleEdit = (item) => {
    setEditingItem(item._id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      dailyRate: item.dailyRate,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🔥 DELETE HANDLER
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`${API_BASE}/rentals/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert('Item deleted successfully ✅');
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingChange = (itemId, field, value) => {
    setBookingData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleBooking = async (itemId) => {
    if (!token) {
      alert('Please login first');
      navigate('/auth');
      return;
    }

    const data = bookingData[itemId];

    if (!data?.startDate || !data?.endDate) {
      alert('Please select dates');
      return;
    }

    setIsBooking(itemId);

    try {
      const res = await fetch(`${API_BASE}/rentals/items/${itemId}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message);
        setIsBooking(null);
        return;
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setBookingData(prev => ({
        ...prev,
        [itemId]: { startDate: '', endDate: '' }
      }));
      setIsBooking(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setIsBooking(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert('Please sign in to create a rental listing.');
      navigate('/auth');
      return;
    }

    try {
      const url = editingItem
          ? `${API_BASE}/rentals/items/${editingItem}`
          : `${API_BASE}/rentals/items`;

      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
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

      setEditingItem(null);
      fetchItems();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Electronics': return '⚡';
      case 'Lab Gear': return '🔬';
      case 'Sports': return '⚽';
      default: return '📦';
    }
  };

  return (
      <div className="module-page-container">
        {showSuccess && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '999px',
              fontSize: '0.9rem',
              fontWeight: '500',
              zIndex: 1000,
              animation: 'slideIn 0.3s ease-out',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              {editingItem ? '✓ Item updated successfully!' : '✓ Booking successful!'}
            </div>
        )}

        <h1>UniGear Rental System</h1>
        <p className="module-description">
          Publish item listings and browse gear available from other students.
        </p>

        <div className="module-layout">
          {/* CREATE/EDIT ITEM SECTION */}
          <section className="module-section">
            <h2>
              {editingItem ? 'Edit Item Listing' : 'Create a New Item Listing'}
            </h2>
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

              <button type="submit">
                {editingItem ? 'Update Item' : 'Publish Listing'}
              </button>

              {editingItem && (
                  <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setForm({
                          title: '',
                          description: '',
                          category: 'Electronics',
                          dailyRate: '',
                        });
                      }}
                      style={{
                        marginTop: '0.5rem',
                        background: 'rgba(100, 116, 139, 0.3)',
                        border: '1px solid rgba(148, 163, 184, 0.3)'
                      }}
                  >
                    Cancel Edit
                  </button>
              )}
            </form>
          </section>

          {/* ENHANCED ITEM LIST WITH FILTER */}
          <section className="module-section">
            <h2>Available Items Near Campus</h2>

            {/* 🔥 CATEGORY FILTER */}
            <div className="filter-section">
              <label className="filter-label">
                Filter by category:
                <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Lab Gear">Lab Gear</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            {/* 🔥 GLOBAL CALENDAR - ADDED HERE */}
            {selectedCalendarItem && (
                <div className="global-calendar-section">
                  <h3 style={{ marginBottom: '10px', color: '#e5e7eb' }}>
                    Availability for: {selectedCalendarItem.title}
                  </h3>

                  <Calendar
                      tileDisabled={({ date }) =>
                          isDateBooked(selectedCalendarItem._id, date)
                      }
                      tileClassName={({ date }) =>
                          isDateBooked(selectedCalendarItem._id, date)
                              ? 'booked-date'
                              : null
                      }
                      minDate={new Date()}
                  />

                  <p className="calendar-legend">
                    🔴 Booked dates
                  </p>

                  <button
                      onClick={() => setSelectedCalendarItem(null)}
                      className="calendar-toggle"
                      style={{ marginTop: '10px' }}
                  >
                    Close Calendar
                  </button>
                </div>
            )}

            <div className="list-grid-enhanced">
              {items.map((item) => {
                const bookingInfo = bookingData[item._id];
                const days = calculateDays(bookingInfo?.startDate, bookingInfo?.endDate);
                const totalPrice = days ? days * item.dailyRate : null;
                const isOwner = token && item.owner && user && item.owner._id === user._id;

                return (
                    <div key={item._id} className="list-card-enhanced">
                      <div className="card-header">
                        <div className="item-title-section">
                          <span className="item-icon">{getCategoryIcon(item.category)}</span>
                          <h3>{item.title}</h3>
                        </div>
                        <span className="category-badge">{item.category}</span>
                      </div>

                      {item.description && (
                          <p className="item-description">{item.description}</p>
                      )}

                      <div className="price-section">
                        <div className="daily-rate-enhanced">
                          <span className="currency-symbol">LKR</span>
                          <span className="rate-value">{item.dailyRate}</span>
                          <span className="rate-period">/day</span>
                        </div>
                      </div>

                      {item.owner && (
                          <div className="owner-section">
                            <div className="owner-avatar">
                              {item.owner.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="owner-details">
                              <span className="owner-name">{item.owner.name}</span>
                              <div className="trust-score">
                                <span className="trust-star">⭐</span>
                                <span>Trust {item.owner.trustScore?.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                      )}

                      {/* 🔥 UPDATED CALENDAR BUTTON */}
                      <div className="calendar-section">
                        <button
                            className="calendar-toggle"
                            onClick={() =>
                                setSelectedCalendarItem(
                                    selectedCalendarItem?._id === item._id ? null : item
                                )
                            }
                        >
                          📅 {selectedCalendarItem?._id === item._id ? 'Hide' : 'View'} Availability
                        </button>
                      </div>

                      {/* 🔥 OWNER CONTROLS */}
                      {isOwner && (
                          <div className="owner-controls">
                            <button
                                onClick={() => handleEdit(item)}
                                className="edit-button"
                            >
                              ✏️ Edit
                            </button>
                            <button
                                onClick={() => handleDelete(item._id)}
                                className="delete-button"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                      )}

                      {/* Only show booking section if user is not the owner */}
                      {!isOwner && (
                          <div className="booking-section-enhanced">
                            <div className="date-inputs">
                              <div className="date-input-wrapper">
                                <span className="date-icon">📅</span>
                                <input
                                    type="date"
                                    className="date-input-enhanced"
                                    value={bookingInfo?.startDate || ''}
                                    onChange={(e) =>
                                        handleBookingChange(item._id, 'startDate', e.target.value)
                                    }
                                    placeholder="Start date"
                                />
                              </div>
                              <div className="date-arrow">→</div>
                              <div className="date-input-wrapper">
                                <span className="date-icon">📅</span>
                                <input
                                    type="date"
                                    className="date-input-enhanced"
                                    value={bookingInfo?.endDate || ''}
                                    onChange={(e) =>
                                        handleBookingChange(item._id, 'endDate', e.target.value)
                                    }
                                    placeholder="End date"
                                />
                              </div>
                            </div>

                            {days && totalPrice && (
                                <div className="price-summary">
                                  <div className="summary-details">
                                    <span>📆 {days} day{days !== 1 ? 's' : ''}</span>
                                    <span className="summary-total">💰 LKR {totalPrice}</span>
                                  </div>
                                </div>
                            )}

                            <button
                                onClick={() => handleBooking(item._id)}
                                className={`book-button ${isBooking === item._id ? 'booking' : ''}`}
                                disabled={isBooking === item._id}
                            >
                              {isBooking === item._id ? (
                                  <>
                                    <span className="spinner"></span>
                                    Processing...
                                  </>
                              ) : (
                                  '📖 Book Now'
                              )}
                            </button>
                          </div>
                      )}
                    </div>
                );
              })}

              {items.length === 0 && (
                  <div className="empty-state-enhanced">
                    <div className="empty-icon">📭</div>
                    <p>No items listed yet.</p>
                    <p className="empty-subtitle">Be the first to share your gear!</p>
                  </div>
              )}
            </div>
          </section>
        </div>

        <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-section {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: #e5e7eb;
          font-weight: 500;
        }

        .filter-select {
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.5);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #4f46e5;
          background: rgba(15, 23, 42, 0.95);
        }

        .global-calendar-section {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.85);
          border-radius: 1rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .owner-controls {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
        }

        .edit-button, .delete-button {
          flex: 1;
          padding: 0.5rem;
          border-radius: 0.75rem;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .edit-button {
          background: linear-gradient(135deg, #4f46e5, #3b82f6);
          color: white;
        }

        .edit-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .delete-button {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
        }

        .delete-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .list-grid-enhanced {
          display: grid;
          gap: 1rem;
          max-height: 560px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .list-grid-enhanced::-webkit-scrollbar {
          width: 6px;
        }

        .list-grid-enhanced::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }

        .list-grid-enhanced::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 10px;
        }

        .list-grid-enhanced::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }

        .list-card-enhanced {
          background: radial-gradient(circle at top left, rgba(30, 64, 175, 0.5), rgba(15, 23, 42, 0.98));
          border-radius: 1.2rem;
          padding: 1.2rem;
          border: 1px solid rgba(148, 163, 184, 0.4);
          transition: all 0.3s ease;
          animation: fadeInUp 0.3s ease-out;
        }

        .list-card-enhanced:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.6);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .item-title-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .item-icon {
          font-size: 1.5rem;
        }

        .list-card-enhanced h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #f9fafb;
        }

        .category-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.7rem;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(34, 197, 94, 0.2));
          color: #bfdbfe;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.3px;
          border: 1px solid rgba(96, 165, 250, 0.3);
        }

        .item-description {
          font-size: 0.85rem;
          color: #cbd5f5;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .price-section {
          margin-bottom: 0.75rem;
          padding: 0.5rem 0;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .daily-rate-enhanced {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .currency-symbol {
          font-size: 0.85rem;
          color: #9ca3af;
        }

        .rate-value {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #bfdbfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .rate-period {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-left: 0.25rem;
        }

        .owner-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 0.75rem;
        }

        .owner-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #4f46e5, #22c55e);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          color: white;
        }

        .owner-details {
          flex: 1;
        }

        .owner-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: #e5e7eb;
          display: block;
        }

        .trust-score {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          color: #fbbf24;
          margin-top: 0.2rem;
        }

        .trust-star {
          font-size: 0.65rem;
        }

        .calendar-section {
          margin: 0.75rem 0;
        }

        .calendar-toggle {
          width: 100%;
          padding: 0.5rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(96, 165, 250, 0.4);
          background: rgba(79, 70, 229, 0.2);
          color: #e5e7eb;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .calendar-toggle:hover {
          background: rgba(79, 70, 229, 0.3);
          border-color: rgba(96, 165, 250, 0.6);
        }

        .global-calendar-section .react-calendar {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 0.75rem;
          padding: 0.5rem;
          width: 100%;
          color: #e5e7eb;
        }

        .global-calendar-section .react-calendar__navigation button {
          color: #e5e7eb;
        }

        .global-calendar-section .react-calendar__navigation button:enabled:hover,
        .global-calendar-section .react-calendar__navigation button:enabled:focus {
          background-color: rgba(79, 70, 229, 0.3);
        }

        .global-calendar-section .react-calendar__month-view__weekdays {
          color: #9ca3af;
        }

        .global-calendar-section .react-calendar__month-view__days__day {
          color: #e5e7eb;
        }

        .global-calendar-section .react-calendar__tile {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .global-calendar-section .react-calendar__tile:enabled:hover,
        .global-calendar-section .react-calendar__tile:enabled:focus {
          background-color: rgba(79, 70, 229, 0.5);
        }

        .global-calendar-section .react-calendar__tile--now {
          background: rgba(34, 197, 94, 0.3);
        }

        .global-calendar-section .react-calendar__tile--active {
          background: #4f46e5 !important;
        }

        .booked-date {
          background: #ef4444 !important;
          color: white !important;
          border-radius: 0.5rem;
          text-decoration: line-through;
        }

        .calendar-legend {
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: #9ca3af;
          text-align: center;
        }

        .booking-section-enhanced {
          margin-top: 0.5rem;
        }

        .date-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .date-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .date-icon {
          position: absolute;
          left: 8px;
          font-size: 0.8rem;
          pointer-events: none;
        }

        .date-input-enhanced {
          width: 100%;
          padding: 0.5rem 0.5rem 0.5rem 28px;
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.5);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .date-input-enhanced:focus {
          outline: none;
          border-color: #4f46e5;
          background: rgba(15, 23, 42, 0.95);
        }

        .date-input-enhanced::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }

        .date-arrow {
          color: #9ca3af;
          font-size: 1rem;
        }

        .price-summary {
          background: rgba(34, 197, 94, 0.1);
          border-radius: 0.75rem;
          padding: 0.5rem;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .summary-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
        }

        .summary-total {
          font-weight: 600;
          color: #22c55e;
        }

        .book-button {
          width: 100%;
          padding: 0.6rem;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #4f46e5, #22c55e);
          color: #f9fafb;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .book-button:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.05);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .book-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .book-button.booking {
          background: linear-gradient(135deg, #6b7280, #4b5563);
        }

        .spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state-enhanced {
          text-align: center;
          padding: 3rem;
          background: radial-gradient(circle at top left, rgba(30, 64, 175, 0.3), rgba(15, 23, 42, 0.96));
          border-radius: 1.2rem;
          border: 1px solid rgba(148, 163, 184, 0.4);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .empty-state-enhanced p {
          margin: 0;
          color: #9ca3af;
        }

        .empty-subtitle {
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }
      `}</style>
      </div>
  );
};

export default RentalPage;