import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const TaskDashboard = () => {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};
  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = [];

      if (search) query.push(`search=${encodeURIComponent(search)}`);
      if (category !== "All") query.push(`category=${encodeURIComponent(category)}`);
      if (status !== "All") query.push(`status=${encodeURIComponent(status)}`);

      const queryString = query.length ? `?${query.join("&")}` : "";

      const res = await fetch(`${API_BASE}/tasks${queryString}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON, got ${contentType || 'unknown'}:\n${text.substring(0, 300)}`);
      }

      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, category, status]);

  const handlePostTask = () => {
    if (!token) return navigate("/auth");
    navigate("/tasks");
  };

  const handleEditTask = (id) => {
    if (!token) return navigate("/auth");
    navigate(`/edit-task/${id}`);
  };

  const handleDeleteTask = async (id) => {
    if (!token) return navigate("/auth");
    if (!window.confirm("Delete this task?")) return;

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Delete task failed:", error);
      alert(error.message || "Could not delete task");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-400/80";
      case "InProgress":
        return "bg-blue-400/80";
      case "Completed":
        return "bg-green-400/80";
      case "Cancelled":
        return "bg-red-400/80";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1c2c] via-[#0e2a3d] to-[#071521] text-white p-6">
      
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 tracking-wide">
        🚀 Task Dashboard
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        
        <input
          type="text"
          placeholder="Search tasks..."
          className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur text-gray-300"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Delivery">Delivery</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Academic">Academic</option>
          <option value="Technical">Technical</option>
        </select>

        <select
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur text-gray-300"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          onClick={handlePostTask}
          className="bg-gradient-to-r from-green-400 to-emerald-500 px-5 py-2 rounded-lg font-semibold shadow-lg hover:scale-105 transition"
        >
          + Post Task
        </button>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-300">Loading tasks...</p>}

      {/* Cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="p-5 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:shadow-xl hover:scale-[1.02] transition"
            >
              <h3 className="text-lg font-semibold mb-2">
                {task.description}
              </h3>

              <p className="text-sm text-gray-200">💰 LKR {task.budget}</p>
              <p className="text-sm text-gray-200">📍 {task.location}</p>
              <p className="text-sm text-gray-200">📂 {task.category || "N/A"}</p>

              <span
                className={`inline-block mt-3 px-3 py-1 text-xs rounded-full text-black font-semibold ${getStatusStyle(
                  task.status
                )}`}
              >
                {task.status}
              </span>

              {task.creator && (
                <p className="text-xs text-gray-300 mt-3">
                  Posted by: {task.creator.name} ⭐{" "}
                  {task.creator.trustScore?.toFixed(1) || "—"}
                </p>
              )}

            </div>
          ))
        ) : (
          !loading && <p className="text-gray-400">No tasks found.</p>
        )}
      </div>
    </div>
  );
};

export default TaskDashboard;