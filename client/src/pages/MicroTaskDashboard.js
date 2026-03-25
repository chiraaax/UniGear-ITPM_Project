import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const navigate = useNavigate();

  // ================= FETCH TASKS =================
  const fetchTasks = async () => {
    try {
      let query = new URLSearchParams();

      if (search.trim()) query.append("search", search.trim());
      if (category !== "All") query.append("category", category);
      if (status !== "All") query.append("status", status);

      const url = `${API_BASE}/tasks${query.toString() ? `?${query.toString()}` : ""}`;

      const res = await fetch(url);
      const data = await res.json();

      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // ================= LOAD =================
  useEffect(() => {
    fetchTasks();
  }, [search, category, status]);

  // ================= NAVIGATION =================
  const handlePostTask = () => {
    navigate("/tasks"); // Navigate to TaskPage
  };

  // ================= STATUS STYLE =================
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500";
      case "inprogress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-4">Task Dashboard</h1>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search tasks..."
          className="px-3 py-2 border rounded-md w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* CATEGORY */}
        <select
          className="px-3 py-2 border rounded-md bg-gray-500 text-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Delivery">Delivery</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Academic">Academic</option>
          <option value="Technical">Technical</option>
          <option value="Other">Other</option>
        </select>

        {/* STATUS */}
        <select
          className="px-3 py-2 border rounded-md bg-gray-500 text-white"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="pending">Pending</option>
          <option value="inprogress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* POST BUTTON */}
        <button
          onClick={handlePostTask}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          + Post Task
        </button>
      </div>

      {/* TASK CARDS */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="p-4 rounded-xl bg-gray-500 shadow hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-lg">{task.description}</h3>

              <p className="text-sm text-black">💰 LKR {task.budget}</p>
              <p className="text-sm text-black">📍 {task.location}</p>
              <p className="text-sm text-black">📂 {task.category}</p>

              <span
                className={`inline-block mt-2 px-2 py-1 text-white text-xs rounded ${getStatusStyle(
                  task.status,
                )}`}
              >
                {task.status}
              </span>

              {/* VIEW BUTTON */}
              <button
                className="mt-3 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                onClick={() => navigate(`/task/${task._id}`)}
              >
                View Task
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No tasks found.</p>
        )}
      </div>
    </div>
  );
};

export default TaskDashboard;
