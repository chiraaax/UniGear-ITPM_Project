import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  DollarSign,
  Folder,
  CheckCircle,
  Eye,
  PlusCircle,
} from "lucide-react";

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

      const url = `${API_BASE}/tasks${
        query.toString() ? `?${query.toString()}` : ""
      }`;

      const res = await fetch(url);
      const data = await res.json();

      setTasks(
        Array.isArray(data)
          ? data.filter((task) => task.moderationStatus === "approved")
          : []
      );
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [search, category, status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ================= STATUS COLOR =================
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

  //  STATUS IMAGE 
  const getTaskImage = (task) => {
    if (task.image) return task.image;

    switch (task.status?.toLowerCase()) {
      case "completed":
        return "https://www.shutterstock.com/image-photo/digital-checklist-task-management-concept-260nw-2637270895.jpg";
      case "inprogress":
        return "https://www.shutterstock.com/image-photo/businessman-touches-digital-progress-checklist-260nw-2520854157.jpg";
      case "pending":
        return "https://t4.ftcdn.net/jpg/17/36/15/07/360_F_1736150767_xvwNLNihVLhLMlbfWmHOnKtmr4Q2a6L8.jpg";
      default:
        return "https://www.shutterstock.com/image-photo/businessman-touches-digital-progress-checklist-260nw-2520854157.jpg";
    }
  };

  const handlePostTask = () => {
    navigate("/tasks");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1a2a] to-[#0f2a44] text-white p-6">

      {/* HERO SECTION */}
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 md:py-5 text-center">
        <h4 className="text-4xl font-bold"> MICRO-TASK ENGINE</h4>
        <p className="text-gray-300 max-w-xl mx-auto text-blue-300">
          Browse available micro-tasks or post your own tasks to get help from
          other students.
        </p>
      </div>


      {/* CONTROLS */}
      <div className="flex flex-wrap gap-3 mb-7 justify-center">

        <input
          type="text"
          placeholder="Search tasks..."
          className="px-4 py-2 rounded-lg bg-[#1e2f45] border border-gray-600 focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-4 py-2 rounded-lg bg-[#1e2f45]"
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
          className="px-4 py-2 rounded-lg bg-[#1e2f45]"
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
          className="flex items-center gap-2 bg-green-500 px-5 py-2 rounded-xl hover:bg-green-600 transition transform hover:scale-105"
        >
          <PlusCircle size={18} />
          Post Task
        </button>

      </div>

      {/* TASK GRID */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-w-7xl mx-auto">

        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[#13263a] rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition"
            >

              {/* IMAGE */}
              <div className="relative">
                <img
                  src={getTaskImage(task)}
                  alt="task"
                  className="w-full h-32 object-cover"
                />

                <div className="absolute top-2 right-2 bg-black/60 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <CheckCircle size={14} />
                  {task.status}
                </div>
              </div>

              <div className="p-5">

                {/* TITLE */}
                <h3 className="text-xl font-bold mb-3 leading-snug">
                  {task.description}
                </h3>

                {/* DETAILS */}
                <div className="text-base text-gray-200 space-y-2">

                  <div className="flex items-center gap-2">
                    <DollarSign size={18} />
                    LKR {task.budget}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    {task.location}
                  </div>

                  <div className="flex items-center gap-2">
                    <Folder size={18} />
                    {task.category}
                  </div>

                </div>

                {/* STATUS */}
                <div className="mt-4">
                  <span
                    className={`px-4 py-1.5 text-sm rounded-full text-white ${getStatusStyle(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                </div>

                {/* BUTTON */}
                {/* BUTTON */}
        <button
          onClick={() => navigate(`/task/${task._id}`)}
         className="mt-4 w-full flex items-center justify-center gap-2 
             py-2 rounded-lg text-sm font-semibold text-white 
             border border-#80A3A5
             bg-gradient-to-r from-emerald-500 to-#80A3A5
             hover:from-#80A3A5 hover:to-#80A3A5
             transition transform hover:scale-105"
              >

                  <Eye size={20} />
                  View Task
                </button>

              </div>
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-400 text-lg">
            No tasks found
          </p>
        )}

      </div>
    </div>
  );
};

export default TaskDashboard;