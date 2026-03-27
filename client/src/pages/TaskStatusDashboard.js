import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000/api";

const EditTask = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    description: "",
    category: "",
    budget: "",
    deadline: "",
    location: "",
  });

  // 🔥 LOAD TASK DATA
  useEffect(() => {
    const fetchTask = async () => {
      const res = await fetch(`${API_BASE}/tasks/${id}`);
      const data = await res.json();
      setForm(data);
    };

    fetchTask();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Update failed");
        return;
      }

      alert("Task updated successfully");
      navigate("/status-dashboard");

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-5">
      <h2>Edit Task</h2>

      <form onSubmit={handleUpdate} className="flex flex-col gap-3">

        <input
          name="description"
          value={form.description}
          onChange={handleChange}
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Delivery">Delivery</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Academic">Academic</option>
          <option value="Technical">Technical</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="number"
          name="budget"
          value={form.budget}
          onChange={handleChange}
        />

        <input
          type="datetime-local"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
        />

        <input
          name="location"
          value={form.location}
          onChange={handleChange}
        />

        <button className="bg-green-600 text-white px-4 py-2">
          Update Task
        </button>
      </form>
    </div>
  );
};

export default EditTask;