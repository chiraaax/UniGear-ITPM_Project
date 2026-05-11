import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlusCircle } from "lucide-react";


const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const TaskPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    description: "",
    budget: "",
    deadline: "",
    location: "",
    category: "", // added
  });

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Please sign in to post a task.");
      navigate("/auth");
      return;
    }

    // Validate category is selected
    if (!form.category || form.category === "") {
      alert("Please select a category for your task.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to post task");
        return;
      }

      JSON.stringify({
        ...form,
        category: form.category.trim(),
        budget: Number(form.budget),
      });

      // reset form
      setForm({
        description: "",
        budget: "",
        deadline: "",
        location: "",
        category: "",
      });

      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="module-page-container">
      <h1>UniGear Micro-task System</h1>
      <p className="module-description">
        Post one-off errands or browse the live job board to pick up tasks and
        earn on campus.
      </p>

      <div className="module-layout">
      {/* FORM SECTION */}
<section className="module-section mt-8">
  <h2 className="text-2xl font-semibold text-#3a4c40 mb-4">
    Post a New Task
  </h2>

  <form
    onSubmit={handleSubmit}
    className="bg-slate-900 border border-emerald-800 rounded-2xl p-6 space-y-4 shadow-lg"
  >
    {/* Description */}
    <label className="block text-sm font-medium text-slate-300">
      Description
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        required
        className="mt-1 w-full bg-slate-800 text-white rounded-lg border border-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 p-2 outline-none"
      />
    </label>

    {/* Category */}
    <label className="block text-sm font-medium text-slate-300">
      Category
      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        required
        className="mt-1 w-full bg-slate-800 text-white rounded-lg border border-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 p-2 outline-none"
      >
        <option value="">Select Category</option>
        <option value="Delivery">Delivery</option>
        <option value="Cleaning">Cleaning</option>
        <option value="Academic">Academic</option>
        <option value="Technical">Technical</option>
        <option value="Other">Other</option>
      </select>
    </label>

    {/* Budget */}
    <label className="block text-sm font-medium text-slate-300">
      Budget (LKR)
      <input
        type="number"
        min="0"
        name="budget"
        value={form.budget}
        onChange={handleChange}
        required
        className="mt-1 w-full bg-slate-800 text-white rounded-lg border border-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 p-2 outline-none"
      />
    </label>

    {/* Deadline */}
    <label className="block text-sm font-medium text-slate-300">
      Deadline
      <input
        type="datetime-local"
        name="deadline"
        value={form.deadline}
        onChange={handleChange}
        required
        className="mt-1 w-full bg-slate-800 text-white rounded-lg border border-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 p-2 outline-none"
      />
    </label>

    {/* Location */}
    <label className="block text-sm font-medium text-slate-300">
      Location
      <input
        name="location"
        value={form.location}
        onChange={handleChange}
        placeholder="e.g. Main Library, Lab 3B"
        required
        className="mt-1 w-full bg-slate-800 text-white rounded-lg border border-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 p-2 outline-none"
      />
    </label>

    {/* Button */}
   <button
  type="submit"
  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 
             hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-2 rounded-lg 
             transition transform hover:scale-105 shadow-md shadow-emerald-500/20"
>
  <PlusCircle className="w-5 h-5" />
  Post Task
</button>
          </form>
        </section>

        {/* TASK LIST SECTION */}
        <section className="module-section">
          <h2>Live Job Board</h2>
          <div className="list-grid">
            {tasks.map((task) => (
              <div key={task._id} className="list-card">
                <h3>{task.description}</h3>

                <p className="muted">Category: {task.category || "N/A"}</p>

                <p className="muted">
                  Budget: LKR {task.budget} · Deadline:{" "}
                  {task.deadline
                    ? new Date(task.deadline).toLocaleString()
                    : "N/A"}
                </p>

                <p className="muted">Location: {task.location}</p>

                <p className="tag status-tag">{task.status}</p>

                {task.creator && (
                  <p className="muted small">
                    Posted by: {task.creator.name} (Trust{" "}
                    {task.creator.trustScore?.toFixed(1)})
                  </p>
                )}
              </div>
            ))}

            {tasks.length === 0 && (
              <p className="muted">No tasks on the board yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TaskPage;
