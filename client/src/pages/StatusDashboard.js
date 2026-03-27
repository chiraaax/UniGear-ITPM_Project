import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const StatusDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [myBookings, setMyBookings] = useState([]); // 🔥 NEW
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [completing, setCompleting] = useState(false);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : {};

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!token) {
      navigate("/auth");
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

  // ========== ITEMS ==========
  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const res = await fetch(`${API_BASE}/rentals/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete item");
      setMyItems((prev) => prev.filter((i) => i._id !== id));
      showNotification("✅ Item deleted successfully");
    } catch (error) {
      console.error(error);
      showNotification("❌ Failed to delete item", "error");
    }
  };

  const handleEditItem = (id) => navigate(`/edit-item/${id}`);

  // ========== TASKS ==========
  const handleEditTask = (id) => navigate(`/edit-task/${id}`);

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete task");
      setMyTasks((prev) => prev.filter((t) => t._id !== id));
      showNotification("✅ Task deleted successfully");
    } catch (error) {
      console.error(error);
      showNotification("❌ Failed to delete task", "error");
    }
  };

  const handleCompleteTask = async (taskId) => {
    if (!token) {
      alert("Please login");
      return;
    }

    try {
      setCompleting(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: authHeaders,
      });

      setMyTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "Completed" } : t))
      );
      
      showNotification("✅ Task marked as completed");
    } catch (error) {
      console.error(error);
      showNotification("❌ Failed to complete task", "error");
    } finally {
      setCompleting(false);
    }
  };

  const handleMarkCompleted = async (tx) => {
    try {
      const res = await fetch(`${API_BASE}/transactions/${tx._id}/complete`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to mark as completed");
      await loadData();
      showNotification("✅ Transaction marked as completed");
    } catch (e) {
      showNotification("❌ Failed to mark as completed", "error");
    }
  };

  const handleRate = async (txId, rating) => {
    try {
      const res = await fetch(`${API_BASE}/transactions/${txId}/rate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) throw new Error("Failed to rate");
      await loadData();
      showNotification("✅ Rating submitted");
    } catch (e) {
      showNotification("❌ Failed to submit rating", "error");
    }
  };

  // 🔥 RETURN ITEM FUNCTION
  const handleReturn = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/rentals/bookings/${bookingId}/return`, {
        method: 'PUT',
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert('Item returned successfully ✅');

      // reload bookings
      const bookingRes = await fetch(`${API_BASE}/rentals/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const bookings = await bookingRes.json();
      setMyBookings(Array.isArray(bookings) ? bookings : []);
    } catch (e) {
      // ignore for now
    }
  };

  const handleConfirm = async (txId) => {
    try {
      await fetch(`${API_BASE}/transactions/${txId}/confirm`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      // reload just transactions
      const res = await fetch(`${API_BASE}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore for now
    }
  };

  // ========== FILTER TASKS ==========
  const pendingTasks = myTasks.filter((t) => t.status?.toLowerCase() === "pending");
  const inProgressTasks = myTasks.filter(
    (t) =>
      t.status?.toLowerCase() === "inprogress" ||
      t.status?.toLowerCase() === "in progress"
  );

  if (!user) return null;

  return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
              My UniGear activity
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Track your listings, tasks, handovers, and bookings — and see how your trust score evolves over time.
            </p>
          </div>
          {profile && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-100">{profile.name}</span>
                  <span className="text-[11px] text-slate-400">{profile.email}</span>
                </div>
                <div className="ml-2 flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">Trust score</span>
                  <span className="text-sm font-semibold text-emerald-300">
                {profile.trustScore ? profile.trustScore.toFixed(2) : 'N/A'}
              </span>
                </div>
              </div>
          )}
        </header>

        {loading && <p className="text-sm text-slate-400">Loading your activity…</p>}

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-slate-200">My rental listings</h2>
              <div className="mt-2 grid max-h-[220px] gap-3 overflow-y-auto pr-1 text-sm">
                {myItems.map((item) => (
                    <article
                        key={item._id}
                        className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 shadow-sm shadow-slate-950/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-50">{item.title}</h3>
                        <span className="inline-flex rounded-full bg-sky-900/40 px-2 py-0.5 text-[11px] text-sky-200">
                      {item.category}
                    </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-slate-100">LKR {item.dailyRate}</span> / day
                      </p>
                    </article>
                ))}
                {myItems.length === 0 && (
                    <p className="text-xs text-slate-400">You have not listed any items yet.</p>
                )}
              </div>
            </div>

            {/* 🔥 MY BOOKINGS SECTION - NEW */}
            <div>
              <h2 className="mt-2 text-sm font-medium text-slate-200">My bookings</h2>
              <div className="mt-2 grid max-h-[220px] gap-3 overflow-y-auto pr-1 text-sm">
                {myBookings.map((booking) => (
                    <article
                        key={booking._id}
                        className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 shadow-sm shadow-slate-950/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-50">{booking.item?.title}</h3>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                            booking.status === 'returned'
                                ? 'bg-slate-700/40 text-slate-300'
                                : booking.status === 'active'
                                    ? 'bg-emerald-900/40 text-emerald-100'
                                    : 'bg-amber-900/40 text-amber-100'
                        }`}>
                      {booking.status}
                    </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        📅 {new Date(booking.startDate).toLocaleDateString()} →{' '}
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                      {booking.status !== 'returned' && (
                          <button
                              type="button"
                              className="small-action mt-1 w-fit"
                              onClick={() => handleReturn(booking._id)}
                          >
                            Return Item
                          </button>
                      )}
                    </article>
                ))}
                {myBookings.length === 0 && (
                    <p className="text-xs text-slate-400">You haven't booked any items yet.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="mt-2 text-sm font-medium text-slate-200">My tasks</h2>
              <div className="mt-2 grid max-h-[220px] gap-3 overflow-y-auto pr-1 text-sm">
                {myTasks.map((task) => (
                    <article
                        key={task._id}
                        className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 shadow-sm shadow-slate-950/30"
                    >
                      <h3 className="text-sm font-semibold text-slate-50">{task.description}</h3>
                      <p className="text-xs text-slate-300">
                        Budget: LKR {task.budget} ·{' '}
                        <span className="inline-flex rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] text-emerald-100">
                      {task.status}
                    </span>
                      </p>
                      <button
                          type="button"
                          className="small-action mt-1 w-fit"
                          onClick={() => navigate(`/tasks?task=${task._id}`)}
                      >
                        View offers
                      </button>
                    </article>
                ))}
                {myTasks.length === 0 && (
                    <p className="text-xs text-slate-400">You have not posted any tasks yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-200">My transactions</h2>
              <span className="text-xs text-slate-400">{transactions.length} records</span>
            </div>
            <div className="grid max-h-[460px] gap-3 overflow-y-auto pr-1 text-sm">
              {transactions.map((tx) => {
                const isCompleted = tx.status === 'Completed';
                const hasConfirmed = tx.ownerConfirmed || tx.counterpartyConfirmed;
                const bothConfirmed = tx.ownerConfirmed && tx.counterpartyConfirmed;
                return (
                    <article
                        key={tx._id}
                        className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 shadow-sm shadow-slate-950/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-semibold text-slate-50">
                            {tx.type === 'rental' ? 'Rental transaction' : 'Task transaction'}
                          </h3>
                          <p className="text-xs text-slate-300">
                            Status: <span className="font-medium">{tx.status}</span>
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      #{tx._id.slice(-6)}
                    </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Pickup: {tx.pickupTime ? new Date(tx.pickupTime).toLocaleString() : '—'} · Return:{' '}
                        {tx.returnTime ? new Date(tx.returnTime).toLocaleString() : '—'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {!isCompleted && (
                            <button
                                type="button"
                                className="small-action"
                                onClick={() => handleConfirm(tx._id)}
                            >
                              {hasConfirmed ? 'Confirm again' : 'Confirm handover'}
                            </button>
                        )}
                        {!isCompleted && (
                            <button
                                type="button"
                                className="small-action"
                                onClick={() => handleMarkCompleted(tx)}
                                disabled={!bothConfirmed}
                            >
                              Mark completed
                            </button>
                        )}
                        {isCompleted && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">Rate this exchange:</span>
                              {[1, 2, 3, 4, 5].map((r) => (
                                  <button
                                      key={r}
                                      type="button"
                                      className="small-action"
                                      onClick={() => handleRate(tx._id, r)}
                                  >
                                    {r}
                                  </button>
                              ))}
                            </div>
                        )}
                      </div>
                    </article>
                );
              })}
              {transactions.length === 0 && (
                  <p className="text-xs text-slate-400">No transactions yet — they’ll appear here once you start renting or completing tasks.</p>
              )}
            </div>
          </section>
        </div>
      </div>
  );
};

export default StatusDashboard;