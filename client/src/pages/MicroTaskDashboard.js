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

  useEffect(() => {
    fetchTasks();
  }, [search, category, status]);

  const handlePostTask = () => {
    navigate("/tasks");
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-400";
      case "inprogress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1a2a] to-[#0f2a44] text-white p-6  flex flex-col items-center">

      {/* HERO SECTION */}
      <div className="mb-10 max-w-4xl">
        <p className="text-sm tracking-widest text-blue-300 mb-2">
          MICRO-TASK ENGINE
        </p>

        <h1 className="text-4xl font-bold mb-3">
          Find & Post Campus Tasks Easily
        </h1>

        <p className="text-gray-300 max-w-xl">
          Browse available micro-tasks or post your own tasks to get help from
          other students.
        </p>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-3 mb-8">

        <input
          type="text"
          placeholder="Search tasks..."
          className="px-4 py-2 rounded-lg bg-[#1e2f45] border border-gray-600 focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-4 py-2 rounded-lg bg-[#1e2f45] border border-gray-600"
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

        <select
          className="px-4 py-2 rounded-lg bg-[#1e2f45] border border-gray-600"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="pending">Pending</option>
          <option value="inprogress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <button
          onClick={handlePostTask}
          className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg font-semibold shadow-md"
        >
          + Post Task
        </button>
      </div>

      {/* TASK GRID */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6 justify-center w-full max-w-6xl">

        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[#13263a] border border-gray-700 rounded-2xl p-5 shadow-lg hover:scale-[1.02] transition"
            >
              <h3 className="text-lg font-semibold mb-2">
                {task.description}
              </h3>

              <p className="text-sm text-gray-300">💰 LKR {task.budget}</p>
              <p className="text-sm text-gray-300">📍 {task.location}</p>
              <p className="text-sm text-gray-300">📂 {task.category}</p>

              <span
                className={`inline-block mt-3 px-3 py-1 text-xs rounded-full text-white ${getStatusStyle(
                  task.status
                )}`}
              >
                {task.status}
              </span>

              <button
                onClick={() => navigate(`/task/${task._id}`)}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-400 py-2 rounded-lg text-sm font-semibold text-white"
              >
                View Task
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No tasks found.</p>
        )}

      </div>
    </div>
  );
};

export default TaskDashboard;