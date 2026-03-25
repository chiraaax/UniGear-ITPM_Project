import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import RentalPage from './pages/RentalPage';
import TaskPage from './pages/TaskPage';
import AuthPage from './pages/AuthPage';
import StatusDashboard from './pages/StatusDashboard';
import FeedbackPage from './pages/FeedbackPage';
import { useAuth } from './context/AuthContext';
import MicroTaskDashboard  from './pages/MicroTaskDashboard';
import TaskStatusDashboard from './pages/TaskStatusDashboard';
import EditTask from './pages/EditTask';
import EditItem from './pages/EditItem';
import TaskStatusTracking from './pages/TaskStatusTracking';

function App() {
  const { user, logout } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900/60 flex flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/20 ring-1 ring-sky-500/60">
                <span className="text-sm font-semibold text-sky-300">UG</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-[0.18em] text-slate-200">
                  UNIGEAR
                </span>
                <span className="text-xs text-slate-400">Campus sharing & micro-tasks</span>
              </div>
            </div>
            <nav className="hidden items-center gap-3 text-sm text-slate-200 md:flex">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive ? 'bg-slate-800 text-slate-50' : 'hover:bg-slate-800/60'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/rentals"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive ? 'bg-slate-800 text-slate-50' : 'hover:bg-slate-800/60'
                  }`
                }
              >
                Rentals
              </NavLink>
              <NavLink
                to="/micro-tasks"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive ? 'bg-slate-800 text-slate-50' : 'hover:bg-slate-800/60'
                  }`
                }
              >
                Micro-tasks
              </NavLink>
              <NavLink
                to="/feedback"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive ? 'bg-slate-800 text-slate-50' : 'hover:bg-slate-800/60'
                  }`
                }
              >
                Feedback
              </NavLink>
              {user && (
                <NavLink
                  to="/me"
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition ${
                      isActive ? 'bg-slate-800 text-slate-50' : 'hover:bg-slate-800/60'
                    }`
                  }
                >
                  My activity
                </NavLink>
              )}
              {user && (
                <NavLink
                  to="/task-tracking"
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition ${
                      isActive ? 'bg-slate-800 text-slate-50' : 'hover:bg-slate-800/60'
                    }`
                  }
                >
                  Task Status
                </NavLink>
              )}
            </nav>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              {user ? (
                <>
                  <span className="hidden text-slate-300 md:inline">
                    {user.name}{' '}
                    <span className="text-slate-500">· Trust {user.trustScore?.toFixed(1) ?? '—'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-full border border-slate-600/70 px-3 py-1 text-slate-200 hover:bg-slate-800/70"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="rounded-full bg-sky-500/90 px-3 py-1 font-medium text-slate-950 shadow-sm hover:bg-sky-400"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/rentals" element={<RentalPage />} />
            <Route path="/tasks" element={<TaskPage />} />
            <Route path="/me" element={<StatusDashboard />} />
            <Route path="/micro-tasks" element={<MicroTaskDashboard />} />
            <Route path="/status-tasks" element={<TaskStatusDashboard />} />
            <Route path="/task-tracking" element={<TaskStatusTracking />} />
            <Route path="/edit-task/:id" element={<EditTask />} />
            <Route path="/edit-item/:id" element={<EditItem />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-800/70 bg-slate-950/80 py-3 text-center text-xs text-slate-500">
          UniGear · Built for campus communities
        </footer>
      </div>
    </Router>
  );
}

export default App;
