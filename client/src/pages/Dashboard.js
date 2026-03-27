import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import '../styles/Chatbot.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-2 py-10 md:px-4 md:py-12 min-h-screen justify-between">
      
      {/* MAIN CONTENT */}
      <div className="space-y-8">
        <section className="space-y-3">
          <p className="inline-flex rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-300">
            Campus-first sharing
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            One hub for rentals and campus gigs.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            UniGear lets students safely rent equipment, share resources, and pick up micro-tasks — all
            backed by trust scores and clear handover flows.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {/* RENTALS */}
          <button
            type="button"
            onClick={() => navigate('/rentals')}
            className="group flex h-full flex-col justify-between rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-900/50 p-5 text-left shadow-xl shadow-sky-900/40 transition hover:-translate-y-1 hover:border-sky-400/80 hover:shadow-2xl"
          >
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-sky-900/50 px-3 py-1 text-xs font-medium text-sky-200 ring-1 ring-sky-500/40">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Rentals engine
              </p>
              <h2 className="text-lg font-semibold text-slate-50">UniGear Rental System</h2>
              <p className="text-sm text-slate-300">
                Monetize idle electronics, lab gear, and sports equipment, or quickly find what you need.
              </p>
            </div>
            <p className="mt-4 inline-flex items-center text-sm font-medium text-sky-300">
              Explore rentals →
            </p>
          </button>

          {/* TASKS */}
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="group flex h-full flex-col justify-between rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-900/50 p-5 text-left shadow-xl shadow-emerald-900/40 transition hover:-translate-y-1 hover:border-emerald-400/80 hover:shadow-2xl"
          >
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Micro-task engine
              </p>
              <h2 className="text-lg font-semibold text-slate-50">UniGear Micro-task System</h2>
              <p className="text-sm text-slate-300">
                Post errands or pick up quick gigs to earn between lectures.
              </p>
            </div>
            <p className="mt-4 inline-flex items-center text-sm font-medium text-emerald-200">
              View job board →
            </p>
          </button>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="mt-10 border-t border-slate-700/70 pt-6 text-center">
        <div className="space-y-2">
          
          <h3 className="text-lg font-semibold text-slate-100">
            UniGear
          </h3>

          <p className="text-sm text-slate-400">
            Built for students — Rent, Share, and Earn smarter on campus.
          </p>

          <div className="flex justify-center gap-6 pt-3 text-sm text-slate-400">
            <button
              onClick={() => navigate('/rentals')}
              className="hover:text-sky-400 transition"
            >
              Rentals
            </button>

            <button
              onClick={() => navigate('/tasks')}
              className="hover:text-emerald-400 transition"
            >
              Tasks
            </button>

            <button
              onClick={() => navigate('/feedback')}
              className="hover:text-yellow-400 transition"
            >
              Feedback
            </button>
          </div>

          <p className="pt-4 text-xs text-slate-500">
            © {new Date().getFullYear()} UniGear. All rights reserved.
          </p>

        </div>
      </footer>
    </div>

    {/* CHATBOT */}
    {!isChatOpen && (
      <div className="chatbot-icon" onClick={() => setIsChatOpen(true)}>
        <span className="logo-part">🤖</span>
      </div>
    )}
    {isChatOpen && <Chatbot closeChat={() => setIsChatOpen(false)} />}
    </>
  );
};

export default Dashboard;