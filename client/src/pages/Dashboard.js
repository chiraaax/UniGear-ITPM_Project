import React, { useState, useEffect } from "react";
import Chatbot from '../components/Chatbot';
import '../styles/Chatbot.css';
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Package,
  ArrowRight,
  ListChecks
} from "lucide-react";
const Dashboard = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1a2a] to-[#0f2a44] text-white">

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
            Save time, earn money, and help your campus community with a simple and secure system.
          </p>

          {/* SMALL FEATURES */}
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

      {/* MAIN FEATURES (EQUAL PRIORITY) */}
      <div className="max-w-7xl mx-auto px-4 pb-14 grid gap-8 md:grid-cols-2">

        {/* RENTALS CARD */}
        <div
          onClick={() => navigate("/rentals")}
          className="group cursor-pointer flex flex-col justify-between 
                     rounded-2xl p-6 
                     bg-gradient-to-br from-sky-900/40 to-slate-900 
                     border border-sky-700/40
                     shadow-lg hover:shadow-sky-900/50
                     transition transform hover:-translate-y-1"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Package size={26} className="text-sky-400" />
              <h2 className="text-xl font-semibold">Rental System</h2>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              Rent laptops, cameras, lab tools, and more from fellow students. 
              Or list your own items and earn extra income easily.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>✔ Easy item listing</li>
              <li>✔ Safe handover process</li>
              <li>✔ Flexible pricing</li>
            </ul>
          </div>

          <div className="mt-6 flex items-center bg-sky-900/40 text-sky-400 text-sm font-medium w-60 h-10 text-center justify-center rounded-full group-hover:bg-sky-900/60 transition transform hover:translate-x-1">
            Explore Rentals
            <ArrowRight className="ml-2 transition group-hover:translate-x-1" size={16} />
          </div>
        </div>

        {/* TASKS CARD */}
        <div
          onClick={() => navigate("/tasks")}
          className="group cursor-pointer flex flex-col justify-between 
                     rounded-2xl p-6 
                     bg-gradient-to-br from-emerald-900/40 to-slate-900 
                     border border-emerald-700/40
                     shadow-lg hover:shadow-emerald-900/50
                     transition transform hover:-translate-y-1"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ListChecks size={26} className="text-emerald-400" />
              <h2 className="text-xl font-semibold">Micro-task System</h2>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              Post tasks like assignments, deliveries, or errands — or complete tasks and earn money between lectures.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>✔ Quick job posting</li>
              <li>✔ Earn instantly</li>
              <li>✔ Campus-based tasks</li>
            </ul>
          </div>

         <div className="mt-6 flex items-center bg-emerald-900/40 text-emerald-400 text-sm font-medium w-60 h-10 text-center justify-center rounded-full group-hover:bg-emerald-900/60 transition transform hover:translate-x-1">
            View Tasks
            <ArrowRight className="ml-2 transition group-hover:translate-x-1" size={16} />
          </div>
        </div>

      </div>
    </div>

    // {/* CHATBOT */}
    // {!isChatOpen && (
    //   <div className="chatbot-icon" onClick={() => setIsChatOpen(true)}>
    //     <span className="logo-part">🤖</span>
    //   </div>
    // )}
    // {isChatOpen && <Chatbot closeChat={() => setIsChatOpen(false)} />}
    // </>
  );
};

export default Dashboard;