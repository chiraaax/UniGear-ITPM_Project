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
  ListCollapse,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const StatusDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
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
        const [meRes, itemsRes, tasksRes, bookingRes] = await Promise.all([
          fetch(`${API_BASE}/users/me`, { headers }),
          fetch(`${API_BASE}/rentals/my-items`, { headers }),
          fetch(`${API_BASE}/tasks/my-tasks`, { headers }),
          fetch(`${API_BASE}/rentals/my-bookings`, { headers }),
        ]);

        const [me, items, tasks, bookings] = await Promise.all([
          meRes.json(),
          itemsRes.json(),
          tasksRes.json(),
          bookingRes.json(),
        ]);

        setProfile(me);
        setMyItems(Array.isArray(items) ? items : []);
        setMyTasks(Array.isArray(tasks) ? tasks : []);
        setMyBookings(Array.isArray(bookings) ? bookings : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, navigate]);

  // ===== FILTER TASKS =====
  const pendingTasks = myTasks.filter((t) =>
    t.status?.toLowerCase().includes("pending")
  );
  const inProgressTasks = myTasks.filter((t) =>
    t.status?.toLowerCase().includes("progress")
  );

  const handleCompleteTask = async (id) => {
    try {
      setCompletingId(id);

      await fetch(`${API_BASE}/tasks/status/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Completed" }),
      });

      setMyTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status: "Completed" } : t))
      );

      showNotification("Task completed ✅");
    } catch {
      showNotification("Failed to complete task ❌", "error");
    } finally {
      setCompletingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#020617] text-white p-6">
      
      {/* ================= NOTIFICATION ================= */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-5 py-2 rounded-lg shadow-lg ${
            notification.type === "error" ? "bg-red-600" : "bg-emerald-600"
          } animate-pulse`}
        >
          {notification.message}
        </div>
      )}

      {/* ================= INTRODUCTION ================= */}
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">
          Welcome, {profile?.name || "User"}!
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto md:mx-0">
          Track your rentals, bookings, and tasks in one place. Keep your trust
          score high by managing your items efficiently!
        </p>
      </header>

      {loading && <p className="text-gray-400">Loading...</p>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT SIDE (RENTALS + BOOKINGS) */}
        <section className="space-y-6">

          {/* RENTALS */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 shadow">
            <h2 className="flex items-center gap-2 text-purple-400 mb-4">
              <ListCollapse /> My Rentals
            </h2>

            {myItems.length > 0 ? (
              myItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center gap-3 bg-purple-900/20 p-3 rounded-xl mb-2 border border-purple-700/30"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-purple-700/40 flex-shrink-0">
                    {item.photos?.length > 0 ? (
                      <img
                        src={item.photos[0]}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-800/40">
                        📦
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-gray-400">LKR {item.dailyRate}/day</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">You have no rentals yet.</p>
            )}
          </div>

          {/* BOOKINGS */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 shadow">
            <h2 className="flex items-center gap-2 text-blue-400 mb-4">
              <Package /> My Bookings
            </h2>

            {myBookings.length > 0 ? (
              myBookings.map((b) => (
                <div
                  key={b._id}
                  className="flex items-center gap-3 bg-blue-900/20 p-3 rounded-xl mb-2 border border-blue-700/30"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-blue-700/40 flex-shrink-0">
                    {b.item?.photos?.length > 0 ? (
                      <img
                        src={b.item.photos[0]}
                        alt={b.item?.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-800/40">
                        📦
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold">{b.item?.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(b.startDate).toLocaleDateString()} -{" "}
                      {new Date(b.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">You have no bookings yet.</p>
            )}
          </div>
        </section>

        {/* RIGHT SIDE (TASKS) */}
        <section className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-lg">

          <h2 className="flex items-center gap-2 text-green-400 mb-4 text-xl font-semibold">
            <ClipboardList /> My Tasks
          </h2>

          {/* Pending */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-yellow-400 mb-2">
              <Clock size={16} /> Pending
            </h3>

            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-gradient-to-r from-yellow-900/20 to-yellow-700/10 p-4 rounded-xl mb-2 border border-yellow-700/20"
                >
                  <p className="font-semibold">{task.description}</p>
                  <p className="text-sm text-gray-400">LKR {task.budget}</p>

                  <div className="flex gap-2 mt-3">
                    <button className="bg-yellow-500 px-3 py-1 rounded flex items-center gap-1 hover:bg-yellow-600">
                      <Pencil size={14} /> Edit
                    </button>

                    <button className="bg-red-500 px-3 py-1 rounded flex items-center gap-1 hover:bg-red-600">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No pending tasks</p>
            )}
          </div>

          {/* In Progress */}
          <div>
            <h3 className="flex items-center gap-2 text-blue-400 mb-2">
              <Clock size={16} /> In Progress
            </h3>

            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-gradient-to-r from-blue-900/20 to-blue-700/10 p-4 rounded-xl mb-2 border border-blue-700/20"
                >
                  <p>{task.description}</p>

                  <button
                    onClick={() => handleCompleteTask(task._id)}
                    disabled={completingId === task._id}
                    className="mt-2 bg-green-500 px-3 py-1 rounded flex items-center gap-1 hover:bg-green-600 disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    {completingId === task._id ? "Completing..." : "Complete"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No in-progress tasks</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StatusDashboard;