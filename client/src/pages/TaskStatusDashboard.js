import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const StatusDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    loadTasks();
  }, [token]);

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setMyTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ================= TASK FUNCTIONS =================
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      setMyTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (e) {}
  };

  const handleEditTask = (id) => {
    navigate(`/edit-task/${id}`);
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl text-white font-semibold">
          My Tasks
        </h1>

        {/* POST TASK BUTTON */}
        <button
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          onClick={() => navigate('/post-task')}
        >
          + Post Task
        </button>
      </header>

      {loading && <p className="text-slate-400">Loading...</p>}

      {/* TASK LIST */}
      <div className="grid gap-4">
        {myTasks.map((task) => (
          <div key={task._id} className="bg-slate-900 p-4 rounded-lg shadow">

            <h3 className="text-white font-semibold">
              {task.description}
            </h3>

            <p className="text-gray-300 text-sm mt-1">
              Budget: LKR {task.budget}
            </p>

            <span className="inline-block mt-2 text-xs bg-green-700 px-2 py-1 rounded">
              {task.status}
            </span>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 mt-3 flex-wrap">

              <button
                className="bg-gray-600 px-3 py-1 rounded text-sm"
                onClick={() => navigate(`/tasks?task=${task._id}`)}
              >
                View Offers
              </button>

              <button
                className="bg-yellow-500 px-3 py-1 rounded text-sm"
                onClick={() => handleEditTask(task._id)}
              >
                Edit
              </button>

              <button
                className="bg-red-600 px-3 py-1 rounded text-sm"
                onClick={() => handleDeleteTask(task._id)}
              >
                Delete
              </button>

            </div>
          </div>
        ))}

        {myTasks.length === 0 && (
          <p className="text-slate-400">
            You have not posted any tasks yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default StatusDashboard;