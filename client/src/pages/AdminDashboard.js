import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  Download, 
  Save, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Edit,
  Delete,
  Eye,
  Shield,
  Users,
  Package,
  Clock,
  AlertTriangle,
  UserCheck,
  UserX,
  ChevronDown,
  RefreshCw,
  Activity,
  TrendingUp,
  Calendar,
  User,
  Mail,
  FileText,
  Settings,
  LogIn,
  LogOut,
  ShoppingCart,
  MessageSquare,
  Star,
  Flag,
  Plus,
  Minus,
  ExternalLink
} from 'lucide-react';

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

const ACTION_ICONS = {
  'create': Plus,
  'update': Edit,
  'delete': Trash2,
  'approve': CheckCircle,
  'reject': XCircle,
  'login': LogIn,
  'logout': LogOut,
  'view': Eye,
  'edit': Edit,
  'suspend': UserX,
  'unsuspend': UserCheck,
  'role_change': Settings,
  'rental': ShoppingCart,
  'task': Clock,
  'review': Star,
  'report': Flag,
  'message': MessageSquare,
};

const ACTION_COLORS = {
  'create': 'text-green-400 bg-green-500/10',
  'update': 'text-blue-400 bg-blue-500/10',
  'delete': 'text-red-400 bg-red-500/10',
  'approve': 'text-green-400 bg-green-500/10',
  'reject': 'text-red-400 bg-red-500/10',
  'login': 'text-purple-400 bg-purple-500/10',
  'logout': 'text-gray-400 bg-gray-500/10',
  'view': 'text-cyan-400 bg-cyan-500/10',
  'suspend': 'text-orange-400 bg-orange-500/10',
  'unsuspend': 'text-teal-400 bg-teal-500/10',
  'role_change': 'text-yellow-400 bg-yellow-500/10',
  'rental': 'text-indigo-400 bg-indigo-500/10',
  'task': 'text-pink-400 bg-pink-500/10',
  'default': 'text-gray-400 bg-gray-500/10',
};

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditStats, setAuditStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [drawerMode, setDrawerMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedRentalIds, setSelectedRentalIds] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [rejectDraft, setRejectDraft] = useState(null);
  const [rentalQuery, setRentalQuery] = useState('');
  const [taskQuery, setTaskQuery] = useState('');
  const [logFilters, setLogFilters] = useState({
    action: '',
    targetType: '',
    userRole: '',
    userId: '',
    q: '',
    from: '',
    to: '',
    limit: DEFAULT_AUDIT_PAGE_SIZE,
    page: 1,
    includeStudentActions: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [savedAuditViews, setSavedAuditViews] = useState([]);
  const [selectedSavedAuditViewId, setSelectedSavedAuditViewId] = useState('');
  const [activeTab, setActiveTab] = useState('rentals');
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);
  const [dateRangePreset, setDateRangePreset] = useState('7d');

  const persistSavedAuditViews = (views) => {
    try {
      localStorage.setItem('admin_audit_saved_views', JSON.stringify(views));
    } catch (err) {}
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
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setRejectDraft(null);
    setEditingRental(null);
    setEditingTask(null);
    setSelectedLogDetails(null);
  };

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // Calculate audit stats from logs (client-side fallback)
  const calculateAuditStats = (logs) => {
    if (!logs || logs.length === 0) {
      return {
        totalActions: 0,
        uniqueUsers: 0,
        actionsPerDay: 0,
        mostActiveHour: 'N/A'
      };
    }

    const uniqueUsers = new Set(logs.map(log => log.user?._id).filter(id => id));
    const actionsByHour = {};
    
    logs.forEach(log => {
      const hour = new Date(log.createdAt).getHours();
      actionsByHour[hour] = (actionsByHour[hour] || 0) + 1;
    });
    
    let mostActiveHour = 'N/A';
    let maxActions = 0;
    for (const [hour, count] of Object.entries(actionsByHour)) {
      if (count > maxActions) {
        maxActions = count;
        mostActiveHour = `${hour}:00`;
      }
    }
    
    // Calculate average actions per day (based on date range)
    const dates = logs.map(log => new Date(log.createdAt).toDateString());
    const uniqueDates = new Set(dates);
    const actionsPerDay = uniqueDates.size > 0 ? (logs.length / uniqueDates.size).toFixed(1) : 0;
    
    return {
      totalActions: logs.length,
      uniqueUsers: uniqueUsers.size,
      actionsPerDay: parseFloat(actionsPerDay),
      mostActiveHour
    };
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rentalsRes, tasksRes, usersRes, analyticsRes, queueRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/rentals?moderationStatus=all`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/tasks?moderationStatus=all`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/users`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/analytics`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/queue-stats`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/audit-logs?page=1&limit=${DEFAULT_AUDIT_PAGE_SIZE}&includeStudentActions=true`, { headers: authHeaders }),
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
      
      // Calculate stats from loaded logs (client-side fallback)
      const calculatedStats = calculateAuditStats(logsData?.items || []);
      setAuditStats(calculatedStats);
      
      setAnalytics(analyticsData);
      setQueueStats(queueData);
      
      setError('');
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load admin dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

const loadAuditLogs = useCallback(async (overrideFilters = null) => {
  const f = overrideFilters || logFilters;
  console.log('loadAuditLogs called with filters:', f);
  const qs = new URLSearchParams();
  
  // Apply date range presets
  let fromDate = f.from;
  let toDate = f.to;
  
  // Only apply preset if we're using preset and no custom dates
  if (dateRangePreset !== 'custom' && (!f.from || !f.to)) {
    const now = new Date();
    toDate = now.toISOString().split('T')[0];
    
    switch(dateRangePreset) {
      case '24h':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        fromDate = yesterday.toISOString().split('T')[0];
        break;
      case '7d':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        fromDate = sevenDaysAgo.toISOString().split('T')[0];
        break;
      case '30d':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        fromDate = thirtyDaysAgo.toISOString().split('T')[0];
        break;
      case '90d':
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        fromDate = ninetyDaysAgo.toISOString().split('T')[0];
        break;
    }
  }
  
  // Only add date parameters if they have values
  if (fromDate && fromDate.trim()) {
    qs.append('from', fromDate);
  }
  if (toDate && toDate.trim()) {
    qs.append('to', toDate);
  }
  
  // Add other filters only if they have values
  if (f.action && f.action.trim()) qs.append('action', f.action);
  if (f.targetType && f.targetType.trim()) qs.append('targetType', f.targetType);
  if (f.userRole && f.userRole.trim()) qs.append('userRole', f.userRole);
  if (f.userId && f.userId.trim()) qs.append('userId', f.userId);
  if (f.q && f.q.trim()) qs.append('q', f.q);
  
  qs.append('limit', String(f.limit || DEFAULT_AUDIT_PAGE_SIZE));
  qs.append('page', String(f.page || 1));
  qs.append('includeStudentActions', String(f.includeStudentActions !== false));
  qs.append('sortBy', f.sortBy || 'createdAt');
  qs.append('sortOrder', f.sortOrder || 'desc');

  console.log('Loading audit logs with params:', qs.toString());

  try {
    const res = await fetch(`${API_BASE}/admin/audit-logs?${qs.toString()}`, { 
      headers: authHeaders 
    });
    const data = await res.json();
    
    if (!res.ok) {
      console.error('Audit logs error:', data);
      setError(data.message || 'Failed to load audit logs.');
      return;
    }
    
    setAuditLogs(Array.isArray(data?.items) ? data.items : []);
    setAuditTotal(Number(data?.total) || 0);
    
    // Update stats based on loaded logs
    const calculatedStats = calculateAuditStats(data?.items || []);
    setAuditStats(calculatedStats);
    
    setError('');
  } catch (err) {
    console.error('Error loading audit logs:', err);
    setError('Failed to load audit logs.');
  }
}, [authHeaders, logFilters, dateRangePreset]);

  const exportAuditLogsCsv = async () => {
    const f = logFilters;
    const qs = new URLSearchParams();
    if (f.action) qs.append('action', f.action);
    if (f.targetType) qs.append('targetType', f.targetType);
    if (f.userRole) qs.append('userRole', f.userRole);
    if (f.userId) qs.append('userId', f.userId);
    if (f.q) qs.append('q', f.q);
    if (f.from) qs.append('from', f.from);
    if (f.to) qs.append('to', f.to);
    qs.append('limit', '5000');
    qs.append('includeStudentActions', String(f.includeStudentActions !== false));

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
      pushToast('success', 'Export complete', `Exported ${auditTotal} audit logs`);
    } catch (err) {
      console.error('Export error:', err);
      setError('Export failed.');
      pushToast('error', 'Export failed', 'Could not export audit logs');
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
    } catch (err) {}
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
    const type = rejectDraft.type;
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
        userRole: logFilters.userRole,
        userId: logFilters.userId,
        q: logFilters.q,
        from: logFilters.from,
        to: logFilters.to,
        limit: logFilters.limit,
        includeStudentActions: logFilters.includeStudentActions,
      },
    };

    const nextViews = [newView, ...savedAuditViews];
    setSavedAuditViews(nextViews);
    persistSavedAuditViews(nextViews);
    setSelectedSavedAuditViewId(newView.id);
    pushToast('success', 'View saved', `"${name}" has been saved`);
  };

  const deleteSelectedAuditView = () => {
    if (!selectedSavedAuditViewId) return;
    const viewToDelete = savedAuditViews.find(v => v.id === selectedSavedAuditViewId);
    const nextViews = savedAuditViews.filter((v) => v.id !== selectedSavedAuditViewId);
    setSavedAuditViews(nextViews);
    persistSavedAuditViews(nextViews);
    setSelectedSavedAuditViewId('');
    pushToast('success', 'View deleted', `"${viewToDelete?.name}" has been deleted`);
  };

  const applySavedAuditView = (view) => {
    const nextFilters = {
      action: view?.filters?.action || '',
      targetType: view?.filters?.targetType || '',
      userRole: view?.filters?.userRole || '',
      userId: view?.filters?.userId || '',
      q: view?.filters?.q || '',
      from: view?.filters?.from || '',
      to: view?.filters?.to || '',
      limit: view?.filters?.limit || DEFAULT_AUDIT_PAGE_SIZE,
      page: 1,
      includeStudentActions: view?.filters?.includeStudentActions !== false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setLogFilters(nextFilters);
    loadAuditLogs(nextFilters);
    pushToast('success', 'View applied', `Loaded "${view.name}"`);
  };

const resetFilters = () => {
  const resetFiltersObj = {
    action: '',
    targetType: '',
    userRole: '',
    userId: '',
    q: '',
    from: '',
    to: '',
    limit: DEFAULT_AUDIT_PAGE_SIZE,
    page: 1,
    includeStudentActions: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };
  setLogFilters(resetFiltersObj);
  setDateRangePreset('7d');
  loadAuditLogs(resetFiltersObj);
};

  const auditPageSize = logFilters.limit || DEFAULT_AUDIT_PAGE_SIZE;
  const totalAuditPages = Math.max(Math.ceil(auditTotal / auditPageSize), 1);

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-400">{trend}</span>
        </div>
      )}
    </div>
  );

  const ActionButton = ({ onClick, variant, children, disabled, icon: Icon }) => {
    const variants = {
      success: 'bg-green-600 hover:bg-green-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      ghost: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  };

  const SkeletonCard = () => (
    <div className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
    </div>
  );

  const getActionIcon = (action) => {
    const lowerAction = action?.toLowerCase() || '';
    for (const [key, Icon] of Object.entries(ACTION_ICONS)) {
      if (lowerAction.includes(key)) return Icon;
    }
    return Activity;
  };

  const getActionColor = (action) => {
    const lowerAction = action?.toLowerCase() || '';
    for (const [key, colorClass] of Object.entries(ACTION_COLORS)) {
      if (lowerAction.includes(key)) return colorClass;
    }
    return ACTION_COLORS.default;
  };

  const formatUserInfo = (user) => {
    if (!user) return 'System';
    return `${user.name || 'Unknown'} (${user.email || 'No email'})`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">Admin Dashboard</h1>
          <p className="text-gray-400 mb-8">Loading admin console...</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border ${
              t.type === 'success' ? 'bg-green-500/90 border-green-400' :
              t.type === 'error' ? 'bg-red-500/90 border-red-400' :
              'bg-blue-500/90 border-blue-400'
            } text-white min-w-[300px] animate-slide-in`}
          >
            <div className="font-semibold">{t.title}</div>
            <div className="text-sm opacity-90">{t.message}</div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Manage rentals, tasks, users, and monitor system activity
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Analytics Cards */}
        {analytics && queueStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Package}
              title="Pending Rentals"
              value={analytics.rentals.pending}
              color="bg-blue-500/20 text-blue-400"
            />
            <StatCard
              icon={Clock}
              title="Pending Tasks"
              value={analytics.tasks.pending}
              color="bg-purple-500/20 text-purple-400"
            />
            <StatCard
              icon={AlertTriangle}
              title="Stale Items (7d+)"
              value={(queueStats.staleRentals || 0) + (queueStats.staleTasks || 0)}
              subtitle={`${queueStats.staleRentals} rentals, ${queueStats.staleTasks} tasks`}
              color="bg-yellow-500/20 text-yellow-400"
            />
            <StatCard
              icon={Users}
              title="Total Users"
              value={users.length}
              subtitle="All registered users"
              color="bg-green-500/20 text-green-400"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex space-x-4 overflow-x-auto">
            {[
              { id: 'rentals', label: 'Rentals', icon: Package, count: pendingRentals.length },
              { id: 'tasks', label: 'Tasks', icon: Clock, count: pendingTasks.length },
              { id: 'users', label: 'Users', icon: Users, count: users.length },
              { id: 'audit', label: 'Audit Logs', icon: Shield, count: auditTotal },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-all relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Rentals Tab */}
          {activeTab === 'rentals' && (
            <div className="space-y-4">
              {/* Search and Bulk Actions */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search rentals..."
                    value={rentalQuery}
                    onChange={(e) => setRentalQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    onClick={() => bulkModerate('rentals', selectedRentalIds, 'approved')}
                    disabled={!selectedRentalIds.length}
                    variant="success"
                    icon={CheckCircle}
                  >
                    Approve Selected ({selectedRentalIds.length})
                  </ActionButton>
                  <ActionButton
                    onClick={() => bulkModerate('rentals', selectedRentalIds, 'rejected', {
                      moderationReasonCode: 'other',
                      moderationNote: 'Bulk reject',
                    })}
                    disabled={!selectedRentalIds.length}
                    variant="danger"
                    icon={XCircle}
                  >
                    Reject Selected
                  </ActionButton>
                </div>
              </div>

              {/* Rentals Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingRentals.map((rental) => (
                  <div key={rental._id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRentalIds.includes(rental._id)}
                          onChange={() => setSelectedRentalIds((prev) => toggleId(prev, rental._id))}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <h3 className="text-lg font-semibold text-white">{rental.title}</h3>
                      </div>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium">
                        {rental.moderationStatus}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{rental.description}</p>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                      <span className="px-2 py-1 bg-gray-700/50 rounded">{rental.category}</span>
                      <span className="px-2 py-1 bg-gray-700/50 rounded">LKR {rental.dailyRate}/day</span>
                      <span className="px-2 py-1 bg-gray-700/50 rounded">Owner: {rental.owner?.name || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <ActionButton
                        onClick={() => moderate('rentals', rental._id, 'approved')}
                        variant="success"
                        icon={CheckCircle}
                      >
                        Approve
                      </ActionButton>
                      <ActionButton
                        onClick={() => openRejectRentalDrawer(rental)}
                        variant="danger"
                        icon={XCircle}
                      >
                        Reject
                      </ActionButton>
                      <ActionButton
                        onClick={() => openRentalEditor(rental)}
                        variant="primary"
                        icon={Edit}
                      >
                        Edit
                      </ActionButton>
                      <ActionButton
                        onClick={() => deleteEntity('rentals', rental._id)}
                        variant="ghost"
                        icon={Trash2}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </div>
              {pendingRentals.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No pending rentals to review</p>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={taskQuery}
                    onChange={(e) => setTaskQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    onClick={() => bulkModerate('tasks', selectedTaskIds, 'approved')}
                    disabled={!selectedTaskIds.length}
                    variant="success"
                    icon={CheckCircle}
                  >
                    Approve Selected ({selectedTaskIds.length})
                  </ActionButton>
                  <ActionButton
                    onClick={() => bulkModerate('tasks', selectedTaskIds, 'rejected', {
                      moderationReasonCode: 'other',
                      moderationNote: 'Bulk reject',
                    })}
                    disabled={!selectedTaskIds.length}
                    variant="danger"
                    icon={XCircle}
                  >
                    Reject Selected
                  </ActionButton>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingTasks.map((task) => (
                  <div key={task._id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task._id)}
                          onChange={() => setSelectedTaskIds((prev) => toggleId(prev, task._id))}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <h3 className="text-lg font-semibold text-white line-clamp-1">{task.description}</h3>
                      </div>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium">
                        {task.moderationStatus}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                      <span className="px-2 py-1 bg-gray-700/50 rounded">{task.category}</span>
                      <span className="px-2 py-1 bg-gray-700/50 rounded">LKR {task.budget}</span>
                      <span className="px-2 py-1 bg-gray-700/50 rounded">{task.location}</span>
                      <span className="px-2 py-1 bg-gray-700/50 rounded">Posted by: {task.creator?.name || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <ActionButton
                        onClick={() => moderate('tasks', task._id, 'approved')}
                        variant="success"
                        icon={CheckCircle}
                      >
                        Approve
                      </ActionButton>
                      <ActionButton
                        onClick={() => openRejectTaskDrawer(task)}
                        variant="danger"
                        icon={XCircle}
                      >
                        Reject
                      </ActionButton>
                      <ActionButton
                        onClick={() => openTaskEditor(task)}
                        variant="primary"
                        icon={Edit}
                      >
                        Edit
                      </ActionButton>
                      <ActionButton
                        onClick={() => deleteEntity('tasks', task._id)}
                        variant="ghost"
                        icon={Trash2}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </div>
              {pendingTasks.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No pending tasks to review</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((targetUser) => (
                <div key={targetUser._id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {targetUser.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{targetUser.name}</h3>
                      <p className="text-gray-400 text-sm">{targetUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Role</span>
                      <span className={`px-2 py-0.5 rounded ${
                        targetUser.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {targetUser.role}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Trust Score</span>
                      <span className="text-white">{targetUser.trustScore?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className={targetUser.isSuspended ? 'text-red-400' : 'text-green-400'}>
                        {targetUser.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                    {targetUser.lastLogin && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Login</span>
                        <span className="text-white text-xs">
                          {new Date(targetUser.lastLogin).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <ActionButton
                      onClick={() => toggleRole(targetUser)}
                      variant="primary"
                    >
                      Make {targetUser.role === 'admin' ? 'Student' : 'Admin'}
                    </ActionButton>
                    <ActionButton
                      onClick={() => toggleSuspended(targetUser)}
                      variant={targetUser.isSuspended ? "warning" : "danger"}
                      icon={targetUser.isSuspended ? UserCheck : UserX}
                    >
                      {targetUser.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Audit Logs Tab - Completely Redesigned */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Audit Statistics Summary */}
              {auditStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <span className="text-2xl font-bold text-white">{auditStats.totalActions || 0}</span>
                    </div>
                    <p className="text-xs text-gray-400">Total Actions</p>
                    <p className="text-xs text-gray-500 mt-1">(current view)</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-green-400" />
                      <span className="text-2xl font-bold text-white">{auditStats.uniqueUsers || 0}</span>
                    </div>
                    <p className="text-xs text-gray-400">Unique Users</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <span className="text-2xl font-bold text-white">
                        {auditStats.actionsPerDay || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Actions per Day (avg)</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <span className="text-2xl font-bold text-white">
                        {auditStats.mostActiveHour || 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Peak Activity Hour</p>
                  </div>
                </div>
              )}

              {/* Advanced Filters */}
              <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Advanced Filters
                  </h3>
                  <div className="flex gap-2">
                    <ActionButton onClick={resetFilters} variant="ghost" icon={RefreshCw}>
                      Reset
                    </ActionButton>
                    <ActionButton onClick={saveCurrentAuditView} variant="primary" icon={Save}>
                      Save View
                    </ActionButton>
                    <ActionButton onClick={exportAuditLogsCsv} variant="success" icon={Download}>
                      Export CSV
                    </ActionButton>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Saved Views Dropdown */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Saved Views</label>
                    <select
                      value={selectedSavedAuditViewId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedSavedAuditViewId(id);
                        const view = savedAuditViews.find((v) => v.id === id);
                        if (view) applySavedAuditView(view);
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Custom filters</option>
                      {savedAuditViews.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search by user, action, target..."
                      value={logFilters.q}
                      onChange={(e) => {
                        const updatedFilters = { ...logFilters, q: e.target.value, page: 1 };
                        setLogFilters(updatedFilters);
                        // Optional: debounce this for better performance
                        loadAuditLogs(updatedFilters);
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Action Type */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Action Type</label>
                    <select
                      value={logFilters.action}
                      onChange={(e) => {
                        const newAction = e.target.value;
                        setLogFilters(prev => ({ ...prev, action: newAction, page: 1 }));
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All actions</option>
                      <option value="create">Create</option>
                      <option value="update">Update</option>
                      <option value="delete">Delete</option>
                      <option value="approve">Approve</option>
                      <option value="reject">Reject</option>
                      <option value="login">Login</option>
                      <option value="logout">Logout</option>
                      <option value="suspend">Suspend</option>
                      <option value="unsuspend">Unsuspend</option>
                      <option value="role_change">Role Change</option>
                    </select>
                  </div>

                  {/* Target Type */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Target Type</label>
                    <select
                      value={logFilters.targetType}
                      onChange={(e) => {
                        const newTargetType = e.target.value;
                        setLogFilters(prev => ({ ...prev, targetType: newTargetType, page: 1 }));
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All types</option>
                      <option value="rental">Rental</option>
                      <option value="task">Task</option>
                      <option value="user">User</option>
                      <option value="review">Review</option>
                      <option value="message">Message</option>
                    </select>
                  </div>

                  {/* User Role */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">User Role</label>
                    <select
                      value={logFilters.userRole}
                      onChange={(e) => {
                        const newUserRole = e.target.value;
                        setLogFilters(prev => ({ ...prev, userRole: newUserRole, page: 1 }));
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All roles</option>
                      <option value="admin">Admin</option>
                      <option value="student">Student</option>
                    </select>
                  </div>

                  {/* Date Range Preset */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Date Range</label>
                    <select
                      value={dateRangePreset}
                      onChange={(e) => {
                        const newPreset = e.target.value;
                        setDateRangePreset(newPreset);
                        if (newPreset !== 'custom') {
                          // Clear custom date ranges when preset changes
                          const updatedFilters = { ...logFilters, from: '', to: '', page: 1 };
                          setLogFilters(updatedFilters);
                          // Automatically apply the preset filter
                          loadAuditLogs(updatedFilters);
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="24h">Last 24 hours</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="custom">Custom range</option>
                    </select>
                  </div>

                  {/* Custom Date Range */}
                  {dateRangePreset === 'custom' && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">From Date</label>
                        <input
                          type="date"
                          value={logFilters.from}
                          onChange={(e) => {
                            const newFrom = e.target.value;
                            setLogFilters(prev => ({ ...prev, from: newFrom, page: 1 }));
                          }}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">To Date</label>
                        <input
                          type="date"
                          value={logFilters.to}
                          onChange={(e) => {
                            const newTo = e.target.value;
                            setLogFilters(prev => ({ ...prev, to: newTo, page: 1 }));
                          }}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Include Student Actions */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logFilters.includeStudentActions}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setLogFilters(prev => ({ ...prev, includeStudentActions: newValue, page: 1 }));
                      }}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600"
                    />
                    <span className="text-sm">Include student actions</span>
                  </label>
                </div>
                </div>

                {/* Apply Filters Button */}
              <div className="mt-4">
                <ActionButton onClick={() => {
                  // Create a fresh copy of current filters with page reset to 1
                  const currentFilters = { ...logFilters, page: 1 };
                  console.log('Applying filters:', currentFilters); // Debug log
                  loadAuditLogs(currentFilters);
                }} variant="primary" icon={Search}>
                  Apply Filters
                </ActionButton>
              </div>
              </div>

              {/* Audit Logs List */}
              <div className="space-y-3">
                {auditLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  const actionColorClass = getActionColor(log.action);
                  
                  return (
                    <div 
                      key={log._id} 
                      className="bg-gray-800/30 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
                      onClick={() => setSelectedLogDetails(selectedLogDetails === log._id ? null : log._id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Left side - Action and User */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${actionColorClass}`}>
                            <ActionIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${actionColorClass}`}>
                                {log.action?.toUpperCase() || 'ACTION'}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-400">{log.targetType}</span>
                              {log.user?.role === 'admin' && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                                  Admin
                                </span>
                              )}
                              {log.user?.role === 'student' && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                                  Student
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 font-mono mb-1 break-all">
                              Target: {log.targetId}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <User className="w-3 h-3" />
                              <span>{formatUserInfo(log.user)}</span>
                              <Calendar className="w-3 h-3 ml-2" />
                              <span>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right side - View details indicator */}
                        <div className="text-xs text-blue-400 hover:text-blue-300">
                          {selectedLogDetails === log._id ? 'Hide details ▲' : 'View details ▼'}
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {selectedLogDetails === log._id && (
                        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                          {/* IP Address and User Agent */}
                          {(log.ipAddress || log.userAgent) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {log.ipAddress && (
                                <div>
                                  <p className="text-gray-500 mb-1">IP Address</p>
                                  <p className="text-gray-300 font-mono">{log.ipAddress}</p>
                                </div>
                              )}
                              {log.userAgent && (
                                <div>
                                  <p className="text-gray-500 mb-1">User Agent</p>
                                  <p className="text-gray-300 text-xs break-all">{log.userAgent}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Changes */}
                          {(log.details?.before || log.details?.after) && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2 font-semibold">Changes:</p>
                              <div className="space-y-2">
                                {log.details?.before && (
                                  <div>
                                    <p className="text-xs text-red-400 mb-1">Before:</p>
                                    <pre className="text-xs bg-gray-900/50 p-2 rounded overflow-x-auto border border-gray-700">
                                      {JSON.stringify(log.details.before, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.details?.after && (
                                  <div>
                                    <p className="text-xs text-green-400 mb-1">After:</p>
                                    <pre className="text-xs bg-gray-900/50 p-2 rounded overflow-x-auto border border-gray-700">
                                      {JSON.stringify(log.details.after, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Additional Details */}
                          {log.details?.reason && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Reason:</p>
                              <p className="text-xs text-gray-300">{log.details.reason}</p>
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="text-xs text-gray-500">
                            <p>Log ID: {log._id}</p>
                            <p>Created: {new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Empty State */}
              {auditLogs.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No audit logs found</p>
                  <p className="text-gray-600 text-sm mt-2">Try adjusting your filters</p>
                </div>
              )}
              
              {/* Pagination */}
              {auditTotal > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4">
                    <ActionButton
                      onClick={() => {
                        const nextPage = Math.max((logFilters.page || 1) - 1, 1);
                        const nextFilters = { ...logFilters, page: nextPage };
                        setLogFilters(nextFilters);
                        loadAuditLogs(nextFilters);
                      }}
                      disabled={(logFilters.page || 1) <= 1}
                      variant="ghost"
                      icon={ChevronLeft}
                    >
                      Previous
                    </ActionButton>
                    <ActionButton
                      onClick={() => {
                        const nextPage = Math.min((logFilters.page || 1) + 1, totalAuditPages);
                        const nextFilters = { ...logFilters, page: nextPage };
                        setLogFilters(nextFilters);
                        loadAuditLogs(nextFilters);
                      }}
                      disabled={(logFilters.page || 1) >= totalAuditPages}
                      variant="ghost"
                      icon={ChevronRight}
                    >
                      Next
                    </ActionButton>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={logFilters.limit}
                      onChange={(e) => {
                        const newLimit = Number(e.target.value);
                        const nextFilters = { ...logFilters, limit: newLimit, page: 1 };
                        setLogFilters(nextFilters);
                        loadAuditLogs(nextFilters);
                      }}
                      className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    >
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                    <span className="text-sm text-gray-400">
                      Page {logFilters.page || 1} of {totalAuditPages} • {auditTotal} total
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerMode && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDrawer();
          }}
        >
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {drawerMode === 'editRental' && 'Edit Rental'}
                {drawerMode === 'rejectRental' && 'Reject Rental'}
                {drawerMode === 'editTask' && 'Edit Micro-Task'}
                {drawerMode === 'rejectTask' && 'Reject Micro-Task'}
              </h2>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 font-mono">
              ID: {editingRental || editingTask || rejectDraft?.id || ''}
            </p>
            
            {/* Edit Rental Form */}
            {drawerMode === 'editRental' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    value={rentalForm.title}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={rentalForm.description}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={rentalForm.category}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Lab Gear">Lab Gear</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Daily Rate (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={rentalForm.dailyRate}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, dailyRate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Active</label>
                  <input
                    type="checkbox"
                    checked={rentalForm.isActive}
                    onChange={(e) => setRentalForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <ActionButton onClick={() => submitRentalEdit(editingRental)} variant="success">
                    Save Changes
                  </ActionButton>
                  <ActionButton onClick={closeDrawer} variant="ghost">
                    Cancel
                  </ActionButton>
                </div>
              </div>
            )}
            
            {/* Reject Forms */}
            {(drawerMode === 'rejectRental' || drawerMode === 'rejectTask') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason</label>
                  <select
                    value={rejectDraft?.reasonCode || 'other'}
                    onChange={(e) => setRejectDraft((prev) => ({ ...(prev || {}), reasonCode: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {REJECTION_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Note (Optional)</label>
                  <textarea
                    value={rejectDraft?.note || ''}
                    onChange={(e) => setRejectDraft((prev) => ({ ...(prev || {}), note: e.target.value }))}
                    rows={3}
                    placeholder="Add a note for the user..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <ActionButton onClick={confirmRejectFromDrawer} variant="danger">
                    Confirm Rejection
                  </ActionButton>
                  <ActionButton onClick={closeDrawer} variant="ghost">
                    Cancel
                  </ActionButton>
                </div>
              </div>
            )}
            
            {/* Edit Task Form */}
            {drawerMode === 'editTask' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Delivery">Delivery</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Academic">Academic</option>
                    <option value="Technical">Technical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Budget (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={taskForm.budget}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, budget: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Deadline</label>
                  <input
                    type="datetime-local"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    value={taskForm.location}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <ActionButton onClick={() => submitTaskEdit(editingTask)} variant="success">
                    Save Changes
                  </ActionButton>
                  <ActionButton onClick={closeDrawer} variant="ghost">
                    Cancel
                  </ActionButton>
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