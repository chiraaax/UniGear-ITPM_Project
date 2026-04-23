import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const TaskStatusDashboard = () => {
  //  ONLY ONE STATE (FIXED)
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    byCategory: {},
  });

  const [loading, setLoading] = useState(true);

  // FETCH TASK STATS (FIXED)
  const fetchTaskStats = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/tasks`);
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
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaskStats();
  }, [fetchTaskStats]);

  // PIE DATA
  const pieData = useMemo(() => ({
    labels: ["Academic", "Technical", "Other", "Cleaning", "Delivery"],
    datasets: [
      {
        data: [taskStats.pending, taskStats.inProgress, taskStats.completed],
        backgroundColor: ["#7999dd", "#de8abb","#f0b960", "#a1f3b4", "#ea5b7f"],
      },
    ],
  }), [taskStats]);

  // BAR DATA
  const barData = useMemo(() => ({
    labels: ["Pending", "In Progress", "Completed"],
    datasets: [
      {
        label: "Tasks",
        data: [taskStats.pending, taskStats.inProgress, taskStats.completed],
        backgroundColor: ["#facc15", "#3b82f6", "#22c55e"],
      },
    ],
  }), [taskStats]);

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

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              <div className="bg-slate-800 p-5 rounded-xl">
                <p>Total</p>
                <p className="text-2xl">{taskStats.total}</p>
              </div>

              <div className="bg-yellow-900/20 p-5 rounded-xl border border-yellow-700/30">
                <p>Pending</p>
                <p className="text-2xl">{taskStats.pending}</p>
              </div>

              <div className="bg-blue-900/20 p-5 rounded-xl border border-blue-700/30">
                <p>In Progress</p>
                <p className="text-2xl">{taskStats.inProgress}</p>
              </div>

              <div className="bg-green-900/20 p-5 rounded-xl border border-green-700/30">
                <p>Completed</p>
                <p className="text-2xl">{taskStats.completed}</p>
              </div>

            </div>

            {/* CATEGORY */}
            <div className="bg-slate-900 p-6 rounded-xl">
              <h2 className="mb-4 text-xl">Tasks by Category</h2>

              {Object.entries(taskStats.byCategory).map(([cat, count]) => (
                <div key={cat} className="flex justify-between mb-2">
                  <span>{cat}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>

            {/* CHARTS */}
            <div className="grid md:grid-cols-2 gap-6">

              <div className="bg-slate-800 p-6 rounded-xl size-[500px]">
                <h2>Category Distribution</h2>
                <Pie data={pieData} />
              </div>

              <div className="bg-slate-800 p-6 rounded-xl">
                <h2>Bar Chart</h2>
                <Bar data={barData} />
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TaskStatusDashboard;