import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const DEFAULT_AUDIT_PAGE_SIZE = 25;

const REJECTION_REASONS = [
  { value: 'unsafe_content', label: 'Unsafe content' },
  { value: 'spam', label: 'Spam / advertising' },
  { value: 'duplicate', label: 'Duplicate submission' },
  { value: 'pricing_abuse', label: 'Pricing abuse' },
  { value: 'missing_information', label: 'Missing information' },
  { value: 'other', label: 'Other' },
];

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [drawerMode, setDrawerMode] = useState(null); // 'editRental' | 'rejectRental' | 'editTask' | 'rejectTask'
  const [isLoading, setIsLoading] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedRentalIds, setSelectedRentalIds] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [rejectDraft, setRejectDraft] = useState(null); // { key, reasonCode, note }
  const [rentalQuery, setRentalQuery] = useState('');
  const [taskQuery, setTaskQuery] = useState('');
  const [logFilters, setLogFilters] = useState({
    action: '',
    targetType: '',
    q: '',
    from: '',
    to: '',
    limit: DEFAULT_AUDIT_PAGE_SIZE,
    page: 1,
  });
  const [savedAuditViews, setSavedAuditViews] = useState([]);
  const [selectedSavedAuditViewId, setSelectedSavedAuditViewId] = useState('');

  const persistSavedAuditViews = (views) => {
    try {
      localStorage.setItem('admin_audit_saved_views', JSON.stringify(views));
    } catch (err) {
      // Ignore storage errors
    }
  };
  const [rentalForm, setRentalForm] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    dailyRate: '',
    isActive: true,
  });
  const [taskForm, setTaskForm] = useState({
    description: '',
    category: 'Delivery',
    budget: '',
    deadline: '',
    location: '',
    status: 'Pending',
  });

  const pushToast = (type, title, message) => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [{ id, type, title, message }, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setRejectDraft(null);
    setEditingRental(null);
    setEditingTask(null);
  };

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rentalsRes, tasksRes, usersRes, analyticsRes, queueRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/rentals?moderationStatus=all`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/tasks?moderationStatus=all`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/users`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/analytics`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/queue-stats`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/audit-logs?page=1&limit=${DEFAULT_AUDIT_PAGE_SIZE}`, { headers: authHeaders }),
      ]);
      const [rentalsData, tasksData, usersData, analyticsData, queueData, logsData] = await Promise.all([
        rentalsRes.json(),
        tasksRes.json(),
        usersRes.json(),
        analyticsRes.json(),
        queueRes.json(),
        logsRes.json(),
      ]);
      if (!rentalsRes.ok || !tasksRes.ok || !usersRes.ok || !analyticsRes.ok || !queueRes.ok || !logsRes.ok) {
        setError(
          rentalsData.message || tasksData.message || usersData.message || logsData.message || 'Failed to load admin data.'
        );
        return;
      }
      setRentals(rentalsData);
      setTasks(tasksData);
      setUsers(usersData);
      setAuditLogs(Array.isArray(logsData?.items) ? logsData.items : []);
      setAuditTotal(Number(logsData?.total) || 0);
      setAnalytics(analyticsData);
      setQueueStats(queueData);
      setError('');
    } catch (err) {
      setError('Failed to load admin dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

  const loadAuditLogs = useCallback(async (overrideFilters = null) => {
    const f = overrideFilters || logFilters;
    const qs = new URLSearchParams();
    if (f.action) qs.append('action', f.action);
    if (f.targetType) qs.append('targetType', f.targetType);
    if (f.q) qs.append('q', f.q);
    if (f.from) qs.append('from', f.from);
    if (f.to) qs.append('to', f.to);
    qs.append('limit', String(f.limit || DEFAULT_AUDIT_PAGE_SIZE));
    qs.append('page', String(f.page || 1));

    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs?${qs.toString()}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to load audit logs.');
        return;
      }
      setAuditLogs(Array.isArray(data?.items) ? data.items : []);
      setAuditTotal(Number(data?.total) || 0);
      setError('');
    } catch (err) {
      setError('Failed to load audit logs.');
    }
  }, [authHeaders, logFilters]);

  const exportAuditLogsCsv = async () => {
    const f = logFilters;
    const qs = new URLSearchParams();
    if (f.action) qs.append('action', f.action);
    if (f.targetType) qs.append('targetType', f.targetType);
    if (f.q) qs.append('q', f.q);
    if (f.from) qs.append('from', f.from);
    if (f.to) qs.append('to', f.to);
    // Export current filter up to a safe cap.
    qs.append('limit', '1000');

    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs/export?${qs.toString()}`, { headers: authHeaders });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'Export failed.');
        return;
      }
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setError('');
    } catch (err) {
      setError('Export failed.');
    }
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadData();
    }
  }, [token, user?.role, loadData]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_audit_saved_views');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedAuditViews(parsed);
      }
    } catch (err) {
      // Ignore storage errors
    }
  }, []);

  const pendingRentals = useMemo(
    () =>
      rentals.filter((rental) => {
        if (rental.moderationStatus !== 'pending') return false;
        if (!rentalQuery.trim()) return true;
        const q = rentalQuery.trim().toLowerCase();
        return (
          String(rental.title || '').toLowerCase().includes(q) ||
          String(rental.description || '').toLowerCase().includes(q) ||
          String(rental.category || '').toLowerCase().includes(q)
        );
      }),
    [rentals, rentalQuery]
  );
  const pendingTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.moderationStatus !== 'pending') return false;
        if (!taskQuery.trim()) return true;
        const q = taskQuery.trim().toLowerCase();
        return (
          String(task.description || '').toLowerCase().includes(q) ||
          String(task.location || '').toLowerCase().includes(q) ||
          String(task.category || '').toLowerCase().includes(q)
        );
      }),
    [tasks, taskQuery]
  );

  const moderateRequest = async (type, id, moderationStatus, { moderationReasonCode = null, moderationNote = '' } = {}) => {
    const res = await fetch(`${API_BASE}/admin/${type}/${id}/moderate`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ moderationStatus, moderationReasonCode, moderationNote }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Action failed.');
    }
    return data;
  };

  const moderate = async (type, id, moderationStatus, options) => {
    try {
      await moderateRequest(type, id, moderationStatus, options);
      if (moderationStatus === 'approved') {
        pushToast('success', 'Approved', `Successfully approved ${type.slice(0, -1)}.`);
      } else if (moderationStatus === 'rejected') {
        pushToast('error', 'Rejected', `Successfully rejected ${type.slice(0, -1)}.`);
      }
      loadData();
    } catch (err) {
      const msg = err?.message || 'Action failed.';
      setError(msg);
      pushToast('error', 'Action failed', msg);
    }
  };

  const toggleId = (arr, id) => {
    const next = new Set(arr);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return Array.from(next);
  };

  const bulkModerate = async (type, ids, moderationStatus, options) => {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map((id) => moderateRequest(type, id, moderationStatus, options)));
      pushToast(
        'success',
        'Bulk action complete',
        `${moderationStatus === 'approved' ? 'Approved' : 'Rejected'} ${ids.length} ${type}.`
      );
      setSelectedRentalIds([]);
      setSelectedTaskIds([]);
      setRejectDraft(null);
      loadData();
    } catch (err) {
      const msg = err?.message || 'Bulk action failed.';
      setError(msg);
      pushToast('error', 'Bulk action failed', msg);
    }
  };

  const deleteEntity = async (type, id) => {
    const res = await fetch(`${API_BASE}/admin/${type}/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.message || 'Delete failed.';
      setError(msg);
      pushToast('error', 'Delete failed', msg);
      return;
    }
    pushToast('success', 'Deleted', `${type.slice(0, -1)} removed successfully.`);
    loadData();
  };

  const openRentalEditor = (item) => {
    setEditingRental(item._id);
    setRentalForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'Electronics',
      dailyRate: item.dailyRate ?? '',
      isActive: !!item.isActive,
    });
    setDrawerMode('editRental');
  };

  const openTaskEditor = (task) => {
    setEditingTask(task._id);
    setTaskForm({
      description: task.description || '',
      category: task.category || 'Delivery',
      budget: task.budget ?? '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      location: task.location || '',
      status: task.status || 'Pending',
    });
    setDrawerMode('editTask');
  };

  const openRejectRentalDrawer = (item) => {
    setRejectDraft({
      key: `rentals:${item._id}`,
      type: 'rentals',
      id: item._id,
      reasonCode: 'other',
      note: '',
    });
    setDrawerMode('rejectRental');
  };

  const openRejectTaskDrawer = (task) => {
    setRejectDraft({
      key: `tasks:${task._id}`,
      type: 'tasks',
      id: task._id,
      reasonCode: 'other',
      note: '',
    });
    setDrawerMode('rejectTask');
  };

  const confirmRejectFromDrawer = async () => {
    if (!rejectDraft?.id || !rejectDraft?.reasonCode) return;
    const type = rejectDraft.type; // 'rentals' | 'tasks'
    try {
      await moderateRequest(type, rejectDraft.id, 'rejected', {
        moderationReasonCode: rejectDraft.reasonCode,
        moderationNote: rejectDraft.note || '',
      });
      pushToast('success', 'Rejected', `Submission rejected successfully.`);
      closeDrawer();
      loadData();
    } catch (err) {
      const msg = err?.message || 'Reject failed.';
      setError(msg);
      pushToast('error', 'Reject failed', msg);
    }
  };

  const submitRentalEdit = async (id) => {
    const res = await fetch(`${API_BASE}/admin/rentals/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        ...rentalForm,
        dailyRate: Number(rentalForm.dailyRate),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.message || 'Failed to update rental.';
      setError(msg);
      pushToast('error', 'Rental update failed', msg);
      return;
    }
    pushToast('success', 'Rental updated', 'Changes saved successfully.');
    closeDrawer();
    loadData();
  };

  const submitTaskEdit = async (id) => {
    const res = await fetch(`${API_BASE}/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        ...taskForm,
        budget: Number(taskForm.budget),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.message || 'Failed to update task.';
      setError(msg);
      pushToast('error', 'Task update failed', msg);
      return;
    }
    pushToast('success', 'Task updated', 'Changes saved successfully.');
    closeDrawer();
    loadData();
  };

  const toggleSuspended = async (targetUser) => {
    const res = await fetch(`${API_BASE}/admin/users/${targetUser._id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isSuspended: !targetUser.isSuspended }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.message || 'Failed to update user.';
      setError(msg);
      pushToast('error', 'User update failed', msg);
      return;
    }
    pushToast('success', 'User updated', targetUser.isSuspended ? 'User unsuspended.' : 'User suspended.');
    loadData();
  };

  const toggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin';
    const res = await fetch(`${API_BASE}/admin/users/${targetUser._id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ role: nextRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.message || 'Failed to update role.';
      setError(msg);
      pushToast('error', 'Role update failed', msg);
      return;
    }
    pushToast('success', 'Role updated', `User is now ${nextRole}.`);
    loadData();
  };

  const saveCurrentAuditView = () => {
    const name = window.prompt('Name this audit log view:');
    if (!name || !String(name).trim()) return;

    const newView = {
      id: String(Date.now()),
      name: String(name).trim(),
      filters: {
        action: logFilters.action,
        targetType: logFilters.targetType,
        q: logFilters.q,
        from: logFilters.from,
        to: logFilters.to,
        limit: logFilters.limit,
      },
    };

    const nextViews = [newView, ...savedAuditViews];
    setSavedAuditViews(nextViews);
    persistSavedAuditViews(nextViews);
    setSelectedSavedAuditViewId(newView.id);
  };

  const deleteSelectedAuditView = () => {
    if (!selectedSavedAuditViewId) return;
    const nextViews = savedAuditViews.filter((v) => v.id !== selectedSavedAuditViewId);
    setSavedAuditViews(nextViews);
    persistSavedAuditViews(nextViews);
    setSelectedSavedAuditViewId('');
  };

  const applySavedAuditView = (view) => {
    const nextFilters = {
      action: view?.filters?.action || '',
      targetType: view?.filters?.targetType || '',
      q: view?.filters?.q || '',
      from: view?.filters?.from || '',
      to: view?.filters?.to || '',
      limit: view?.filters?.limit || DEFAULT_AUDIT_PAGE_SIZE,
      page: 1,
    };
    setLogFilters(nextFilters);
    loadAuditLogs(nextFilters);
  };

  const auditPageSize = logFilters.limit || DEFAULT_AUDIT_PAGE_SIZE;
  const totalAuditPages = Math.max(Math.ceil(auditTotal / auditPageSize), 1);

  const SkeletonCard = () => (
    <div className="list-card animate-pulse">
      <div className="h-4 w-3/5 rounded bg-slate-700" />
      <div className="h-3 w-4/5 rounded bg-slate-700/80" />
      <div className="h-3 w-2/3 rounded bg-slate-700/80" />
      <div className="h-3 w-1/2 rounded bg-slate-700/70" />
      <div className="h-8 w-full rounded bg-slate-700/20" />
    </div>
  );

  if (isLoading) {
    return (
      <div className="module-page-container admin-console">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="module-description">Loading admin console...</p>
        <div className="module-layout">
          <section className="module-section admin-panel">
            <h2>Pending Rentals</h2>
            <div className="list-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          </section>
          <section className="module-section admin-panel">
            <h2>Admin Audit Logs</h2>
            <div className="list-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page-container admin-console">
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : 'toast-info'}`}
          >
            <div className="toast-header">
              <div className="toast-title">{t.title}</div>
            </div>
            <div className="toast-msg">{t.message}</div>
          </div>
        ))}
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="module-description">
        Approve or reject rentals and micro-tasks before publishing, and manage all user accounts.
      </p>
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {analytics && queueStats && (
        <div className="module-layout" style={{ marginBottom: '1rem' }}>
          <section className="module-section admin-panel">
            <h2>Operations Snapshot</h2>
            <p className="muted">Rentals: pending {analytics.rentals.pending}, approved {analytics.rentals.approved}, rejected {analytics.rentals.rejected}</p>
            <p className="muted">Tasks: pending {analytics.tasks.pending}, approved {analytics.tasks.approved}, rejected {analytics.tasks.rejected}</p>
            <p className="muted">Avg moderation time: {(
              analytics.rentals.avgModerationHours + analytics.tasks.avgModerationHours
            ) / 2 || 0} hours</p>
          </section>
          <section className="module-section admin-panel">
            <h2>Queue Health</h2>
            <p className="muted">Stale rentals (7d+ pending): {queueStats.staleRentals}</p>
            <p className="muted">Stale tasks (7d+ pending): {queueStats.staleTasks}</p>
            <p className="muted">Recently rejected rentals: {queueStats.recentlyRejectedRentals}</p>
            <p className="muted">Recently rejected tasks: {queueStats.recentlyRejectedTasks}</p>
          </section>
        </div>
      )}

      <div className="module-layout">
        <section className="module-section admin-panel">
          <h2>Pending Rentals</h2>
          <input
            className="admin-input"
            style={{ marginBottom: '0.75rem', minWidth: '260px' }}
            value={rentalQuery}
            placeholder="Search rentals (title/description/category)"
            onChange={(e) => setRentalQuery(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
            <button
              type="button"
              className="small-action success"
              onClick={() =>
                bulkModerate('rentals', selectedRentalIds, 'approved')
              }
              disabled={!selectedRentalIds.length}
            >
              Approve selected
            </button>
            <button
              type="button"
              className="small-action danger"
              onClick={() =>
                bulkModerate('rentals', selectedRentalIds, 'rejected', {
                  moderationReasonCode: 'other',
                  moderationNote: 'Bulk reject',
                })
              }
              disabled={!selectedRentalIds.length}
            >
              Reject selected
            </button>
            <span className="muted small">Selected: {selectedRentalIds.length}</span>
          </div>
          <div className="hidden md:block">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#cbd5f5', fontSize: '0.8rem' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Select</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Title</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Category</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Rate</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Owner</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Moderation</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRentals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="muted" style={{ padding: '1rem 0.5rem' }}>
                        No pending rental items.
                      </td>
                    </tr>
                  )}
                  {pendingRentals.map((item) => (
                    <tr key={item._id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedRentalIds.includes(item._id)}
                          onChange={() => setSelectedRentalIds((prev) => toggleId(prev, item._id))}
                        />
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{item.title}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{item.category}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>LKR {item.dailyRate}/day</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{item.owner?.name || 'Unknown'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{item.moderationStatus}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="small-action success"
                            onClick={() => moderate('rentals', item._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="small-action danger"
                            onClick={() => openRejectRentalDrawer(item)}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="small-action primary"
                            onClick={() => openRentalEditor(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="small-action ghost"
                            onClick={() => deleteEntity('rentals', item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden">
            <div className="list-grid">
              {pendingRentals.map((item) => (
                <div key={item._id} className="list-card">
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRentalIds.includes(item._id)}
                      onChange={() => setSelectedRentalIds((prev) => toggleId(prev, item._id))}
                    />
                    <span className="muted small">Select</span>
                  </label>
                  <h3>{item.title}</h3>
                  <p className="muted">
                    {item.category} · LKR {item.dailyRate}/day
                  </p>
                  <p className="muted small">Owner: {item.owner?.name || 'Unknown'}</p>
                  <p className="muted small">Moderation: {item.moderationStatus}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" className="small-action success" onClick={() => moderate('rentals', item._id, 'approved')}>
                      Approve
                    </button>
                    <button type="button" className="small-action danger" onClick={() => openRejectRentalDrawer(item)}>
                      Reject
                    </button>
                    <button type="button" className="small-action primary" onClick={() => openRentalEditor(item)}>
                      Edit
                    </button>
                    <button type="button" className="small-action ghost" onClick={() => deleteEntity('rentals', item._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {pendingRentals.length === 0 && <p className="muted">No pending rental items.</p>}
            </div>
          </div>
        </section>

        <section className="module-section admin-panel">
          <h2>Pending Micro-Tasks</h2>
          <input
            className="admin-input"
            style={{ marginBottom: '0.75rem', minWidth: '260px' }}
            value={taskQuery}
            placeholder="Search tasks (description/location/category)"
            onChange={(e) => setTaskQuery(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
            <button
              type="button"
              className="small-action success"
              onClick={() =>
                bulkModerate('tasks', selectedTaskIds, 'approved')
              }
              disabled={!selectedTaskIds.length}
            >
              Approve selected
            </button>
            <button
              type="button"
              className="small-action danger"
              onClick={() =>
                bulkModerate('tasks', selectedTaskIds, 'rejected', {
                  moderationReasonCode: 'other',
                  moderationNote: 'Bulk reject',
                })
              }
              disabled={!selectedTaskIds.length}
            >
              Reject selected
            </button>
            <span className="muted small">Selected: {selectedTaskIds.length}</span>
          </div>
          <div className="hidden md:block">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#cbd5f5', fontSize: '0.8rem' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Select</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Description</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Category</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Budget</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Location</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Posted by</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Moderation</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="muted" style={{ padding: '1rem 0.5rem' }}>
                        No pending tasks.
                      </td>
                    </tr>
                  )}
                  {pendingTasks.map((task) => (
                    <tr key={task._id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task._id)}
                          onChange={() => setSelectedTaskIds((prev) => toggleId(prev, task._id))}
                        />
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{task.description}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{task.category}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>LKR {task.budget}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{task.location}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{task.creator?.name || 'Unknown'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{task.moderationStatus}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="small-action success"
                            onClick={() => moderate('tasks', task._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="small-action danger"
                            onClick={() => openRejectTaskDrawer(task)}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="small-action primary"
                            onClick={() => openTaskEditor(task)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="small-action ghost"
                            onClick={() => deleteEntity('tasks', task._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden">
            <div className="list-grid">
              {pendingTasks.map((task) => (
                <div key={task._id} className="list-card">
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(task._id)}
                      onChange={() => setSelectedTaskIds((prev) => toggleId(prev, task._id))}
                    />
                    <span className="muted small">Select</span>
                  </label>
                  <h3>{task.description}</h3>
                  <p className="muted">{task.category} · LKR {task.budget}</p>
                  <p className="muted small">Posted by: {task.creator?.name || 'Unknown'}</p>
                  <p className="muted small">Moderation: {task.moderationStatus}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" className="small-action success" onClick={() => moderate('tasks', task._id, 'approved')}>
                      Approve
                    </button>
                    <button type="button" className="small-action danger" onClick={() => openRejectTaskDrawer(task)}>
                      Reject
                    </button>
                    <button type="button" className="small-action primary" onClick={() => openTaskEditor(task)}>
                      Edit
                    </button>
                    <button type="button" className="small-action ghost" onClick={() => deleteEntity('tasks', task._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && <p className="muted">No pending tasks.</p>}
            </div>
          </div>
        </section>

        <section className="module-section admin-panel">
          <h2>User Management</h2>
          <div className="list-grid">
            {users.map((targetUser) => (
              <div key={targetUser._id} className="list-card">
                <h3>{targetUser.name}</h3>
                <p className="muted">{targetUser.email}</p>
                <p className="muted small">Role: {targetUser.role} · Trust: {targetUser.trustScore?.toFixed(1)}</p>
                <p className="muted small">Status: {targetUser.isSuspended ? 'Suspended' : 'Active'}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button type="button" className="small-action primary" onClick={() => toggleRole(targetUser)}>
                    Make {targetUser.role === 'admin' ? 'Student' : 'Admin'}
                  </button>
                  <button type="button" className={`small-action ${targetUser.isSuspended ? 'warning' : 'danger'}`} onClick={() => toggleSuspended(targetUser)}>
                    {targetUser.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="module-section admin-panel">
          <h2>Admin Audit Logs</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <select
              value={selectedSavedAuditViewId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedSavedAuditViewId(id);
                const view = savedAuditViews.find((v) => v.id === id);
                if (view) applySavedAuditView(view);
              }}
              className="admin-input"
            >
              <option value="">Custom filters</option>
              {savedAuditViews.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <input
              className="admin-input"
              style={{ minWidth: '260px' }}
              value={logFilters.q}
              placeholder="Search action / target type"
              onChange={(e) => setLogFilters((prev) => ({ ...prev, q: e.target.value }))}
            />
            <select
              value={logFilters.targetType}
              onChange={(e) => setLogFilters((prev) => ({ ...prev, targetType: e.target.value }))}
              className="admin-input"
            >
              <option value="">All target types</option>
              <option value="rental">rental</option>
              <option value="task">task</option>
              <option value="user">user</option>
            </select>
            <input
              type="date"
              value={logFilters.from}
              onChange={(e) => setLogFilters((prev) => ({ ...prev, from: e.target.value }))}
              className="admin-input"
            />
            <input
              type="date"
              value={logFilters.to}
              onChange={(e) => setLogFilters((prev) => ({ ...prev, to: e.target.value }))}
              className="admin-input"
            />
            <button
              type="button"
              className="small-action primary"
              onClick={() => {
                const nextFilters = { ...logFilters, page: 1 };
                setLogFilters(nextFilters);
                loadAuditLogs(nextFilters);
              }}
            >
              Apply
            </button>
            <button type="button" className="small-action ghost" onClick={saveCurrentAuditView}>
              Save view
            </button>
            <button type="button" className="small-action danger" onClick={deleteSelectedAuditView} disabled={!selectedSavedAuditViewId}>
              Delete view
            </button>
            <button type="button" className="small-action success" onClick={exportAuditLogsCsv}>
              Export CSV
            </button>
            <button
              type="button"
              className="small-action ghost"
              onClick={() =>
                setLogFilters({
                  action: '',
                  targetType: '',
                  q: '',
                  from: '',
                  to: '',
                  limit: DEFAULT_AUDIT_PAGE_SIZE,
                  page: 1,
                })
              }
            >
              Reset
            </button>
          </div>
          <div className="list-grid">
            {auditLogs.map((log) => (
              <div key={log._id} className="list-card">
                <h3>{log.action}</h3>
                <p className="muted small">Admin: {log.admin?.name || 'Unknown'} ({log.admin?.email || 'No email'})</p>
                <p className="muted small">Target: {log.targetType} · {log.targetId}</p>
                <p className="muted small">{new Date(log.createdAt).toLocaleString()}</p>
                {(log.details?.before || log.details?.after) && (
                  <details style={{ marginTop: '0.75rem' }}>
                    <summary className="muted small" style={{ cursor: 'pointer' }}>
                      View diff
                    </summary>
                    <div style={{ marginTop: '0.5rem' }}>
                      <p className="muted small" style={{ marginBottom: '0.25rem' }}>Before</p>
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(log.details?.before || null, null, 2)}
                      </pre>
                      <p className="muted small" style={{ margin: '0.75rem 0 0.25rem' }}>After</p>
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(log.details?.after || null, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            ))}
            {auditLogs.length === 0 && <p className="muted">No admin activity logged yet.</p>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="small-action ghost"
              disabled={(logFilters.page || 1) <= 1}
              onClick={() => {
                const nextPage = Math.max((logFilters.page || 1) - 1, 1);
                const nextFilters = { ...logFilters, page: nextPage };
                setLogFilters(nextFilters);
                loadAuditLogs(nextFilters);
              }}
            >
              Prev
            </button>
            <span className="muted small">
              Page {logFilters.page || 1} / {totalAuditPages} · Total {auditTotal}
            </span>
            <button
              type="button"
              className="small-action ghost"
              disabled={(logFilters.page || 1) >= totalAuditPages}
              onClick={() => {
                const nextPage = Math.min((logFilters.page || 1) + 1, totalAuditPages);
                const nextFilters = { ...logFilters, page: nextPage };
                setLogFilters(nextFilters);
                loadAuditLogs(nextFilters);
              }}
            >
              Next
            </button>
          </div>
        </section>
      </div>
      {drawerMode && (
        <div
          className="drawer-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDrawer();
          }}
        >
          <div className="drawer-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h2 className="text-xl font-bold" style={{ marginBottom: '0.25rem' }}>
                  {drawerMode === 'editRental' && 'Edit Rental'}
                  {drawerMode === 'rejectRental' && 'Reject Rental'}
                  {drawerMode === 'editTask' && 'Edit Micro-Task'}
                  {drawerMode === 'rejectTask' && 'Reject Micro-Task'}
                </h2>
                <p className="muted small">
                  {drawerMode === 'editRental' && `ID: ${editingRental || ''}`}
                  {drawerMode === 'editTask' && `ID: ${editingTask || ''}`}
                  {drawerMode === 'rejectRental' && `ID: ${rejectDraft?.id || ''}`}
                  {drawerMode === 'rejectTask' && `ID: ${rejectDraft?.id || ''}`}
                </p>
              </div>
              <button type="button" className="small-action ghost" onClick={closeDrawer}>
                Close
              </button>
            </div>

            {drawerMode === 'editRental' && (
              <div className="module-form" style={{ marginTop: '1rem' }}>
                <label>
                  Title
                  <input
                    value={rentalForm.title}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Title"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={rentalForm.description}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                  />
                </label>
                <label>
                  Category
                  <select
                    value={rentalForm.category}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Lab Gear">Lab Gear</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Daily Rate
                  <input
                    type="number"
                    min="0"
                    value={rentalForm.dailyRate}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, dailyRate: e.target.value }))}
                  />
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Active</span>
                  <input
                    type="checkbox"
                    checked={rentalForm.isActive}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    style={{ marginLeft: '0.75rem' }}
                  />
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => submitRentalEdit(editingRental)}>
                    Save changes
                  </button>
                  <button type="button" onClick={closeDrawer}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {drawerMode === 'rejectRental' && (
              <div className="module-form" style={{ marginTop: '1rem' }}>
                <label>
                  Reject reason
                  <select
                    value={rejectDraft?.reasonCode || 'other'}
                    onChange={(e) =>
                      setRejectDraft((prev) => ({ ...(prev || {}), reasonCode: e.target.value }))
                    }
                  >
                    {REJECTION_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Note (optional)
                  <textarea
                    value={rejectDraft?.note || ''}
                    onChange={(e) => setRejectDraft((prev) => ({ ...(prev || {}), note: e.target.value }))}
                    placeholder="Short reason for student"
                  />
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={confirmRejectFromDrawer}>
                    Confirm reject
                  </button>
                  <button type="button" onClick={closeDrawer}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {drawerMode === 'editTask' && (
              <div className="module-form" style={{ marginTop: '1rem' }}>
                <label>
                  Description
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                  />
                </label>
                <label>
                  Category
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Delivery">Delivery</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Academic">Academic</option>
                    <option value="Technical">Technical</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Budget
                  <input
                    type="number"
                    min="0"
                    value={taskForm.budget}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, budget: e.target.value }))}
                  />
                </label>
                <label>
                  Deadline
                  <input
                    type="datetime-local"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </label>
                <label>
                  Location
                  <input
                    value={taskForm.location}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Main Library, Lab 3B"
                  />
                </label>
                <label>
                  Status
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => submitTaskEdit(editingTask)}>
                    Save changes
                  </button>
                  <button type="button" onClick={closeDrawer}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {drawerMode === 'rejectTask' && (
              <div className="module-form" style={{ marginTop: '1rem' }}>
                <label>
                  Reject reason
                  <select
                    value={rejectDraft?.reasonCode || 'other'}
                    onChange={(e) =>
                      setRejectDraft((prev) => ({ ...(prev || {}), reasonCode: e.target.value }))
                    }
                  >
                    {REJECTION_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Note (optional)
                  <textarea
                    value={rejectDraft?.note || ''}
                    onChange={(e) => setRejectDraft((prev) => ({ ...(prev || {}), note: e.target.value }))}
                    placeholder="Short reason for student"
                  />
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={confirmRejectFromDrawer}>
                    Confirm reject
                  </button>
                  <button type="button" onClick={closeDrawer}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
