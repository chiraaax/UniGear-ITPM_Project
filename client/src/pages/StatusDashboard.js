import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const StatusDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
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

  const loadData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [meRes, itemsRes, tasksRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/users/me`, { headers }),
        fetch(`${API_BASE}/rentals/my-items`, { headers }),
        fetch(`${API_BASE}/tasks/my-tasks`, { headers }),
        fetch(`${API_BASE}/transactions`, { headers }),
      ]);

      const [me, items, tasks] = await Promise.all([
        meRes.json(),
        itemsRes.json(),
        tasksRes.json(),
        txRes.json(),
      ]);

      setProfile(me);
      setMyItems(Array.isArray(items) ? items : []);
      setMyTasks(Array.isArray(tasks) ? tasks : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [token, navigate, loadData]);

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

      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Completed" }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to complete task");
        return;
      }

      setMyTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "Completed" } : t))
      );

      showNotification("✅ Task marked as Completed");
      navigate("/micro-tasks", { state: { updated: true } });
    } catch (error) {
      console.error(error);
      showNotification("❌ Failed to complete task", "error");
    } finally {
      setCompleting(false);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white px-4 md:px-8 py-8">
      {/* NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg font-semibold shadow-lg z-50 animate-pulse ${
            notification.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My UniGear Activity</h1>
          <p className="text-gray-400 mt-1">
            Track your listings, tasks, and handovers.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded shadow transition duration-200"
            onClick={() => navigate("/add-item")}
          >
            + Add Item
          </button>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded shadow transition duration-200"
            onClick={() => navigate("/tasks")}
          >
            + Post Task
          </button>
        </div>
        {profile && (
          <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-2xl shadow">
            <div>
              <div className="font-semibold">{profile.name}</div>
              <div className="text-gray-400 text-sm">{profile.email}</div>
            </div>
            <div className="ml-2 text-green-400 font-mono">
              {profile.trustScore?.toFixed(2)}
            </div>
          </div>
        )}
      </header>

      {loading && <p className="text-gray-400">Loading...</p>}

      <div className="grid gap-8 md:grid-cols-2">
        {/* ITEMS */}
        <section>
          <h2 className="text-xl font-semibold text-gray-200 mb-4">My Rental Listings</h2>
          {myItems.length > 0 ? (
            myItems.map((item) => (
              <div
                key={item._id}
                className="bg-gray-900 p-4 rounded-lg shadow hover:shadow-lg transition duration-200"
              >
                <h3 className="text-white text-lg font-semibold">{item.title}</h3>
                <p className="text-gray-300 mt-1">LKR {item.dailyRate}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded transition duration-200"
                    onClick={() => handleEditItem(item._id)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition duration-200"
                    onClick={() => handleDeleteItem(item._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No items yet</p>
          )}
        </section>

        {/* TASKS */}
        <section>
          <h2 className="text-xl font-semibold text-gray-200 mb-4">My Tasks</h2>

          {/* Pending */}
          <div className="mb-6">
            <h3 className="text-yellow-400 mb-2">Pending Tasks</h3>
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-gray-900 p-4 rounded-lg shadow hover:shadow-lg transition duration-200 mb-2 border-l-2 border-b-2 border-t-2 border-r-2 border-gray-700"
                >
                  <h3 className="text-white font-semibold">{task.description}</h3>
                  <p className="text-gray-300">LKR {task.budget}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/tasks?task=${task._id}`)}
                      className="px-3 py-1 border-l-2 border-b-2 border-t-2 border-r-2 border-blue-600 rounded transition duration-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditTask(task._id)}
                      className="px-3 py-1 border-l-2 border-b-2 border-t-2 border-r-2 border-yellow-600  rounded transition duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="px-3 py-1 border-l-2 border-b-2 border-t-2 border-r-2 border-red-600  rounded transition duration-200"
                    >
                      Delete
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
            <h3 className="text-blue-400 mb-2">In Progress Tasks</h3>
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-gray-900 p-4 rounded-lg shadow hover:shadow-lg transition duration-200 mb-2 border-l-2 border-b-2 border-t-2 border-r-2 border-gray-700"
                >
                  <h3 className="text-white font-semibold">{task.description}</h3>
                  <p className="text-gray-300">LKR {task.budget}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleCompleteTask(task._id)}
                      disabled={completing}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded transition duration-200 disabled:opacity-50"
                    >
                      {completing ? "Completing..." : "Complete Task"}
                    </button>
                  </div>
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