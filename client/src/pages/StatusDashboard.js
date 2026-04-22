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
  const [transactions, setTransactions] = useState([]);
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
        const [meRes, itemsRes, tasksRes, txRes, bookingRes] =
          await Promise.all([
            fetch(`${API_BASE}/users/me`, { headers }),
            fetch(`${API_BASE}/rentals/my-items`, { headers }),
            fetch(`${API_BASE}/tasks/my-tasks`, { headers }),
            fetch(`${API_BASE}/transactions`, { headers }),
            fetch(`${API_BASE}/rentals/my-bookings`, { headers }),
          ]);

        const [me, items, tasks, txs, bookings] = await Promise.all([
          meRes.json(),
          itemsRes.json(),
          tasksRes.json(),
          txRes.json(),
          bookingRes.json(),
        ]);

        setProfile(me);
        setMyItems(Array.isArray(items) ? items : []);
        setMyTasks(Array.isArray(tasks) ? tasks : []);
        setMyBookings(Array.isArray(bookings) ? bookings : []);
      } catch (e) {
        console.error("Error loading dashboard:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, navigate]);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : {};

    // RETURN ITEM FUNCTION
  const handleReturn = async (bookingId) => {
    try {
      const res = await fetch(
        `${API_BASE}/rentals/bookings/${bookingId}/return`,
        {
          method: "PUT",
          headers: authHeaders,
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Item returned successfully ✅");

      // reload bookings
      const bookingRes = await fetch(`${API_BASE}/rentals/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const bookings = await bookingRes.json();
      setMyBookings(Array.isArray(bookings) ? bookings : []);
    } catch (e) {
      console.error("Error returning item:", e);
    }
  };

  const handleConfirm = async (txId) => {
    try {
      await fetch(`${API_BASE}/transactions/${txId}/confirm`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      // reload just transactions
      const res = await fetch(`${API_BASE}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error confirming transaction:", e);
    }
  };

  const handleMarkCompleted = async (tx) => {
    try {
      await fetch(`${API_BASE}/transactions/${tx._id}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: "Completed" }),
      });
      const res = await fetch(`${API_BASE}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error marking completed:", e);
    }
  };

  const handleRate = async (txId, rating) => {
    try {
      await fetch(`${API_BASE}/transactions/${txId}/rate`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ rating }),
      });
      const [meRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [me, txs] = await Promise.all([meRes.json(), txRes.json()]);
      setProfile(me);
      setTransactions(Array.isArray(txs) ? txs : []);
    } catch (e) {
      console.error("Error rating:", e);
    }
  };

  // Helper function to calculate days and total price
  const calculateBookingDetails = (booking) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = diffDays * (booking.item?.dailyRate || 0);
    return { days: diffDays, totalPrice };
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case "returned":
        return {
          icon: "✅",
          text: "Returned",
          color: "bg-slate-700/40 text-slate-300",
        };
      case "active":
        return {
          icon: "🟡",
          text: "Active",
          color: "bg-emerald-900/40 text-emerald-100",
        };
      default:
        return {
          icon: "📅",
          text: status || "Pending",
          color: "bg-amber-900/40 text-amber-100",
        };
    }
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

  // ===== FILTER TASKS =====
  const pendingTasks = myTasks.filter(
    (t) => t.status?.toLowerCase() === "pending"
  );

  const inProgressTasks = myTasks.filter((t) =>
    t.status?.toLowerCase().includes("progress")
  );

  if (!user) {
    return null;
  }

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

      {/* HEADER */}
      
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
            My UniGear activity
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Track your listings, tasks, handovers, and bookings — and see how
            your trust score evolves over time.
          </p>
        </div>

        {profile && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs">
            <div className="flex flex-col">
              <span className="font-medium text-slate-100">{profile.name}</span>
              <span className="text-[11px] text-slate-400">
                {profile.email}
              </span>
            </div>
            <div className="ml-2 flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                Trust score
              </span>
              <span className="text-sm font-semibold text-emerald-300">
                {profile.trustScore ? profile.trustScore.toFixed(2) : "N/A"}
              </span>
            </div>
          </div>
        )}
      </header>

      {loading && (
      <p className="text-sm text-slate-400">Loading your activity…</p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT SIDE (RENTALS + BOOKINGS) */}
        <section className="space-y-6">

          {/* RENTALS */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 shadow">
            <h2 className="flex items-center gap-2 text-purple-400 mb-4">
              <ListCollapse /> My Rentals
            </h2>
            <div className="mt-2 grid max-h-[220px] gap-3 overflow-y-auto pr-1 text-sm">
              {myItems.map((item) => (
                <article
                  key={item._id}
                  className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 shadow-sm shadow-slate-950/30 hover:border-slate-700/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-50">
                      {item.title}
                    </h3>
                    <span className="inline-flex rounded-full bg-sky-900/40 px-2 py-0.5 text-[11px] text-sky-200">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-100">
                      LKR {item.dailyRate}
                    </span>{" "}
                    / day
                  </p>
                </article>
              ))}
              {myItems.length === 0 && (
                <p className="text-xs text-slate-400">
                  You have not listed any items yet.
                </p>
              )}
            </div>
          </div>

          {/* 🔥 ENHANCED MY BOOKINGS SECTION WITH SQUARE IMAGES */}
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-pink-500 mb-4">
              <Package size={18}/> My Bookings
            </h2>
            <div className="mt-2 grid max-h-[280px] gap-3 overflow-y-auto pr-1 text-sm">
              {myBookings.map((booking) => {
                const { days, totalPrice } = calculateBookingDetails(booking);
                const statusDisplay = getStatusDisplay(booking.status);

                return (
                  <article
                    key={booking._id}
                    className="flex gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 shadow-sm shadow-slate-950/30 hover:border-slate-700/80 transition-all duration-200"
                  >
                    {/* 🔥 SQUARE IMAGE THUMBNAIL */}
                    {booking.item?.photos?.length > 0 ? (
                      <div className="flex-shrink-0">
                        <img
                          src={booking.item.photos[0]}
                          alt={booking.item.title}
                          className="w-16 h-16 object-cover rounded-xl border border-slate-700/50"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-700/50">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-50 truncate">
                          {booking.item?.title || "Unknown Item"}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap ${statusDisplay.color}`}
                        >
                          {statusDisplay.icon} {statusDisplay.text}
                        </span>
                      </div>

                      {/* Category and Price */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {booking.item?.category && (
                          <p className="text-[11px] text-slate-500">
                            {booking.item.category}
                          </p>
                        )}
                        {booking.item?.dailyRate && (
                          <p className="text-xs text-slate-400">
                            💰 LKR {booking.item.dailyRate}/day
                          </p>
                        )}
                      </div>

                      {/* Dates */}
                      <p className="text-xs text-slate-300 mb-1">
                        📅 {new Date(booking.startDate).toLocaleDateString()} →{" "}
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>

                      {/* Duration and Total Price */}
                      {days > 0 && (
                        <p className="text-xs text-slate-400 mb-2">
                          📆 {days} day{days !== 1 ? "s" : ""} · 💰 LKR{" "}
                          {totalPrice}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="small-action flex-1"
                          onClick={() => navigate("/rentals")}
                        >
                          👁️ View Item
                        </button>

                        {booking.status !== "returned" && (
                          <button
                            type="button"
                            className="small-action flex-1 bg-amber-900/40 hover:bg-amber-800/50"
                            onClick={() => handleReturn(booking._id)}
                          >
                            🔄 Return
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              {myBookings.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-xs text-slate-400">No bookings yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Start renting items from the rental page!
                  </p>
                </div>
              )}
            </div>
          </div>
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

      <style>{`
        .small-action {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.7rem;
          font-weight: 500;
          background: rgba(79, 70, 229, 0.2);
          color: #e5e7eb;
          border: 1px solid rgba(148, 163, 184, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .small-action:hover {
          background: rgba(79, 70, 229, 0.3);
          border-color: rgba(96, 165, 250, 0.6);
          transform: translateY(-1px);
        }
        
        .small-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
        
        /* Animation for new items */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        article {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StatusDashboard;