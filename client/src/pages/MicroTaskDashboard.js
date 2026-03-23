import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      let query = [];

      if (search) query.push(`search=${search}`);
      if (category !== "All") query.push(`category=${category}`);
      if (status !== "All") query.push(`status=${status}`);

      const queryString = query.length ? `?${query.join("&")}` : "";

      const res = await fetch(`${API_BASE}/tasks${queryString}`);
      const data = await res.json();

      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };
  
// Navigation to post task page
  const navigate = useNavigate();
  const handlePostTask = () => {
  navigate("/tasks"); // change path if needed
};


  // Load tasks on page load + filter change
  useEffect(() => {
    fetchTasks();
  }, [search, category, status]);

  // Status color styles
  const getStatusStyle = (status) => {
    switch (status) {
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

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <input
          type="text"
          placeholder="Search tasks..."
          className="px-3 py-2 border rounded-md w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Category */}
        <select
          className="px-3 py-2 border rounded-md bg-gray-500 text-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Errands">Errands</option>
          <option value="Technical">Technical</option>
          <option value="Design">Design</option>
        </select>

        {/* Status */}
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

        {/* Button */}
        <button
  onClick={handlePostTask}
  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
>
  + Post Task
</button>
      </div>

      {/* Task Cards */}
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
                  task.status
                )}`}
              >
                {task.status}
              </span>
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