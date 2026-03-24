import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const StatusDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [meRes, itemsRes, tasksRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/users/me`, { headers }),
        fetch(`${API_BASE}/rentals/my-items`, { headers }),
        fetch(`${API_BASE}/tasks/my-tasks`, { headers }),
        fetch(`${API_BASE}/transactions`, { headers }),
      ]);

      const [me, items, tasks, txs] = await Promise.all([
        meRes.json(),
        itemsRes.json(),
        tasksRes.json(),
        txRes.json(),
      ]);

      setProfile(me);
      setMyItems(Array.isArray(items) ? items : []);
      setMyTasks(Array.isArray(tasks) ? tasks : []);
      setTransactions(Array.isArray(txs) ? txs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ================= ITEM FUNCTIONS =================
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;

    await fetch(`${API_BASE}/rentals/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    setMyItems((prev) => prev.filter((i) => i._id !== id));
  };

  const handleEditItem = (id) => {
    navigate(`/edit-item/${id}`);
  };

  // ================= TASK FUNCTIONS =================
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;

    await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    setMyTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const handleEditTask = (id) => {
    navigate(`/edit-task/${id}`);
  };

  // ================= TRANSACTION FUNCTIONS =================
  const handleConfirm = async (txId) => {
    await fetch(`${API_BASE}/transactions/${txId}/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    loadData();
  };

  const handleMarkCompleted = async (tx) => {
    await fetch(`${API_BASE}/transactions/${tx._id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Completed' }),
    });
    loadData();
  };

  const handleRate = async (txId, rating) => {
    await fetch(`${API_BASE}/transactions/${txId}/rate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ rating }),
    });
    loadData();
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-white font-bold">My Dashboard</h1>

        <div className="flex gap-2">
          <button
            className="bg-green-500 px-4 py-2 rounded text-white"
            onClick={() => navigate('/add-item')}
          >
            + Add Item
          </button>

          <button
            className="bg-blue-500 px-4 py-2 rounded text-white"
            onClick={() => navigate('/post-task')}
          >
            + Post Task
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}

      {/* ITEMS */}
      <h2 className="text-white mt-4">My Items</h2>
      <div className="grid gap-3">
        {myItems.map((item) => (
          <div key={item._id} className="bg-slate-800 p-3 rounded">
            <h3 className="text-white">{item.title}</h3>
            <p className="text-gray-300">LKR {item.dailyRate}</p>

            <div className="flex gap-2 mt-2">
              <button
                className="bg-yellow-500 px-2 py-1 rounded"
                onClick={() => handleEditItem(item._id)}
              >
                Edit
              </button>

              <button
                className="bg-red-500 px-2 py-1 rounded"
                onClick={() => handleDeleteItem(item._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TASKS */}
      <h2 className="text-white mt-6">My Tasks</h2>
      <div className="grid gap-3">
        {myTasks.map((task) => (
          <div key={task._id} className="bg-slate-800 p-3 rounded">
            <h3 className="text-white">{task.description}</h3>
            <p className="text-gray-300">Budget: LKR {task.budget}</p>

            <div className="flex gap-2 mt-2">
              <button
                className="bg-yellow-500 px-2 py-1 rounded"
                onClick={() => handleEditTask(task._id)}
              >
                Edit
              </button>

              <button
                className="bg-red-500 px-2 py-1 rounded"
                onClick={() => handleDeleteTask(task._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TRANSACTIONS */}
      <h2 className="text-white mt-6">Transactions</h2>
      <div className="grid gap-3">
        {transactions.map((tx) => {
          const bothConfirmed = tx.ownerConfirmed && tx.counterpartyConfirmed;

          return (
            <div key={tx._id} className="bg-slate-800 p-3 rounded">
              <p className="text-white">Status: {tx.status}</p>

              {!bothConfirmed && (
                <button
                  className="bg-blue-500 px-2 py-1 mt-2 rounded"
                  onClick={() => handleConfirm(tx._id)}
                >
                  Confirm
                </button>
              )}

              {bothConfirmed && tx.status !== 'Completed' && (
                <button
                  className="bg-green-500 px-2 py-1 mt-2 rounded"
                  onClick={() => handleMarkCompleted(tx)}
                >
                  Complete
                </button>
              )}

              {tx.status === 'Completed' && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      className="bg-gray-600 px-2"
                      onClick={() => handleRate(tx._id, r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusDashboard;