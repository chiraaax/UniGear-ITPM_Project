import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ListChecks, ArrowRight, ShieldCheck, Users } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Task-related states
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [completing, setCompleting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Notification function
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // hide after 3 sec
  };

  // Example handlers (replace with API calls)
  const handleCompleteTask = async (taskId) => {
    setCompleting(true);
    try {
      console.log("Completing task", taskId);
      showNotification("Task completed");
    } catch (err) {
      showNotification("Failed to complete task", "error");
    } finally {
      setCompleting(false);
    }
  };

  const handleDeleteTask = (taskId) => {
    console.log("Deleting task", taskId);
    showNotification("Task deleted");
  };

  const handleDeleteItem = (itemId) => {
    console.log("Deleting item", itemId);
    showNotification("Item deleted");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1a2a] to-[#0f2a44] text-white flex flex-col justify-between">

      {/* HERO SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10 items-center">
        {/* LEFT */}
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-800/60 px-3 py-1 text-xs tracking-widest text-slate-300">
            CAMPUS PLATFORM
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Rent, Share & Earn  
            <span className="text-blue-400"> — All in One Place</span>
          </h1>
          <p className="text-gray-300 max-w-lg">
            UniGear connects students to rent equipment and complete micro-tasks on campus.
            Save time, earn money, and help your campus community.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <ShieldCheck size={16} className="text-green-400" />
              Secure transactions
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Users size={16} className="text-blue-400" />
              Student community
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
            alt="campus students"
            className="rounded-2xl shadow-2xl object-cover w-full h-[320px] md:h-[400px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a2a]/70 to-transparent rounded-2xl"></div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-7xl mx-auto px-4 pb-14 grid gap-6 md:grid-cols-2">

        {/* RENTALS */}
        <button
          onClick={() => navigate("/rentals")}
          className="group flex flex-col justify-between rounded-2xl p-6 
          bg-gradient-to-br from-sky-900/40 to-slate-900 
          border border-sky-700/40
          shadow-lg hover:shadow-sky-900/50
          transition transform hover:-translate-y-1 text-left"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Package size={26} className="text-sky-400" />
              <h2 className="text-xl font-semibold">Rental System</h2>
            </div>
            <p className="text-gray-300 text-sm">
              Rent laptops, cameras, lab tools, and more — or list your own items and earn.
            </p>
          </div>
          <div className="mt-6 inline-flex items-center text-sky-400 text-sm font-medium">
            Explore Rentals <ArrowRight className="ml-2" size={16} />
          </div>
        </button>

        {/* TASKS */}
        <button
          onClick={() => navigate("/tasks")}
          className="group flex flex-col justify-between rounded-2xl p-6 
          bg-gradient-to-br from-emerald-900/40 to-slate-900 
          border border-emerald-700/40
          shadow-lg hover:shadow-emerald-900/50
          transition transform hover:-translate-y-1 text-left"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ListChecks size={26} className="text-emerald-400" />
              <h2 className="text-xl font-semibold">Micro-task System</h2>
            </div>
            <p className="text-gray-300 text-sm">
              Post errands or complete tasks and earn money between lectures.
            </p>
          </div>
          <div className="mt-6 inline-flex items-center text-emerald-400 text-sm font-medium">
            View Tasks <ArrowRight className="ml-2" size={16} />
          </div>
        </button>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-700/70 py-6 text-center">
        <h3 className="text-lg font-semibold text-slate-100">UniGear</h3>
        <p className="text-sm text-gray-400">
          Built for students, by students.
        </p>
      </footer>

      {/* NOTIFICATION */}
      {notification && (
        <div className={`fixed bottom-5 right-5 bg-gray-800 px-4 py-2 rounded shadow-lg`}>
          {notification.message}
        </div>
      )}

    </div>
  );
};

export default Dashboard;