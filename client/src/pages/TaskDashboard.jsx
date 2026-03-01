import React, { useState, useEffect } from "react";
import axios from "axios";

function TaskDashboard() {
  const [tasks, setTasks] = useState([]);

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  // Add new task
  const addTask = async (newTask) => {
    try {
      const res = await axios.post("http://localhost:5000/api/tasks", newTask);
      setTasks([...tasks, res.data]);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  // Accept task
  const acceptTask = async (taskId, user) => {
    try {
      await axios.patch(`http://localhost:5000/api/tasks/${taskId}/accept`, { assignedTo: user });
      fetchTasks(); // refresh tasks
    } catch (err) {
      console.error("Error accepting task:", err);
    }
  };

  // Update task status
  const updateStatus = async (taskId) => {
    try {
      await axios.patch(`http://localhost:5000/api/tasks/${taskId}/status`);
      fetchTasks(); // refresh tasks
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Task Dashboard</h2>
      {tasks.length === 0 ? (
        <p>No tasks available</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "5px",
            }}
          >
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p>
              <strong>Category:</strong> {task.category}
            </p>
            <p>
              <strong>Status:</strong> {task.status}
            </p>
            <p>
              <strong>Assigned To:</strong> {task.assignedTo || "Not Assigned"}
            </p>

            {/* Accept Task Button */}
            {task.status === "Pending" && !task.assignedTo && (
              <button
                onClick={() => acceptTask(task.id, "User1")} // example user
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                Accept Task
              </button>
            )}

            {/* Update Status Button */}
            {task.assignedTo && task.status !== "Completed" && (
              <button
                onClick={() => updateStatus(task.id)}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#ffc107",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Move to Next Status
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default TaskDashboard;