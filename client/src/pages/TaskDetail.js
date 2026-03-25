import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTask();
  }, [id]);

  // ✅ Fetch task (using single task endpoint)
  const fetchTask = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/tasks/${id}`);
      if (!res.ok) throw new Error('Failed to fetch task');

      const task = await res.json();
      setTask(task);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

 // ✅ Accept Task
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
      alert(data.message || 'Failed to accept task');
      return;
    }

    // ✅ IMPORTANT: update UI from backend response
    setTask(data);

  } catch (err) {
    console.error(err);
    alert('Error accepting task');
  } finally {
    setAccepting(false);
  }
};

  // ✅ Status color styles
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

  // ✅ Loading / Error UI
  if (loading) return <div className="p-6 text-center">Loading task...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!task) return <div className="p-6 text-center">Task not found</div>;

  const isCreator = user && task.creator && user._id === task.creator._id;
  const canAccept = true && task.status === 'Pending';

  return (
    <div className="max-w-2xl mx-auto p-6 ">
      <div className="bg-white shadow-lg rounded-lg p-6 bg-gray-500 text-white">

        {/* Title */}
        <h1 className="text-2xl font-bold mb-4 bg-white text-black">{task.description}</h1>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-black">

          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-semibold">{task.category || 'N/A'}</p>
          </div>

          <div>
            <p className="text-gray-500">Budget</p>
            <p className="font-semibold text-green-600">
              LKR {task.budget || 0}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-semibold">{task.location || 'N/A'}</p>
          </div>

          <div>
            <p className="text-gray-500">Deadline</p>
            <p className="font-semibold">
              {task.deadline
                ? new Date(task.deadline).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>

        </div>

        {/* Status */}
        <div className="mb-6">
          <p className="text-gray-500 mb-1">Status</p>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyle(task.status)}`}>
            {task.status}
          </span>
        </div>

        {/* Creator */}
        {task.creator && (
          <div className="mb-6">
            <p className="text-gray-500">Posted by</p>
            <p className="font-semibold">{task.creator.name}</p>
            <p className="text-sm text-gray-400">
              Trust Score: {task.creator.trustScore?.toFixed(1) || 'N/A'}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 flex-wrap " >

          <button
            onClick={() => navigate('/micro-tasks')}
            className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>

          {/* ✅ Accept Task Button */}
          {canAccept && (
            <button
              onClick={handleAcceptTask}
              disabled={accepting || task.status === 'In Progress'}
              className="bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            > Accept Task
              {accepting
                ? 'Accepting...'
                : task.status === 'In Progress'
                ? 'In Progress'
                : 'Accept Task'}
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

export default TaskDetail;