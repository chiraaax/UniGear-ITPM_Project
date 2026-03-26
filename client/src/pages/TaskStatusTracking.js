import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

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

      // Fetch user's tasks
      const res = await fetch(`${API_BASE}/tasks/my-tasks`, { headers });
      if (!res.ok) throw new Error('Failed to fetch tasks');

      const tasks = await res.json();

      // Calculate statistics
      const stats = {
        total: tasks.length,
        pending: 0,
        inProgress: 0,
        completed: 0,
        byCategory: {},
      };

      tasks.forEach((task) => {
        // Count by status
        if (task.status === 'Pending') stats.pending++;
        else if (task.status === 'In Progress') stats.inProgress++;
        else if (task.status === 'Completed') stats.completed++;

        // Count by category
        const cat = task.category || 'Uncategorized';
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
      });

      setTaskStats(stats);
    } catch (error) {
      console.error('Error fetching task stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTaskStats();
    }
  }, [token]);

  if (!token) {
    return (
      <div className="p-6 text-center text-slate-400">
        Please sign in to view task statistics.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-2 py-8 md:px-4">
      <h1 className="text-4xl font-bold text-slate-50 mb-8">Task Status Tracking</h1>

      {loading && <p className="text-slate-400">Loading...</p>}

      {!loading && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-base">Total Tasks</p>
              <p className="text-3xl font-bold text-slate-50">{taskStats.total}</p>
            </div>

            <div className="bg-yellow-900/20 p-5 rounded-xl border border-yellow-700/30">
              <p className="text-yellow-300 text-base">Pending</p>
              <p className="text-3xl font-bold text-yellow-400">{taskStats.pending}</p>
            </div>

            <div className="bg-blue-900/20 p-5 rounded-xl border border-blue-700/30">
              <p className="text-blue-300 text-base">In Progress</p>
              <p className="text-3xl font-bold text-blue-400">{taskStats.inProgress}</p>
            </div>

            <div className="bg-green-900/20 p-5 rounded-xl border border-green-700/30">
              <p className="text-green-300 text-base">Completed</p>
              <p className="text-3xl font-bold text-green-400">{taskStats.completed}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-slate-900 p-7 rounded-xl border border-slate-700">
            <h2 className="text-2xl font-semibold text-slate-50 mb-4">Tasks by Category</h2>

            {Object.keys(taskStats.byCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(taskStats.byCategory).map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-4 bg-slate-800 rounded-xl"
                  >
                    <span className="text-slate-300">{category}</span>
                    <span className="text-base font-semibold bg-slate-700 px-3 py-1 rounded-full text-slate-100">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No tasks with categories yet.</p>
            )}
          </div>

          {/* Status Chart */}
          <div className="bg-slate-900 p-7 rounded-xl border border-slate-700">
            <h2 className="text-2xl font-semibold text-slate-50 mb-4">Status Distribution</h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">Pending</span>
                  <span className="text-yellow-400 font-semibold">
                    {taskStats.total > 0
                      ? Math.round((taskStats.pending / taskStats.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        taskStats.total > 0
                          ? (taskStats.pending / taskStats.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">In Progress</span>
                  <span className="text-blue-400 font-semibold">
                    {taskStats.total > 0
                      ? Math.round((taskStats.inProgress / taskStats.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        taskStats.total > 0
                          ? (taskStats.inProgress / taskStats.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-base mb-2">
                  <span className="text-slate-300">Completed</span>
                  <span className="text-green-400 font-semibold">
                    {taskStats.total > 0
                      ? Math.round((taskStats.completed / taskStats.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        taskStats.total > 0
                          ? (taskStats.completed / taskStats.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatusTracking;
