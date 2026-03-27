import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Package,
  ListChecks,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Loader,
  User
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const StatusDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [completing, setCompleting] = useState(false);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : {};

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [meRes, itemsRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE}/users/me`, { headers }),
        fetch(`${API_BASE}/rentals/my-items`, { headers }),
        fetch(`${API_BASE}/tasks/my-tasks`, { headers }),
      ]);

      const [me, items, tasks] = await Promise.all([
        meRes.json(),
        itemsRes.json(),
        tasksRes.json(),
      ]);

      setProfile(me);
      setMyItems(Array.isArray(items) ? items : []);
      setMyTasks(Array.isArray(tasks) ? tasks : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ===== ITEMS =====
  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await fetch(`${API_BASE}/rentals/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setMyItems((prev) => prev.filter((i) => i._id !== id));
      showNotification("Item deleted");
    } catch {
      showNotification("Delete failed", "error");
    }
  };

  // ===== TASKS =====
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setMyTasks((prev) => prev.filter((t) => t._id !== id));
      showNotification("Task deleted");
    } catch {
      showNotification("Delete failed", "error");
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setCompleting(true);

      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: "Completed" }),
      });

      setMyTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "Completed" } : t))
      );

      showNotification("Task completed");
    } catch {
      showNotification("Failed", "error");
    } finally {
      setCompleting(false);
    }
  };

  const pendingTasks = myTasks.filter((t) => t.status?.toLowerCase() === "pending");
  const inProgressTasks = myTasks.filter(
    (t) => t.status?.toLowerCase().includes("progress")
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white px-4 md:px-8 py-8">

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 px-5 py-2 rounded-lg shadow-lg">
          {notification.message}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">

        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="text-blue-400" /> My Dashboard
          </h1>
          <p className="text-gray-400">Manage your rentals and tasks easily</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/add-item")}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-xl shadow hover:scale-105 transition"
          >
            <Plus size={16} /> Add Item
          </button>

          <button
            onClick={() => navigate("/tasks")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded-xl shadow hover:scale-105 transition"
          >
            <Plus size={16} /> Post Task
          </button>
        </div>

        {profile && (
          <div className="bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
            <User />
            <div>
              <p>{profile.name}</p>
              <p className="text-sm text-gray-400">{profile.email}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">

          {/* ITEMS */}
          <section>
            <h2 className="flex items-center gap-2 text-xl mb-4">
              <Package className="text-sky-400" /> My Rentals
            </h2>

            {myItems.map((item) => (
              <div key={item._id} className="bg-slate-800 p-4 rounded-xl mb-3 shadow hover:shadow-lg transition">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-400">LKR {item.dailyRate}</p>

                <div className="flex gap-2 mt-3">
                  <button className="flex items-center gap-1 text-yellow-400" onClick={() => navigate(`/edit-item/${item._id}`)}>
                    <Pencil size={14}/> Edit
                  </button>
                  <button className="flex items-center gap-1 text-red-400" onClick={() => handleDeleteItem(item._id)}>
                    <Trash2 size={14}/> Delete
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* TASKS */}
          <section>
            <h2 className="flex items-center gap-2 text-xl mb-4">
              <ListChecks className="text-emerald-400" /> My Tasks
            </h2>

            {/* Pending */}
            <h3 className="flex items-center gap-2 text-yellow-400 mb-2">
              <Clock size={16}/> Pending
            </h3>
            {pendingTasks.map((task) => (
              <div key={task._id} className="bg-slate-800 p-4 rounded-xl mb-2">
                <p>{task.description}</p>
                <p className="text-gray-400">LKR {task.budget}</p>

                <div className="flex gap-3 mt-2">
                  <button onClick={() => navigate(`/task/${task._id}`)} className="flex items-center gap-1 text-blue-400">
                    <Eye size={14}/> View
                  </button>
                  <button onClick={() => navigate(`/edit-task/${task._id}`)} className="flex items-center gap-1 text-yellow-400">
                    <Pencil size={14}/> Edit
                  </button>
                  <button onClick={() => handleDeleteTask(task._id)} className="flex items-center gap-1 text-red-400">
                    <Trash2 size={14}/> Delete
                  </button>
                </div>
              </div>
            ))}

            {/* In Progress */}
            <h3 className="flex items-center gap-2 text-blue-400 mt-6 mb-2">
              <Loader size={16}/> In Progress
            </h3>
            {inProgressTasks.map((task) => (
              <div key={task._id} className="bg-slate-800 p-4 rounded-xl mb-2">
                <p>{task.description}</p>
                <p className="text-gray-400">LKR {task.budget}</p>

                <button
                  onClick={() => handleCompleteTask(task._id)}
                  disabled={completing}
                  className="mt-2 flex items-center gap-2 bg-green-500 px-3 py-1 rounded-lg hover:bg-green-600"
                >
                  <CheckCircle size={14}/>
                  {completing ? "Completing..." : "Complete"}
                </button>
              </div>
            ))}
          </section>

        </div>
      )}
    </div>
  );
};

export default StatusDashboard;