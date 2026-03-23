import React, { useState } from "react";

function PostTask({ addTask }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General"); // Example campus-based category

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) return;

    // Add task with default status "Pending"
    addTask({ title, description, category, status: "Pending", assignedTo: null });

    setTitle("");
    setDescription("");
    setCategory("General");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Post Micro-Task</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        />

        <textarea
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        >
          <option value="General">General</option>
          <option value="IT">IT</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Cleaning">Cleaning</option>
        </select>

        <button
          type="submit"
          style={{
            padding: "8px 15px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Post Task
        </button>
      </form>
    </div>
  );
}

export default PostTask;