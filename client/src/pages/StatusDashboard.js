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
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

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
        setTransactions(Array.isArray(txs) ? txs : []);
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

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
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

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-slate-200">
              My rental listings
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
            <h2 className="mt-2 text-sm font-medium text-slate-200">
              My bookings
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

          <div>
            <h2 className="mt-2 text-sm font-medium text-slate-200">
              My tasks
            </h2>
            <div className="mt-2 grid max-h-[220px] gap-3 overflow-y-auto pr-1 text-sm">
              {myTasks.map((task) => (
                <article
                  key={task._id}
                  className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 shadow-sm shadow-slate-950/30 hover:border-slate-700/80 transition-all duration-200"
                >
                  <h3 className="text-sm font-semibold text-slate-50">
                    {task.description}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Budget: LKR {task.budget} ·{" "}
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
                <p className="text-xs text-slate-400">
                  You have not posted any tasks yet.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-slate-200">
              My transactions
            </h2>
            <span className="text-xs text-slate-400">
              {transactions.length} records
            </span>
          </div>
          <div className="grid max-h-[460px] gap-3 overflow-y-auto pr-1 text-sm">
            {transactions.map((tx) => {
              const isCompleted = tx.status === "Completed";
              const hasConfirmed =
                tx.ownerConfirmed || tx.counterpartyConfirmed;
              const bothConfirmed =
                tx.ownerConfirmed && tx.counterpartyConfirmed;
              return (
                <article
                  key={tx._id}
                  className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 shadow-sm shadow-slate-950/30 hover:border-slate-700/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-slate-50">
                        {tx.type === "rental"
                          ? "Rental transaction"
                          : "Task transaction"}
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
                    Pickup:{" "}
                    {tx.pickupTime
                      ? new Date(tx.pickupTime).toLocaleString()
                      : "—"}{" "}
                    · Return:{" "}
                    {tx.returnTime
                      ? new Date(tx.returnTime).toLocaleString()
                      : "—"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {!isCompleted && (
                      <button
                        type="button"
                        className="small-action"
                        onClick={() => handleConfirm(tx._id)}
                      >
                        {hasConfirmed ? "Confirm again" : "Confirm handover"}
                      </button>
                    )}
                    {!isCompleted && (
                      <button
                        type="button"
                        className="small-action"
                        onClick={() => handleMarkCompleted(tx)}
                        disabled={!bothConfirmed}
                        style={
                          !bothConfirmed
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : {}
                        }
                      >
                        Mark completed
                      </button>
                    )}
                    {isCompleted && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">
                          Rate this exchange:
                        </span>
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            type="button"
                            className="small-action hover:bg-emerald-900/40"
                            onClick={() => handleRate(tx._id, r)}
                          >
                            {r}⭐
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            {transactions.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">💸</div>
                <p className="text-xs text-slate-400">No transactions yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  They'll appear here once you start renting or completing
                  tasks.
                </p>
              </div>
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
