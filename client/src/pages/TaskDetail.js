import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  User,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, theme } = useAuth();
  const isLight = theme === 'light';

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/tasks/${id}`);
      if (!res.ok) throw new Error('Failed to fetch task');

      const data = await res.json();
      setTask(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleAcceptTask = async () => {
    if (!token) {
      alert('Please login');
      return;
    }

    try {
      setAccepting(true);

      const res = await fetch(`${API_BASE}/tasks/${task._id}/accept`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed');
        return;
      }

      setTask(data);
    } catch (err) {
      alert('Error');
    } finally {
      setAccepting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!task) return <div className="p-6">Task not found</div>;

  const canAccept = task.status === 'Pending';

  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className={`rounded-2xl shadow-xl overflow-hidden ${
        isLight ? 'bg-white' : 'bg-slate-900'
      }`}>

        {/* ✅ IMAGE SECTION */}
        <img
          src={task.image || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d"}
          alt="task"
          className="w-full h-64 object-cover"
        />

        <div className="p-6">

          {/* TITLE */}
          <h1 className="text-3xl font-bold mb-4">
            {task.description}
          </h1>

          {/* STATUS */}
          <span className={`px-4 py-1 rounded-full text-sm font-semibold ${getStatusStyle(task.status)}`}>
            {task.status}
          </span>

          {/* DETAILS GRID */}
          <div className="grid grid-cols-2 gap-6 mt-6">

            <div className="flex items-center gap-2">
              <Tag size={18} />
              <span>{task.category || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign size={18} />
              <span>LKR {task.budget}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{task.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>
                {task.deadline
                  ? new Date(task.deadline).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>

          </div>

          {/* CREATOR */}
          {task.creator && (
            <div className="mt-6 flex items-center gap-3">
              <User />
              <div>
                <p className="font-semibold">{task.creator.name}</p>
                <p className="text-sm text-gray-400">
                  Trust Score: {task.creator.trustScore?.toFixed(1) || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex gap-4 mt-8 flex-wrap">

            <button
              onClick={() => navigate('/micro-tasks')}
              className="flex items-center gap-2 px-5 py-2 border rounded-lg hover:bg-gray-200"
            >
              <ArrowLeft size={18} /> Back
            </button>

            {canAccept && (
              <button
                onClick={handleAcceptTask}
                disabled={accepting}
                className="flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
              >
                <CheckCircle size={18} />
                {accepting ? 'Accepting...' : 'Accept Task'}
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskDetail;