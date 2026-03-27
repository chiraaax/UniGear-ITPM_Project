import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState({
    description: '',
    budget: '',
    deadline: '',
    location: '',
    category: '',
  });
  const [loading, setLoading] = useState(true);

  // LOAD EXISTING DATA
  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    fetch(`${API_BASE}/tasks/my-tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const task = data.find(t => t._id === id);
        if (task) {
          setForm({
            description: task.description || '',
            budget: task.budget || '',
            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
            location: task.location || '',
            category: task.category || '',
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
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
          deadline: form.deadline ? new Date(form.deadline) : undefined,
        }),
      });

      if (res.ok) {
        navigate('/me');
      } else {
        alert('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="module-page-container">
      <h1>Edit Task</h1>

      <form onSubmit={handleUpdate} className="module-form">
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
            <option value="Delivery">Delivery</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Academic">Academic</option>
            <option value="Technical">Technical</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Budget (LKR)
          <input
            type="number"
            min="0"
            name="budget"
            value={form.budget}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Deadline
          <input
            type="datetime-local"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Location
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Main Library, Lab 3B"
            required
          />
        </label>

        <button type="submit">Update Task</button>
      </form>
    </div>
  );
};

export default EditTask;