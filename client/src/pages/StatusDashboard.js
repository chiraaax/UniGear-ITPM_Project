import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  ClipboardList,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const StatusDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    async function load() {
      try {
        const [meRes, itemsRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE}/users/me`, { headers }),
          fetch(`${API_BASE}/rentals/my-items`, { headers }),
          fetch(`${API_BASE}/tasks/my-tasks`, { headers }),
        ]);

        const [me, items, tasks] = await Promise.all([
          meRes.json(),
          itemsRes.json(),
          tasksRes.json(),
        ]);

        setProfile(me);
        setMyItems(items || []);
        setMyTasks(tasks || []);
      } catch (e) {
        console.error(e);
        showNotification("Failed to load data ❌", "error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, navigate]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ===== TASK ACTIONS =====
  const handleEditTask = (id) => navigate(`/edit-task/${id}`);

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete task?")) return;

    try {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      setMyTasks((prev) => prev.filter((t) => t._id !== id));
      showNotification("Task deleted ✅");
    } catch {
      showNotification("Delete failed ❌", "error");
    }
  };

  const handleCompleteTask = async (id) => {
    try {
      setCompletingId(id);

      await fetch(`${API_BASE}/tasks/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: "Completed" }),
      });

      setMyTasks((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, status: "Completed" } : t
        )
      );

      showNotification("Task completed ✅");
    } catch {
      showNotification("Complete failed ❌", "error");
    } finally {
      setCompletingId(null);
    }
  };

  // ===== FILTER TASKS =====
  const pendingTasks = myTasks.filter(
    (t) => t.status?.toLowerCase() === "pending"
  );

  const inProgressTasks = myTasks.filter((t) =>
    t.status?.toLowerCase().includes("progress")
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white p-6">

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-emerald-600 px-5 py-2 rounded-lg shadow-lg animate-pulse">
          {notification.message}
        </div>
      )}

      {/* HEADER */}
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Manage your rentals and tasks
          </p>
        </div>

        {profile && (
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-sm">
            <p className="font-semibold">{profile.name}</p>
            <p className="text-gray-400">{profile.email}</p>
          </div>
        )}
      </header>

      {loading && <p className="text-gray-400">Loading...</p>}

      <div className="grid md:grid-cols-2 gap-6">

        {/* ================= ITEMS ================= */}
        <section className="bg-slate-900/70 backdrop-blur p-5 rounded-2xl border border-slate-700 shadow">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-400 mb-4">
            <Package size={18} /> My Rental Items
          </h2>

          {myItems.length > 0 ? (
            myItems.map((item) => (
              <div
                key={item._id}
                className="bg-slate-800 p-4 rounded-xl mb-3 hover:scale-[1.02] transition"
              >
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-300">
                  LKR {item.dailyRate} / day
                </p>
                <p className="text-xs text-gray-400">{item.category}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No rental items</p>
          )}
        </section>

        {/* ================= TASKS ================= */}
        <section className="bg-slate-900/70 backdrop-blur p-5 rounded-2xl border border-slate-700 shadow">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-green-400 mb-4">
            <ClipboardList size={18} /> My Tasks
          </h2>

          {/* Pending */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-yellow-400 mb-2">
              <Clock size={16} /> Pending
            </h3>

            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <div key={task._id} className="bg-slate-800 p-4 rounded-xl mb-2">
                  <p className="font-medium">{task.description}</p>
                  <p className="text-sm text-gray-400">LKR {task.budget}</p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditTask(task._id)}
                      className="flex items-center gap-1 px-3 py-1 bg-yellow-600 rounded hover:bg-yellow-700"
                    >
                      <Pencil size={14} /> Edit
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No pending tasks</p>
            )}
          </div>

          {/* In Progress */}
          <div>
            <h3 className="flex items-center gap-2 text-blue-400 mb-2">
              <Clock size={16} /> In Progress
            </h3>

            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => (
                <div key={task._id} className="bg-slate-800 p-4 rounded-xl mb-2">
                  <p>{task.description}</p>

                  <button
                    onClick={() => handleCompleteTask(task._id)}
                    disabled={completingId === task._id}
                    className="flex items-center gap-1 px-3 py-1 mt-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    {completingId === task._id
                      ? "Completing..."
                      : "Complete Task"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No in-progress tasks</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StatusDashboard;