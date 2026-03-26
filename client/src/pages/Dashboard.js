import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-2 py-10 md:px-4 md:py-12">
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
              Monetize idle electronics, lab gear, and sports equipment, or quickly find what you need for
              your next class, meetup, or project.
            </p>
          </div>
          <p className="mt-4 inline-flex items-center text-sm font-medium text-sky-300">
            Explore rentals
            <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
          </p>
        </button>

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
              Post errands and academic help you need, or pick up quick, well-scoped gigs to earn money
              between lectures.
            </p>
          </div>
          <p className="mt-4 inline-flex items-center text-sm font-medium text-emerald-200">
            View job board
            <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
          </p>
        </button>
      </section>
    </div>
  );
};

export default Dashboard;

