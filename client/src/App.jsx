import React, { useState } from "react";
import TaskDashboard from "./pages/TaskDashboard";
import PostTask from "./pages/PostTask";

function App() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Add new task
  const addTask = (newTask) => {
    setTasks([...tasks, { ...newTask, id: tasks.length + 1 }]);
    setShowForm(false);
  };

  // Accept task
  const acceptTask = (taskId, user) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, assignedTo: user, status: "Pending" } : task
      )
    );
  };

  // Update status: Pending → In Progress → Completed & Confirmed
  const updateStatus = (taskId) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          let newStatus = "";
          if (task.status === "Pending") newStatus = "In Progress";
          else if (task.status === "In Progress") newStatus = "Completed & Confirmed";
          else newStatus = task.status;
          return { ...task, status: newStatus };
        }
        return task;
      })
    );
  };

  return (
    <div style={{ fontFamily: "Arial" }}>
      {showForm ? (
        <PostTask addTask={addTask} />
      ) : (
        <>
          <button
            onClick={() => setShowForm(true)}
            style={{
              margin: "20px",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            + Post Micro-Task
          </button>

          <TaskDashboard
            tasks={tasks}
            acceptTask={acceptTask}
            updateStatus={updateStatus}
          />
        </>
      )}
    </div>
  );
}

export default App;