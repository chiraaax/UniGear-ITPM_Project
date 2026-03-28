import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, DollarSign, Folder, CheckCircle } from "lucide-react";
import { Eye } from "lucide-react";
import { PlusCircle } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const navigate = useNavigate();

  // ================= FETCH TASKS =================
  const fetchTasks = useCallback(async () => {
    try {
      let query = new URLSearchParams();
      if (search.trim()) query.append("search", search.trim());
      if (category !== "All") query.append("category", category);
      if (status !== "All") query.append("status", status);

      const url = `${API_BASE}/tasks${query.toString() ? `?${query.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      setTasks(
        Array.isArray(data)
          ? data.filter((task) => task.moderationStatus === "approved")
          : [],
      );
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [search, category, status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handlePostTask = () => {
    navigate("/tasks");
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-600";
      case "inprogress":
        return "bg-blue";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1a2a] to-[#0f2a44] text-white p-6">
      {/* HERO SECTION */}
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 md:py-12 text-center">
        <p className="text-sm tracking-widest text-blue-300">
          MICRO-TASK ENGINE
        </p>
        <h1 className="text-4xl font-bold">Find & Post Campus Tasks Easily</h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Browse available micro-tasks or post your own tasks to get help from
          other students.
        </p>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
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
          className="group bg-gradient-to-r from-emerald-500 to-emerald-600 
             hover:from-emerald-500 hover:to-green-600
             px-5 py-2 rounded-xl font-semibold text-white
             flex items-center gap-2
             shadow-lg hover:shadow-2xl
             transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <PlusCircle
            size={18}
            className="drop-shadow-md group-hover:rotate-90 transition-transform duration-300"
          />
          Post Task
        </button>
      </div>

      {/* TASK GRID */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6 max-w-6xl mx-auto">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[#13263a] border border-gray-700 rounded-2xl p-5 shadow-lg hover:scale-[1.03] transition transform"
            >
              <h3 className="text-lg font-semibold mb-3 bg-gray-700/50 px-2 py-1 rounded-full inline-block">
                {task.description}
              </h3>

              <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                <DollarSign size={16} /> LKR {task.budget}
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                <MapPin size={16} /> {task.location}
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                <Folder size={16} /> {task.category}
              </div>

              

              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full text-white ${getStatusStyle(
                    task.status,
                  )}`}
                >
                  <CheckCircle size={14} /> {task.status}
                </span>
              </div>

              <button
                onClick={() => navigate(`/task/${task._id}`)}
                className="mt-4 w-full flex items-center justify-center gap-2 
             py-2 rounded-lg text-sm font-semibold text-white 
             border border-#80A3A5
             bg-gradient-to-r from-emerald-500 to-#80A3A5
             hover:from-#80A3A5 hover:to-#80A3A5
             transition transform hover:scale-105"
              >
                <Eye size={16} />
                View Task
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center col-span-full">
            No tasks found.
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskDashboard;
