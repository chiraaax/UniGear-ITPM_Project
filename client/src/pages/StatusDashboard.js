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
  AlertTriangle,
  MessageCircle
} from "lucide-react";
import DisputeModal from "../components/disputes/DisputeModal";
import DisputeChatModal from "../components/disputes/DisputeChatModal";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const fetchJson = async (url, options = {}, fallback = null) => {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = fallback;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }

  return data ?? fallback;
};

const StatusDashboard = () => {
  const { token, user, authReady } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myDisputes, setMyDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [chatModalData, setChatModalData] = useState(null);

  const getUserId = (userRef) => {
    if (!userRef) return null;
    if (typeof userRef === 'string') return userRef;
    return userRef._id || null;
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadDisputes = async () => {
    try {
      const data = await fetchJson(
        `${API_BASE}/disputes/mine`,
        { headers: { Authorization: `Bearer ${token}` } },
        []
      );
      setMyDisputes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!authReady) return;

    if (!token) {
      navigate("/auth");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    async function load() {
      try {
        setDashboardError("");

        const requests = [
          ["profile", `${API_BASE}/users/me`, null],
          ["rentals", `${API_BASE}/rentals/my-items`, []],
          ["tasks", `${API_BASE}/tasks/my-tasks`, []],
          ["transactions", `${API_BASE}/transactions`, []],
          ["bookings", `${API_BASE}/rentals/my-bookings`, []],
          ["disputes", `${API_BASE}/disputes/mine`, []],
        ];

        const results = await Promise.all(
          requests.map(async ([key, url, fallback]) => {
            try {
              return { key, data: await fetchJson(url, { headers }, fallback) };
            } catch (error) {
              console.error(`Error loading ${key}:`, error);
              return { key, data: fallback, error };
            }
          })
        );

        const failed = results.filter((result) => result.error);
        const dataByKey = Object.fromEntries(
          results.map((result) => [result.key, result.data])
        );

        setProfile(dataByKey.profile);
        setMyItems(Array.isArray(dataByKey.rentals) ? dataByKey.rentals : []);
        setMyTasks(Array.isArray(dataByKey.tasks) ? dataByKey.tasks : []);
        setTransactions(
          Array.isArray(dataByKey.transactions) ? dataByKey.transactions : []
        );
        setMyBookings(
          Array.isArray(dataByKey.bookings) ? dataByKey.bookings : []
        );
        setMyDisputes(
          Array.isArray(dataByKey.disputes) ? dataByKey.disputes : []
        );

        if (failed.length > 0) {
          setDashboardError(
            `Some dashboard data could not be loaded: ${failed
              .map((result) => result.key)
              .join(", ")}.`
          );
        }
      } catch (e) {
        console.error("Error loading dashboard:", e);
        setDashboardError("Dashboard data could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, navigate, authReady]);

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
      const bookings = await fetchJson(
        `${API_BASE}/rentals/my-bookings`,
        { headers: { Authorization: `Bearer ${token}` } },
        []
      );
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
      const data = await fetchJson(
        `${API_BASE}/transactions`,
        { headers: { Authorization: `Bearer ${token}` } },
        []
      );
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
      const data = await fetchJson(
        `${API_BASE}/transactions`,
        { headers: { Authorization: `Bearer ${token}` } },
        []
      );
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
      const [me, txs] = await Promise.all([
        fetchJson(
          `${API_BASE}/users/me`,
          { headers: { Authorization: `Bearer ${token}` } },
          null
        ),
        fetchJson(
          `${API_BASE}/transactions`,
          { headers: { Authorization: `Bearer ${token}` } },
          []
        ),
      ]);
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

  const getTransactionTitle = (tx) => {
    if (tx.item?.title) return tx.item.title;
    if (tx.task?.description) return tx.task.description;
    return tx.type === "rental" ? "Rental transaction" : "Task transaction";
  };

  const hasUserRated = (tx) => {
    const currentUserId = user?._id;
    if (!currentUserId) return true;
    if (getUserId(tx.owner) === currentUserId) return Boolean(tx.ownerRating);
    if (getUserId(tx.counterparty) === currentUserId) {
      return Boolean(tx.counterpartyRating);
    }
    return true;
  };

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

      {dashboardError && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          {dashboardError}
        </div>
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
                          👁️ View
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
                    <button
                      onClick={() => handleEditTask(task._id)}
                      className="bg-yellow-500 px-3 py-1 rounded flex items-center gap-1 hover:bg-yellow-600"
                    >
                      <Pencil size={14} /> Edit
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="bg-red-500 px-3 py-1 rounded flex items-center gap-1 hover:bg-red-600"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No pending tasks</p>
            )}
          </div>

          {/* ENHANCED IN PROGRESS */}
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

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      onClick={() => handleCompleteTask(task._id)}
                      disabled={completingId === task._id}
                      className="bg-green-500 px-3 py-1 rounded flex items-center gap-1 hover:bg-green-600 disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      {completingId === task._id ? "Completing..." : "Complete"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No in-progress tasks</p>
            )}
          </div>

          {/* COMPLETED TASKS (FOR HISTORY REPORTS) */}
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-gray-400 mb-2">
              <CheckCircle size={16} /> Completed (History)
            </h3>
            {myTasks.filter(t => t.status?.toLowerCase() === 'completed').length > 0 ? (
              myTasks.filter(t => t.status?.toLowerCase() === 'completed').map((task) => (
                <div key={task._id} className="bg-slate-800/50 p-4 rounded-xl mb-2 border border-slate-700/50">
                  <p className="text-slate-300 line-clamp-1">{task.description}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No completed tasks</p>
            )}
          </div>
        </section>

        {/* ================= TRANSACTIONS ================= */}
        <section className="md:col-span-2 bg-slate-900/70 backdrop-blur p-5 rounded-2xl border border-slate-700 shadow">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-sky-400 mb-4">
            <CheckCircle size={18} /> Transaction Status
          </h2>

          {transactions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactions.map((tx) => {
                const isCompleted = tx.status === "Completed";
                const ownerConfirmed = Boolean(tx.ownerConfirmed);
                const counterpartyConfirmed = Boolean(tx.counterpartyConfirmed);

                return (
                  <article
                    key={tx._id}
                    className="rounded-xl border border-slate-700/60 bg-slate-800/70 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {getTransactionTitle(tx)}
                        </p>
                        <p className="mt-1 text-xs capitalize text-slate-400">
                          {tx.type}
                        </p>
                      </div>
                      <span className="rounded-full bg-sky-900/40 px-2 py-0.5 text-[11px] text-sky-100">
                        {tx.status}
                      </span>
                    </div>

                    <div className="mb-3 space-y-1 text-xs text-slate-300">
                      <p>Owner confirmed: {ownerConfirmed ? "Yes" : "No"}</p>
                      <p>
                        Counterparty confirmed:{" "}
                        {counterpartyConfirmed ? "Yes" : "No"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!isCompleted && (
                        <>
                          <button
                            type="button"
                            className="small-action"
                            onClick={() => handleConfirm(tx._id)}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="small-action"
                            onClick={() => handleMarkCompleted(tx)}
                          >
                            Complete
                          </button>
                        </>
                      )}

                      {isCompleted && !hasUserRated(tx) && (
                        <div className="flex flex-wrap gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              className="small-action"
                              onClick={() => handleRate(tx._id, rating)}
                            >
                              {rating}★
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No transactions recorded yet.
            </p>
          )}
        </section>

        {/* ================= DISPUTES ================= */}
        <section className="md:col-span-2 bg-slate-900/70 backdrop-blur p-5 rounded-2xl border border-red-900/50 shadow mt-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-red-400 mb-4">
            <AlertTriangle size={18} /> My Active Disputes
          </h2>
          {myDisputes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDisputes.map(dispute => (
                <div key={dispute._id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        dispute.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        dispute.status === 'dismissed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {dispute.status}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 mb-1">Dispute against {dispute.reportedUser?.name || 'User'}</p>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{dispute.reason}</p>
                  </div>
                  <button
                    onClick={() => setChatModalData(dispute)}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    <MessageCircle size={16} /> Open Chat
                  </button>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-6">
                <span className="text-3xl">🕊️</span>
                <p className="text-sm text-slate-400 mt-2">No active disputes reported.</p>
             </div>
          )}
        </section>
      </div>

      {chatModalData && (
        <DisputeChatModal
          dispute={chatModalData}
          onClose={() => { setChatModalData(null); loadDisputes(); }}
          refreshDisputes={loadDisputes}
          pushToast={showNotification}
        />
      )}

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
