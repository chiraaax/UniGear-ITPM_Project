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
  const [notification, setNotification] = useState(null);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ================= ITEM =================
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;

    try {
      const res = await fetch(`${API_BASE}/rentals/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!res.ok) throw new Error('Failed to delete item');

      setMyItems((prev) => prev.filter((i) => i._id !== id));
      showNotification('✅ Item deleted successfully', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('❌ Failed to delete item', 'error');
    }
  };

  const handleEditItem = (id) => {
    navigate(`/edit-item/${id}`);
  };

  // ================= TASK =================
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!res.ok) throw new Error('Failed to delete task');

      setMyTasks((prev) => prev.filter((t) => t._id !== id));
      showNotification('✅ Task deleted successfully', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('❌ Failed to delete task', 'error');
    }
  };

  const handleEditTask = (id) => {
    navigate(`/edit-task/${id}`);
  };

  // TRANSACTIONS 
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
    <div className="mx-auto max-w-7xl px-2 py-8 md:px-4 md:py-10">
      
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold shadow-lg z-50 animate-pulse ${
          notification.type === 'success' 
            ? 'bg-green-500' 
            : 'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            My UniGear activity
          </h1>
          <p className="text-sm text-slate-300">
            Track your listings, tasks, and handovers.
          </p>
        </div>

        {/* ADD BUTTONS */}
        <div className="flex gap-2">
          <button
            className="small-action bg-green-600"
            onClick={() => navigate('/add-item')}
          >
            + Add Item
          </button>

          <button
            className="small-action bg-blue-600"
            onClick={() => navigate('/post-task')}
          >
            + Post Task
          </button>
        </div>

        {profile && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-3 py-2 text-xs">
            <div>
              <div className="text-slate-100">{profile.name}</div>
              <div className="text-slate-400">{profile.email}</div>
            </div>
            <div className="ml-2 text-emerald-300">
              {profile.trustScore?.toFixed(2)}
            </div>
          </div>
        )}
      </header>

      {loading && <p className="text-slate-400">Loading...</p>}

      <div className="grid gap-6 md:grid-cols-2">

        {/* ITEMS */}
        <section>
          <h2 className="text-slate-200">My rental listings</h2>

          {myItems.map((item) => (
            <div key={item._id} className="bg-slate-900 p-3 rounded mt-2">
              <h3 className="text-white">{item.title}</h3>
              <p className="text-gray-300">LKR {item.dailyRate}</p>

              <div className="flex gap-2 mt-2">
                <button
                  className="small-action bg-yellow-600"
                  onClick={() => handleEditItem(item._id)}
                >
                  Edit
                </button>

                <button
                  className="small-action bg-red-600"
                  onClick={() => handleDeleteItem(item._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {myItems.length === 0 && (
            <p className="text-slate-400">No items yet</p>
          )}
        </section>

        {/* TASKS */}
        <section>
          <h2 className="text-slate-200">My tasks</h2>

          {myTasks.map((task) => (
            <div key={task._id} className="bg-slate-900 p-3 rounded mt-2">
              <h3 className="text-white">{task.description}</h3>
              <p className="text-gray-300">Budget: LKR {task.budget}</p>

              <div className="flex gap-2 mt-2 flex-wrap">
                <button
                  className="small-action"
                  onClick={() => navigate(`/tasks?task=${task._id}`)}
                >
                  View
                </button>

                <button
                  className="small-action bg-yellow-600"
                  onClick={() => handleEditTask(task._id)}
                >
                  Edit
                </button>

                <button
                  className="small-action bg-red-600"
                  onClick={() => handleDeleteTask(task._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {myTasks.length === 0 && (
            <p className="text-slate-400">No tasks yet</p>
          )}
        </section>
      </div>

      {/* TRANSACTIONS */}
      <section className="mt-6">
        <h2 className="text-slate-200">Transactions</h2>

        {transactions.map((tx) => {
          const bothConfirmed = tx.ownerConfirmed && tx.counterpartyConfirmed;

          return (
            <div key={tx._id} className="bg-slate-900 p-3 rounded mt-2">
              <p className="text-white">Status: {tx.status}</p>

              {!bothConfirmed && (
                <button
                  className="small-action mt-2"
                  onClick={() => handleConfirm(tx._id)}
                >
                  Confirm
                </button>
              )}

              {bothConfirmed && tx.status !== 'Completed' && (
                <button
                  className="small-action bg-green-600 mt-2"
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
                      className="small-action"
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

        {transactions.length === 0 && (
          <p className="text-slate-400">No transactions yet</p>
        )}
      </section>
    </div>
  );
};

export default StatusDashboard;