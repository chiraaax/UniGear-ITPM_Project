import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import RentalPage from './pages/RentalPage';
import TaskPage from './pages/TaskPage';
import AuthPage from './pages/AuthPage';
import StatusDashboard from './pages/StatusDashboard';
import FeedbackPage from './pages/FeedbackPage';
import { useAuth } from './context/AuthContext';
import MicroTaskDashboard from './pages/MicroTaskDashboard';
import TaskStatusDashboard from './pages/TaskStatusDashboard';
import EditTask from './pages/EditTask';
import EditItem from './pages/EditItem';
import TaskStatusTracking from './pages/TaskStatusTracking';
import TaskDetail from './pages/TaskDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import FeedbackAdminDashboard from './pages/FeedbackAdminDashboard';
import TestimonialsPage from './pages/TestimonialsPage';

const AdminProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const isLight = theme === "light";

  return (
    <Router>
      <div
        className={`min-h-screen flex flex-col ${isLight ? "bg-slate-100 text-slate-900" : "bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900/60"}`}
      >
        <header
          className={`sticky top-0 z-20 border-b backdrop-blur ${isLight ? "border-slate-200 bg-white/75" : "border-slate-800/70 bg-slate-950/70"}`}
        >
          <div className="mx-auto flex max-w-8xl items-center justify-between px-2 py-3 md:px-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-12 items-center justify-center rounded-2xl bg-sky-500/20 ring-1 ring-sky-500/60">
                <span
                  className={`text-sm font-semibold ${isLight ? "text-sky-700" : "text-sky-300"}`}
                >
                  UG
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-sm font-semibold tracking-[0.18em] ${isLight ? "text-slate-800" : "text-slate-200"}`}
                >
                  UNIGEAR
                </span>
                <span
                  className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}
                >
                  Campus sharing & micro-tasks
                </span>
              </div>
            </div>
            <nav
              className={`hidden items-center gap-3 text-sm md:flex ${isLight ? "text-slate-700" : "text-slate-200"}`}
            >
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive
                      ? isLight
                        ? "bg-slate-200 text-slate-900"
                        : "bg-slate-800 text-slate-50"
                      : isLight
                        ? "hover:bg-slate-200/80"
                        : "hover:bg-slate-800/60"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/rentals"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive
                      ? isLight
                        ? "bg-slate-200 text-slate-900"
                        : "bg-slate-800 text-slate-50"
                      : isLight
                        ? "hover:bg-slate-200/80"
                        : "hover:bg-slate-800/60"
                  }`
                }
              >
                Rentals
              </NavLink>
              <NavLink
                to="/micro-tasks"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive
                      ? isLight
                        ? "bg-slate-200 text-slate-900"
                        : "bg-slate-800 text-slate-50"
                      : isLight
                        ? "hover:bg-slate-200/80"
                        : "hover:bg-slate-800/60"
                  }`
                }
              >
                Micro-tasks
              </NavLink>
              <NavLink
                to="/feedback"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive
                      ? isLight
                        ? "bg-slate-200 text-slate-900"
                        : "bg-slate-800 text-slate-50"
                      : isLight
                        ? "hover:bg-slate-200/80"
                        : "hover:bg-slate-800/60"
                  }`
                }
              >
                Feedbacks
              </NavLink>

              {user && (
                <NavLink
                  to="/me"
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition ${
                      isActive
                        ? isLight
                          ? "bg-slate-200 text-slate-900"
                          : "bg-slate-800 text-slate-50"
                        : isLight
                          ? "hover:bg-slate-200/80"
                          : "hover:bg-slate-800/60"
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
                      isActive
                        ? isLight
                          ? "bg-slate-200 text-slate-900"
                          : "bg-slate-800 text-slate-50"
                        : isLight
                          ? "hover:bg-slate-200/80"
                          : "hover:bg-slate-800/60"
                    }`
                  }
                >
                  Task Status
                </NavLink>
              )}
              {user?.role === "admin" && (
                <>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `rounded-full px-3 py-1 transition ${
                        isActive
                          ? isLight
                            ? "bg-slate-200 text-slate-900"
                            : "bg-slate-800 text-slate-50"
                          : isLight
                            ? "hover:bg-slate-200/80"
                            : "hover:bg-slate-800/60"
                      }`
                    }
                  >
                    Admin
                  </NavLink>
                  <NavLink
                    to="/admin/feedbacks"
                    className={({ isActive }) =>
                      `rounded-full px-3 py-1 transition ${
                        isActive
                          ? isLight
                            ? "bg-slate-200 text-slate-900"
                            : "bg-slate-800 text-slate-50"
                          : isLight
                            ? "hover:bg-slate-200/80"
                            : "hover:bg-slate-800/60"
                      }`
                    }
                  >
                    Feedback Analytics
                  </NavLink>
                </>
              )}
            </nav>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <button
                type="button"
                onClick={toggleTheme}
                className={`rounded-full border px-3 py-1 ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600/70 text-slate-200 hover:bg-slate-800/70"}`}
              >
                {isLight ? "Dark mode" : "Light mode"}
              </button>
              {user ? (
                <>
                  <span
                    className={`hidden md:inline ${isLight ? "text-slate-700" : "text-slate-300"}`}
                  >
                    {user.name}{" "}
                    <span
                      className={isLight ? "text-slate-500" : "text-slate-500"}
                    >
                      · Trust {user.trustScore?.toFixed(1) ?? "—"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className={`rounded-full border px-3 py-1 ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600/70 text-slate-200 hover:bg-slate-800/70"}`}
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
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/edit-task/:id" element={<EditTask />} />
            <Route path="/edit-item/:id" element={<EditItem />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/feedbacks" element={<TestimonialsPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/feedbacks"
              element={
                <AdminProtectedRoute>
                  <FeedbackAdminDashboard />
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </main>
        <footer
          className={`border-t py-3 text-center text-xs ${isLight ? "border-slate-200 bg-white text-slate-500" : "border-slate-800/70 bg-slate-950/80 text-slate-500"}`}
        >
          UniGear · Built for campus communities
        </footer>
      </div>
    </Router>
  );
}

export default App;
