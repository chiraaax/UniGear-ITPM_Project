import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ClipboardList,
  Clock,
  Loader,
  CheckCircle,
  Folder,
  BarChart3,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const TaskStatusTracking = () => {
  const { token } = useAuth();
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    byCategory: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchTaskStats = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API_BASE}/tasks/my-tasks`, { headers });
      if (!res.ok) throw new Error("Failed to fetch tasks");

      const tasks = await res.json();

      const stats = {
        total: tasks.length,
        pending: 0,
        inProgress: 0,
        completed: 0,
        byCategory: {},
      };

      tasks.forEach((task) => {
        if (task.status === "Pending") stats.pending++;
        else if (task.status === "In Progress") stats.inProgress++;
        else if (task.status === "Completed") stats.completed++;

        const cat = task.category || "Uncategorized";
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
      });

      setTaskStats(stats);
    } catch (error) {
      console.error("Error fetching task stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTaskStats();
  }, [token]);

  if (!token) {
    return (
      <div className="p-6 text-center text-slate-400">
        Please sign in to view task statistics.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1a2a] to-[#0f2a44] text-white px-4 py-10">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="text-blue-400" size={28} />
          <h1 className="text-4xl font-bold">Task Analytics Dashboard</h1>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <div className="space-y-8">

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              {/* TOTAL */}
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-lg hover:scale-105 transition">
                <div className="flex items-center gap-3 mb-2">
                  <ClipboardList className="text-white" />
                  <p className="text-slate-400">Total Tasks</p>
                </div>
                <p className="text-3xl font-bold">{taskStats.total}</p>
              </div>

              {/* PENDING */}
              <div className="bg-yellow-900/20 p-5 rounded-2xl border border-yellow-700/30 shadow-lg hover:scale-105 transition">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="text-yellow-400" />
                  <p className="text-yellow-300">Pending</p>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{taskStats.pending}</p>
              </div>

              {/* IN PROGRESS */}
              <div className="bg-blue-900/20 p-5 rounded-2xl border border-blue-700/30 shadow-lg hover:scale-105 transition">
                <div className="flex items-center gap-3 mb-2">
                  <Loader className="text-blue-400" />
                  <p className="text-blue-300">In Progress</p>
                </div>
                <p className="text-3xl font-bold text-blue-400">{taskStats.inProgress}</p>
              </div>

              {/* COMPLETED */}
              <div className="bg-green-900/20 p-5 rounded-2xl border border-green-700/30 shadow-lg hover:scale-105 transition">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="text-green-400" />
                  <p className="text-green-300">Completed</p>
                </div>
                <p className="text-3xl font-bold text-green-400">{taskStats.completed}</p>
              </div>
            </div>

            {/* CATEGORY SECTION */}
            <div className="bg-slate-900 p-7 rounded-2xl border border-slate-700 shadow-lg">
              <div className="flex items-center gap-2 mb-5">
                <Folder className="text-purple-400" />
                <h2 className="text-2xl font-semibold">Tasks by Category</h2>
              </div>

              {Object.keys(taskStats.byCategory).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(taskStats.byCategory).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
                    >
                      <span>{category}</span>
                      <span className="bg-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No tasks available.</p>
              )}
            </div>

            {/* STATUS PROGRESS */}
            <div className="bg-slate-900 p-7 rounded-2xl border border-slate-700 shadow-lg">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="text-indigo-400" />
                <h2 className="text-2xl font-semibold">Status Distribution</h2>
              </div>

              {[
                { label: "Pending", value: taskStats.pending, color: "bg-yellow-500" },
                { label: "In Progress", value: taskStats.inProgress, color: "bg-blue-500" },
                { label: "Completed", value: taskStats.completed, color: "bg-green-500" },
              ].map((item) => {
                const percent =
                  taskStats.total > 0
                    ? Math.round((item.value / taskStats.total) * 100)
                    : 0;

                return (
                  <div key={item.label} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-semibold">{percent}%</span>
                    </div>

                    <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TaskStatusTracking;