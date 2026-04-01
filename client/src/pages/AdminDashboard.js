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
  Eye,
  Shield,
  Users,
  Package,
  Clock,
  AlertTriangle,
  UserCheck,
  UserX,
  RefreshCw,
  Activity,
  TrendingUp,
  Calendar,
  User,
  Settings,
  LogIn,
  LogOut,
  ShoppingCart,
  MessageSquare,
  Star,
  Flag,
  Plus,
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
  'create': 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
  'update': 'from-blue-500/20 to-blue-600/10 text-blue-400',
  'delete': 'from-red-500/20 to-red-600/10 text-red-400',
  'approve': 'from-green-500/20 to-green-600/10 text-green-400',
  'reject': 'from-red-500/20 to-red-600/10 text-red-400',
  'login': 'from-purple-500/20 to-purple-600/10 text-purple-400',
  'logout': 'from-gray-500/20 to-gray-600/10 text-gray-400',
  'view': 'from-cyan-500/20 to-cyan-600/10 text-cyan-400',
  'suspend': 'from-orange-500/20 to-orange-600/10 text-orange-400',
  'unsuspend': 'from-teal-500/20 to-teal-600/10 text-teal-400',
  'role_change': 'from-yellow-500/20 to-yellow-600/10 text-yellow-400',
  'default': 'from-gray-500/20 to-gray-600/10 text-gray-400',
};

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // State for all items
  const [allRentals, setAllRentals] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  
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
  
  // Filters for All Rentals/Tasks views
  const [rentalSearchQuery, setRentalSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [rentalStatusFilter, setRentalStatusFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [rentalCategoryFilter, setRentalCategoryFilter] = useState('all');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('all');
  const [rentalSortBy, setRentalSortBy] = useState('createdAt');
  const [taskSortBy, setTaskSortBy] = useState('createdAt');
  const [rentalSortOrder, setRentalSortOrder] = useState('desc');
  const [taskSortOrder, setTaskSortOrder] = useState('desc');
  const [rentalViewMode, setRentalViewMode] = useState('grid');
  const [taskViewMode, setTaskViewMode] = useState('grid');
  
  // Pagination for all items
  const [rentalCurrentPage, setRentalCurrentPage] = useState(1);
  const [taskCurrentPage, setTaskCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Audit log filters
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
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);
  const [dateRangePreset, setDateRangePreset] = useState('7d');
  const [showFilters, setShowFilters] = useState(true);

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
      if (count > maxActions) { maxActions = count; mostActiveHour = `${hour}:00`; }
    }
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

  const loadAllData = useCallback(async () => {
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
      
      if (!rentalsRes.ok || !tasksRes.ok) {
        setError('Failed to load admin data.');
        return;
      }
      
      setAllRentals(rentalsData);
      setAllTasks(tasksData);
      setFilteredRentals(rentalsData);
      setFilteredTasks(tasksData);
      setUsers(usersData);
      setAuditLogs(Array.isArray(logsData?.items) ? logsData.items : []);
      setAuditTotal(Number(logsData?.total) || 0);
      setAuditStats(calculateAuditStats(logsData?.items || []));
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

  // Apply filters to rentals
  useEffect(() => {
    let filtered = [...allRentals];
    if (rentalStatusFilter !== 'all') {
      filtered = filtered.filter(r => r.moderationStatus === rentalStatusFilter);
    }
    if (rentalCategoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === rentalCategoryFilter);
    }
    if (rentalSearchQuery) {
      const query = rentalSearchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query)
      );
    }
    filtered.sort((a, b) => {
      let aVal = a[rentalSortBy];
      let bVal = b[rentalSortBy];
      if (rentalSortBy === 'dailyRate') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (rentalSortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (rentalSortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    setFilteredRentals(filtered);
    setRentalCurrentPage(1);
  }, [allRentals, rentalStatusFilter, rentalCategoryFilter, rentalSearchQuery, rentalSortBy, rentalSortOrder]);

  // Apply filters to tasks
  useEffect(() => {
    let filtered = [...allTasks];
    if (taskStatusFilter !== 'all') {
      filtered = filtered.filter(t => t.moderationStatus === taskStatusFilter);
    }
    if (taskCategoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === taskCategoryFilter);
    }
    if (taskSearchQuery) {
      const query = taskSearchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.location?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
      );
    }
    filtered.sort((a, b) => {
      let aVal = a[taskSortBy];
      let bVal = b[taskSortBy];
      if (taskSortBy === 'budget') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (taskSortBy === 'deadline') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (taskSortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (taskSortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    setFilteredTasks(filtered);
    setTaskCurrentPage(1);
  }, [allTasks, taskStatusFilter, taskCategoryFilter, taskSearchQuery, taskSortBy, taskSortOrder]);

  // Pagination calculations
  const paginatedRentals = useMemo(() => {
    const start = (rentalCurrentPage - 1) * itemsPerPage;
    return filteredRentals.slice(start, start + itemsPerPage);
  }, [filteredRentals, rentalCurrentPage]);
  
  const paginatedTasks = useMemo(() => {
    const start = (taskCurrentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, taskCurrentPage]);

  const loadAuditLogs = useCallback(async (overrideFilters = null) => {
    const f = overrideFilters || logFilters;
    const qs = new URLSearchParams();
    
    let fromDate = f.from;
    let toDate = f.to;
    
    if (dateRangePreset !== 'custom' && (!f.from || !f.to)) {
      const now = new Date();
      toDate = now.toISOString().split('T')[0];
      switch(dateRangePreset) {
        case '24h': const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); fromDate = yesterday.toISOString().split('T')[0]; break;
        case '7d': const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); fromDate = sevenDaysAgo.toISOString().split('T')[0]; break;
        case '30d': const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); fromDate = thirtyDaysAgo.toISOString().split('T')[0]; break;
        case '90d': const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90); fromDate = ninetyDaysAgo.toISOString().split('T')[0]; break;
        default: break;
      }
    }
    
    if (fromDate && fromDate.trim()) qs.append('from', fromDate);
    if (toDate && toDate.trim()) qs.append('to', toDate);
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

    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs?${qs.toString()}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to load audit logs.'); return; }
      setAuditLogs(Array.isArray(data?.items) ? data.items : []);
      setAuditTotal(Number(data?.total) || 0);
      setAuditStats(calculateAuditStats(data?.items || []));
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Failed to load audit logs.');
    }
  }, [authHeaders, logFilters, dateRangePreset]);

  const moderateRequest = async (type, id, moderationStatus, { moderationReasonCode = null, moderationNote = '' } = {}) => {
    const res = await fetch(`${API_BASE}/admin/${type}/${id}/moderate`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ moderationStatus, moderationReasonCode, moderationNote }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Action failed.');
    return data;
  };

  const moderate = async (type, id, moderationStatus, options) => {
    try {
      await moderateRequest(type, id, moderationStatus, options);
      pushToast('success', moderationStatus === 'approved' ? 'Approved' : 'Rejected', 
        `Successfully ${moderationStatus === 'approved' ? 'approved' : 'rejected'} ${type.slice(0, -1)}.`);
      loadAllData();
    } catch (err) {
      pushToast('error', 'Action failed', err?.message || 'Action failed.');
    }
  };

  const cancelApproval = async (type, id) => {
    try {
      await moderateRequest(type, id, 'pending', { moderationNote: 'Approval cancelled by admin' });
      pushToast('success', 'Approval Cancelled', `Item returned to pending queue.`);
      loadAllData();
    } catch (err) {
      pushToast('error', 'Action failed', err?.message || 'Failed to cancel approval.');
    }
  };

  const deleteEntity = async (type, id) => {
    const res = await fetch(`${API_BASE}/admin/${type}/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const data = await res.json();
    if (!res.ok) {
      pushToast('error', 'Delete failed', data.message || 'Delete failed.');
      return;
    }
    pushToast('success', 'Deleted', `${type.slice(0, -1)} removed successfully.`);
    loadAllData();
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
      body: JSON.stringify({ ...rentalForm, dailyRate: Number(rentalForm.dailyRate) }),
    });
    const data = await res.json();
    if (!res.ok) {
      pushToast('error', 'Rental update failed', data.message || 'Failed to update rental.');
      return;
    }
    pushToast('success', 'Rental updated', 'Changes saved successfully.');
    closeDrawer();
    loadAllData();
  };

  const submitTaskEdit = async (id) => {
    const res = await fetch(`${API_BASE}/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ ...taskForm, budget: Number(taskForm.budget) }),
    });
    const data = await res.json();
    if (!res.ok) {
      pushToast('error', 'Task update failed', data.message || 'Failed to update task.');
      return;
    }
    pushToast('success', 'Task updated', 'Changes saved successfully.');
    closeDrawer();
    loadAllData();
  };

  const toggleSuspended = async (targetUser) => {
    const res = await fetch(`${API_BASE}/admin/users/${targetUser._id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isSuspended: !targetUser.isSuspended }),
    });
    const data = await res.json();
    if (!res.ok) {
      pushToast('error', 'User update failed', data.message || 'Failed to update user.');
      return;
    }
    pushToast('success', 'User updated', targetUser.isSuspended ? 'User unsuspended.' : 'User suspended.');
    loadAllData();
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
      pushToast('error', 'Role update failed', data.message || 'Failed to update role.');
      return;
    }
    pushToast('success', 'Role updated', `User is now ${nextRole}.`);
    loadAllData();
  };

  const resetFilters = () => {
    const resetFiltersObj = {
      action: '', targetType: '', userRole: '', userId: '', q: '',
      from: '', to: '', limit: DEFAULT_AUDIT_PAGE_SIZE, page: 1,
      includeStudentActions: true, sortBy: 'createdAt', sortOrder: 'desc',
    };
    setLogFilters(resetFiltersObj);
    setDateRangePreset('7d');
    loadAuditLogs(resetFiltersObj);
  };

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
      if (!res.ok) throw new Error('Export failed.');
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
      pushToast('error', 'Export failed', 'Could not export audit logs');
    }
  };

  const saveCurrentAuditView = () => {
    const name = window.prompt('Name this audit log view:');
    if (!name || !String(name).trim()) return;
    const newView = {
      id: String(Date.now()),
      name: String(name).trim(),
      filters: {
        action: logFilters.action, targetType: logFilters.targetType, userRole: logFilters.userRole,
        userId: logFilters.userId, q: logFilters.q, from: logFilters.from, to: logFilters.to,
        limit: logFilters.limit, includeStudentActions: logFilters.includeStudentActions,
      },
    };
    const nextViews = [newView, ...savedAuditViews];
    setSavedAuditViews(nextViews);
    localStorage.setItem('admin_audit_saved_views', JSON.stringify(nextViews));
    setSelectedSavedAuditViewId(newView.id);
    pushToast('success', 'View saved', `"${name}" has been saved`);
  };

  const applySavedAuditView = (view) => {
    const nextFilters = {
      action: view?.filters?.action || '', targetType: view?.filters?.targetType || '',
      userRole: view?.filters?.userRole || '', userId: view?.filters?.userId || '',
      q: view?.filters?.q || '', from: view?.filters?.from || '', to: view?.filters?.to || '',
      limit: view?.filters?.limit || DEFAULT_AUDIT_PAGE_SIZE, page: 1,
      includeStudentActions: view?.filters?.includeStudentActions !== false,
      sortBy: 'createdAt', sortOrder: 'desc',
    };
    setLogFilters(nextFilters);
    loadAuditLogs(nextFilters);
    pushToast('success', 'View applied', `Loaded "${view.name}"`);
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadAllData();
    }
  }, [token, user?.role, loadAllData]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_audit_saved_views');
      if (raw) setSavedAuditViews(JSON.parse(raw));
    } catch (err) {}
  }, []);

  const pendingRentals = useMemo(() => allRentals.filter(r => r.moderationStatus === 'pending'), [allRentals]);
  const pendingTasks = useMemo(() => allTasks.filter(t => t.moderationStatus === 'pending'), [allTasks]);
  const approvedRentals = useMemo(() => allRentals.filter(r => r.moderationStatus === 'approved'), [allRentals]);
  const approvedTasks = useMemo(() => allTasks.filter(t => t.moderationStatus === 'approved'), [allTasks]);

  const getModerationBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="px-2.5 py-1 bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-400 rounded-xl text-xs font-medium backdrop-blur-sm border border-green-500/20 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'pending': return <span className="px-2.5 py-1 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400 rounded-xl text-xs font-medium backdrop-blur-sm border border-yellow-500/20 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'rejected': return <span className="px-2.5 py-1 bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-400 rounded-xl text-xs font-medium backdrop-blur-sm border border-red-500/20 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return null;
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient, trend }) => (
    <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} backdrop-blur-sm`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{value}</span>
        </div>
        <h3 className="text-gray-400 text-sm font-medium tracking-wide">{title}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        {trend && <div className="flex items-center gap-1 mt-2"><TrendingUp className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">{trend}</span></div>}
      </div>
    </div>
  );

  const ActionButton = ({ onClick, variant, children, disabled, icon: Icon, className = '' }) => {
    const variants = {
      success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/20',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20',
      primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20',
      warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg shadow-yellow-500/20',
      ghost: 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 backdrop-blur-sm border border-gray-700',
    };
    return (
      <button onClick={onClick} disabled={disabled}
        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${className}`}>
        {Icon && <Icon className="w-4 h-4" />}{children}
      </button>
    );
  };

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

  const formatUserInfo = (user) => user ? `${user.name || 'Unknown'} (${user.email || 'No email'})` : 'System';

  const totalRentalPages = Math.ceil(filteredRentals.length / itemsPerPage);
  const totalTaskPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const totalAuditPages = Math.max(Math.ceil(auditTotal / (logFilters.limit || DEFAULT_AUDIT_PAGE_SIZE)), 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-400 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border animate-slide-in ${
            t.type === 'success' ? 'bg-green-500/90 border-green-400/50' :
            t.type === 'error' ? 'bg-red-500/90 border-red-400/50' : 'bg-blue-500/90 border-blue-400/50'
          } text-white min-w-[320px]`}>
            <div className="font-semibold">{t.title}</div>
            <div className="text-sm opacity-90">{t.message}</div>
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Glass Effect */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"></div>
          <div className="relative">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Manage rentals, tasks, users, and monitor system activity</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Analytics Cards with Glass Morphism */}
        {analytics && queueStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={Package} title="Total Rentals" value={allRentals.length} subtitle={`${pendingRentals.length} pending, ${approvedRentals.length} approved`} gradient="from-blue-500/20 to-cyan-500/20 text-blue-400" />
            <StatCard icon={Clock} title="Total Tasks" value={allTasks.length} subtitle={`${pendingTasks.length} pending, ${approvedTasks.length} approved`} gradient="from-purple-500/20 to-pink-500/20 text-purple-400" />
            <StatCard icon={AlertTriangle} title="Stale Items" value={(queueStats.staleRentals || 0) + (queueStats.staleTasks || 0)} subtitle={`${queueStats.staleRentals} rentals, ${queueStats.staleTasks} tasks`} gradient="from-yellow-500/20 to-orange-500/20 text-yellow-400" />
            <StatCard icon={Users} title="Total Users" value={users.length} subtitle="All registered users" gradient="from-green-500/20 to-emerald-500/20 text-green-400" />
          </div>
        )}

        {/* Tab Navigation with Glass Effect */}
        <div className="mb-6 border-b border-gray-700/50 overflow-x-auto">
          <div className="flex space-x-1">
            {[
              { id: 'pending', label: 'Pending Review', icon: Clock, count: pendingRentals.length + pendingTasks.length },
              { id: 'allRentals', label: 'All Rentals', icon: Package, count: allRentals.length },
              { id: 'allTasks', label: 'All Tasks', icon: Briefcase, count: allTasks.length },
              { id: 'users', label: 'Users', icon: Users, count: users.length },
              { id: 'audit', label: 'Audit Logs', icon: Shield, count: auditTotal },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 font-medium transition-all relative whitespace-nowrap flex items-center gap-2 rounded-t-xl backdrop-blur-sm ${
                  activeTab === tab.id 
                    ? 'text-blue-400 bg-blue-500/10 border-t border-x border-blue-500/30' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                }`}>
                <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* PENDING REVIEW TAB */}
          {activeTab === 'pending' && (
            <div className="space-y-8">
              {/* Pending Rentals */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  Pending Rentals ({pendingRentals.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {pendingRentals.map((rental) => (
                    <div key={rental._id} className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative">
                        <h3 className="text-xl font-semibold text-white mb-2">{rental.title}</h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{rental.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                          <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg backdrop-blur-sm">{rental.category}</span>
                          <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg backdrop-blur-sm">LKR {rental.dailyRate}/day</span>
                          <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg backdrop-blur-sm">Owner: {rental.owner?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <ActionButton onClick={() => moderate('rentals', rental._id, 'approved')} variant="success" icon={CheckCircle}>Approve</ActionButton>
                          <ActionButton onClick={() => { setRejectDraft({ type: 'rentals', id: rental._id, reasonCode: 'other', note: '' }); setDrawerMode('rejectRental'); }} variant="danger" icon={XCircle}>Reject</ActionButton>
                          <ActionButton onClick={() => openRentalEditor(rental)} variant="primary" icon={Edit}>Edit</ActionButton>
                          <ActionButton onClick={() => deleteEntity('rentals', rental._id)} variant="ghost" icon={Trash2}>Delete</ActionButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingRentals.length === 0 && (
                  <div className="text-center py-12 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                    <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No pending rentals</p>
                  </div>
                )}
              </div>

              {/* Pending Tasks */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                    <Briefcase className="w-5 h-5 text-purple-400" />
                  </div>
                  Pending Tasks ({pendingTasks.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {pendingTasks.map((task) => (
                    <div key={task._id} className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative">
                        <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">{task.description}</h3>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                          <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg backdrop-blur-sm">{task.category}</span>
                          <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg backdrop-blur-sm">LKR {task.budget}</span>
                          <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg backdrop-blur-sm">{task.location}</span>
                          <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg backdrop-blur-sm">Posted by: {task.creator?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <ActionButton onClick={() => moderate('tasks', task._id, 'approved')} variant="success" icon={CheckCircle}>Approve</ActionButton>
                          <ActionButton onClick={() => { setRejectDraft({ type: 'tasks', id: task._id, reasonCode: 'other', note: '' }); setDrawerMode('rejectTask'); }} variant="danger" icon={XCircle}>Reject</ActionButton>
                          <ActionButton onClick={() => openTaskEditor(task)} variant="primary" icon={Edit}>Edit</ActionButton>
                          <ActionButton onClick={() => deleteEntity('tasks', task._id)} variant="ghost" icon={Trash2}>Delete</ActionButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingTasks.length === 0 && (
                  <div className="text-center py-12 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                    <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No pending tasks</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ALL RENTALS TAB */}
          {activeTab === 'allRentals' && (
            <div className="space-y-4">
              {/* Filters Bar with Glass Effect */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search rentals..." 
                      value={rentalSearchQuery} 
                      onChange={(e) => setRentalSearchQuery(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <select 
                    value={rentalStatusFilter} 
                    onChange={(e) => setRentalStatusFilter(e.target.value)} 
                    className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select 
                    value={rentalCategoryFilter} 
                    onChange={(e) => setRentalCategoryFilter(e.target.value)} 
                    className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Lab Gear">Lab Gear</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setRentalViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                      className="p-2.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-all"
                    >
                      {rentalViewMode === 'grid' ? <List className="w-4 h-4 text-gray-400" /> : <LayoutGrid className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button className="p-2.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-all">
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rentals Grid */}
              <div className={`grid ${rentalViewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-5`}>
                {paginatedRentals.map((rental) => (
                  <div key={rental._id} className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 hover:shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">{rental.title}</h3>
                        {getModerationBadge(rental.moderationStatus)}
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{rental.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                        <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg">{rental.category}</span>
                        <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg">LKR {rental.dailyRate}/day</span>
                        <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg">Owner: {rental.owner?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {rental.moderationStatus === 'approved' && (
                          <ActionButton onClick={() => cancelApproval('rentals', rental._id)} variant="warning" icon={Undo2} className="text-sm">Cancel Approval</ActionButton>
                        )}
                        {rental.moderationStatus === 'pending' && (
                          <>
                            <ActionButton onClick={() => moderate('rentals', rental._id, 'approved')} variant="success" icon={CheckCircle}>Approve</ActionButton>
                            <ActionButton onClick={() => { setRejectDraft({ type: 'rentals', id: rental._id, reasonCode: 'other', note: '' }); setDrawerMode('rejectRental'); }} variant="danger" icon={XCircle}>Reject</ActionButton>
                          </>
                        )}
                        <ActionButton onClick={() => openRentalEditor(rental)} variant="primary" icon={Edit}>Edit</ActionButton>
                        <ActionButton onClick={() => deleteEntity('rentals', rental._id)} variant="ghost" icon={Trash2}>Delete</ActionButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination with Glass Effect */}
              {totalRentalPages > 1 && (
                <div className="flex justify-center gap-3 mt-6">
                  <button 
                    onClick={() => setRentalCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={rentalCurrentPage === 1} 
                    className="px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 disabled:opacity-50 hover:bg-gray-700/50 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-gray-400">Page {rentalCurrentPage} of {totalRentalPages}</span>
                  <button 
                    onClick={() => setRentalCurrentPage(p => Math.min(totalRentalPages, p + 1))} 
                    disabled={rentalCurrentPage === totalRentalPages} 
                    className="px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 disabled:opacity-50 hover:bg-gray-700/50 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ALL TASKS TAB */}
          {activeTab === 'allTasks' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search tasks..." 
                      value={taskSearchQuery} 
                      onChange={(e) => setTaskSearchQuery(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                  <select 
                    value={taskStatusFilter} 
                    onChange={(e) => setTaskStatusFilter(e.target.value)} 
                    className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select 
                    value={taskCategoryFilter} 
                    onChange={(e) => setTaskCategoryFilter(e.target.value)} 
                    className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Academic">Academic</option>
                    <option value="Technical">Technical</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setTaskViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                      className="p-2.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-all"
                    >
                      {taskViewMode === 'grid' ? <List className="w-4 h-4 text-gray-400" /> : <LayoutGrid className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={`grid ${taskViewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-5`}>
                {paginatedTasks.map((task) => (
                  <div key={task._id} className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white line-clamp-1">{task.description}</h3>
                        {getModerationBadge(task.moderationStatus)}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                        <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg">{task.category}</span>
                        <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg">LKR {task.budget}</span>
                        <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg">{task.location}</span>
                        <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg">Posted by: {task.creator?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {task.moderationStatus === 'approved' && (
                          <ActionButton onClick={() => cancelApproval('tasks', task._id)} variant="warning" icon={Undo2}>Cancel Approval</ActionButton>
                        )}
                        {task.moderationStatus === 'pending' && (
                          <>
                            <ActionButton onClick={() => moderate('tasks', task._id, 'approved')} variant="success" icon={CheckCircle}>Approve</ActionButton>
                            <ActionButton onClick={() => { setRejectDraft({ type: 'tasks', id: task._id, reasonCode: 'other', note: '' }); setDrawerMode('rejectTask'); }} variant="danger" icon={XCircle}>Reject</ActionButton>
                          </>
                        )}
                        <ActionButton onClick={() => openTaskEditor(task)} variant="primary" icon={Edit}>Edit</ActionButton>
                        <ActionButton onClick={() => deleteEntity('tasks', task._id)} variant="ghost" icon={Trash2}>Delete</ActionButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalTaskPages > 1 && (
                <div className="flex justify-center gap-3 mt-6">
                  <button 
                    onClick={() => setTaskCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={taskCurrentPage === 1} 
                    className="px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 disabled:opacity-50 hover:bg-gray-700/50 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-gray-400">Page {taskCurrentPage} of {totalTaskPages}</span>
                  <button 
                    onClick={() => setTaskCurrentPage(p => Math.min(totalTaskPages, p + 1))} 
                    disabled={taskCurrentPage === totalTaskPages} 
                    className="px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 disabled:opacity-50 hover:bg-gray-700/50 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {users.map((targetUser) => (
                <div key={targetUser._id} className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {targetUser.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{targetUser.name}</h3>
                        <p className="text-gray-400 text-sm">{targetUser.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Role</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                          targetUser.role === 'admin' 
                            ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-400' 
                            : 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400'
                        }`}>{targetUser.role}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Trust Score</span>
                        <span className="text-white font-medium">{targetUser.trustScore?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className={targetUser.isSuspended ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>
                          {targetUser.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ActionButton onClick={() => toggleRole(targetUser)} variant="primary" className="flex-1">
                        Make {targetUser.role === 'admin' ? 'Student' : 'Admin'}
                      </ActionButton>
                      <ActionButton 
                        onClick={() => toggleSuspended(targetUser)} 
                        variant={targetUser.isSuspended ? "warning" : "danger"} 
                        icon={targetUser.isSuspended ? UserCheck : UserX}
                        className="flex-1"
                      >
                        {targetUser.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Audit Statistics Summary */}
              {auditStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <span className="text-2xl font-bold text-white">{auditStats.totalActions || 0}</span>
                    </div>
                    <p className="text-xs text-gray-400">Total Actions</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="w-5 h-5 text-green-400" />
                      <span className="text-2xl font-bold text-white">{auditStats.uniqueUsers || 0}</span>
                    </div>
                    <p className="text-xs text-gray-400">Unverified Users</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <span className="text-2xl font-bold text-white">{auditStats.actionsPerDay || 0}</span>
                    </div>
                    <p className="text-xs text-gray-400">Actions per Day (avg)</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <span className="text-2xl font-bold text-white">{auditStats.mostActiveHour || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-400">Peak Activity Hour</p>
                  </div>
                </div>
              )}

              {/* Advanced Filters */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-5">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-white font-semibold flex items-center gap-2 hover:text-blue-400 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Advanced Filters
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  <div className="flex gap-2">
                    <ActionButton onClick={resetFilters} variant="ghost" icon={RefreshCw}>Reset</ActionButton>
                    <ActionButton onClick={saveCurrentAuditView} variant="primary" icon={Save}>Save View</ActionButton>
                    <ActionButton onClick={exportAuditLogsCsv} variant="success" icon={Download}>Export CSV</ActionButton>
                  </div>
                </div>
                
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                    {/* Saved Views Dropdown */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium">Saved Views</label>
                      <select
                        value={selectedSavedAuditViewId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedSavedAuditViewId(id);
                          const view = savedAuditViews.find((v) => v.id === id);
                          if (view) applySavedAuditView(view);
                        }}
                        className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">Custom filters</option>
                        {savedAuditViews.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Search */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium">Search</label>
                      <input
                        type="text"
                        placeholder="Search by user, action, target..."
                        value={logFilters.q}
                        onChange={(e) => {
                          const updatedFilters = { ...logFilters, q: e.target.value, page: 1 };
                          setLogFilters(updatedFilters);
                          loadAuditLogs(updatedFilters);
                        }}
                        className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Target Type */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium">Target Type</label>
                      <select
                        value={logFilters.targetType}
                        onChange={(e) => {
                          const newTargetType = e.target.value;
                          setLogFilters(prev => ({ ...prev, targetType: newTargetType, page: 1 }));
                        }}
                        className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
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
                      <label className="block text-xs text-gray-400 mb-2 font-medium">User Role</label>
                      <select
                        value={logFilters.userRole}
                        onChange={(e) => {
                          const newUserRole = e.target.value;
                          setLogFilters(prev => ({ ...prev, userRole: newUserRole, page: 1 }));
                        }}
                        className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">All roles</option>
                        <option value="admin">Admin</option>
                        <option value="student">Student</option>
                      </select>
                    </div>

                    {/* Date Range Preset */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium">Date Range</label>
                      <select
                        value={dateRangePreset}
                        onChange={(e) => {
                          const newPreset = e.target.value;
                          setDateRangePreset(newPreset);
                          if (newPreset !== 'custom') {
                            const updatedFilters = { ...logFilters, from: '', to: '', page: 1 };
                            setLogFilters(updatedFilters);
                            loadAuditLogs(updatedFilters);
                          }
                        }}
                        className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="custom">Custom range</option>
                      </select>
                    </div>

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
                          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Include student actions</span>
                      </label>
                    </div>

                    {/* Custom Date Range */}
                    {dateRangePreset === 'custom' && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-400 mb-2 font-medium">From Date</label>
                          <input
                            type="date"
                            value={logFilters.from}
                            onChange={(e) => {
                              const newFrom = e.target.value;
                              setLogFilters(prev => ({ ...prev, from: newFrom, page: 1 }));
                            }}
                            className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-2 font-medium">To Date</label>
                          <input
                            type="date"
                            value={logFilters.to}
                            onChange={(e) => {
                              const newTo = e.target.value;
                              setLogFilters(prev => ({ ...prev, to: newTo, page: 1 }));
                            }}
                            className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Apply Filters Button */}
                <div className="mt-5">
                  <ActionButton onClick={() => {
                    const currentFilters = { ...logFilters, page: 1 };
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
                      className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedLogDetails(selectedLogDetails === log._id ? null : log._id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${actionColorClass} backdrop-blur-sm`}>
                            <ActionIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-medium bg-gradient-to-r ${actionColorClass}`}>
                                {log.action?.toUpperCase() || 'ACTION'}
                              </span>
                              <span className="text-xs text-gray-600">•</span>
                              <span className="text-xs text-gray-400 font-mono">{log.targetType}</span>
                              {log.user?.role === 'admin' && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-400">Admin</span>
                              )}
                              {log.user?.role === 'student' && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400">Student</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 font-mono mb-2 break-all">
                              Target: {log.targetId}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{formatUserInfo(log.user)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-400 group-hover:text-blue-300 transition-colors">
                          {selectedLogDetails === log._id ? 'Hide details ▲' : 'View details ▼'}
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {selectedLogDetails === log._id && (
                        <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-3 animate-fadeIn">
                          {(log.ipAddress || log.userAgent) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {log.ipAddress && (
                                <div className="bg-gray-900/30 p-3 rounded-xl">
                                  <p className="text-gray-500 mb-1">IP Address</p>
                                  <p className="text-gray-300 font-mono">{log.ipAddress}</p>
                                </div>
                              )}
                              {log.userAgent && (
                                <div className="bg-gray-900/30 p-3 rounded-xl">
                                  <p className="text-gray-500 mb-1">User Agent</p>
                                  <p className="text-gray-300 text-xs break-all">{log.userAgent}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {(log.details?.before || log.details?.after) && (
                            <div className="bg-gray-900/30 p-3 rounded-xl">
                              <p className="text-xs text-gray-500 mb-2 font-semibold">Changes:</p>
                              <div className="space-y-2">
                                {log.details?.before && (
                                  <div>
                                    <p className="text-xs text-red-400 mb-1">Before:</p>
                                    <pre className="text-xs bg-black/30 p-2 rounded-lg overflow-x-auto font-mono">
                                      {JSON.stringify(log.details.before, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.details?.after && (
                                  <div>
                                    <p className="text-xs text-green-400 mb-1">After:</p>
                                    <pre className="text-xs bg-black/30 p-2 rounded-lg overflow-x-auto font-mono">
                                      {JSON.stringify(log.details.after, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {log.details?.reason && (
                            <div className="bg-gray-900/30 p-3 rounded-xl">
                              <p className="text-xs text-gray-500 mb-1">Reason:</p>
                              <p className="text-xs text-gray-300">{log.details.reason}</p>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 bg-gray-900/30 p-3 rounded-xl">
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
                <div className="text-center py-16 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                  <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No audit logs found</p>
                  <p className="text-gray-600 text-sm mt-2">Try adjusting your filters</p>
                </div>
              )}
              
              {/* Pagination */}
              {auditTotal > 0 && (
                <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
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
                      className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
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

      {/* Drawers with Glass Effect */}
      {drawerMode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeDrawer()}>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-lg p-6 border border-gray-700 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {drawerMode === 'editRental' && 'Edit Rental'}
                {drawerMode === 'rejectRental' && 'Reject Rental'}
                {drawerMode === 'editTask' && 'Edit Task'}
                {drawerMode === 'rejectTask' && 'Reject Task'}
              </h2>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {(drawerMode === 'editRental') && (
              <div className="space-y-4">
                <input 
                  value={rentalForm.title} 
                  onChange={(e) => setRentalForm(p => ({ ...p, title: e.target.value }))} 
                  placeholder="Title" 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <textarea 
                  value={rentalForm.description} 
                  onChange={(e) => setRentalForm(p => ({ ...p, description: e.target.value }))} 
                  rows={3} 
                  placeholder="Description" 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <select 
                  value={rentalForm.category} 
                  onChange={(e) => setRentalForm(p => ({ ...p, category: e.target.value }))} 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option>Electronics</option>
                  <option>Lab Gear</option>
                  <option>Sports</option>
                  <option>Other</option>
                </select>
                <input 
                  type="number" 
                  value={rentalForm.dailyRate} 
                  onChange={(e) => setRentalForm(p => ({ ...p, dailyRate: e.target.value }))} 
                  placeholder="Daily Rate" 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-3 pt-2">
                  <ActionButton onClick={() => submitRentalEdit(editingRental)} variant="success">Save Changes</ActionButton>
                  <ActionButton onClick={closeDrawer} variant="ghost">Cancel</ActionButton>
                </div>
              </div>
            )}
            
            {(drawerMode === 'editTask') && (
              <div className="space-y-4">
                <textarea 
                  value={taskForm.description} 
                  onChange={(e) => setTaskForm(p => ({ ...p, description: e.target.value }))} 
                  rows={3} 
                  placeholder="Description" 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <select 
                  value={taskForm.category} 
                  onChange={(e) => setTaskForm(p => ({ ...p, category: e.target.value }))} 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option>Delivery</option>
                  <option>Cleaning</option>
                  <option>Academic</option>
                  <option>Technical</option>
                  <option>Other</option>
                </select>
                <input 
                  type="number" 
                  value={taskForm.budget} 
                  onChange={(e) => setTaskForm(p => ({ ...p, budget: e.target.value }))} 
                  placeholder="Budget" 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <input 
                  type="datetime-local" 
                  value={taskForm.deadline} 
                  onChange={(e) => setTaskForm(p => ({ ...p, deadline: e.target.value }))} 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
                <input 
                  value={taskForm.location} 
                  onChange={(e) => setTaskForm(p => ({ ...p, location: e.target.value }))} 
                  placeholder="Location" 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <select 
                  value={taskForm.status} 
                  onChange={(e) => setTaskForm(p => ({ ...p, status: e.target.value }))} 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
                <div className="flex gap-3 pt-2">
                  <ActionButton onClick={() => submitTaskEdit(editingTask)} variant="success">Save Changes</ActionButton>
                  <ActionButton onClick={closeDrawer} variant="ghost">Cancel</ActionButton>
                </div>
              </div>
            )}
            
            {(drawerMode === 'rejectRental' || drawerMode === 'rejectTask') && rejectDraft && (
              <div className="space-y-4">
                <select 
                  value={rejectDraft.reasonCode} 
                  onChange={(e) => setRejectDraft(p => ({ ...p, reasonCode: e.target.value }))} 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-red-500"
                >
                  {REJECTION_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <textarea 
                  value={rejectDraft.note} 
                  onChange={(e) => setRejectDraft(p => ({ ...p, note: e.target.value }))} 
                  rows={3} 
                  placeholder="Optional note..." 
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
                <div className="flex gap-3 pt-2">
                  <ActionButton onClick={async () => { 
                    try { 
                      await moderateRequest(rejectDraft.type, rejectDraft.id, 'rejected', { 
                        moderationReasonCode: rejectDraft.reasonCode, 
                        moderationNote: rejectDraft.note 
                      }); 
                      pushToast('success', 'Rejected', 'Item rejected successfully.'); 
                      closeDrawer(); 
                      loadAllData(); 
                    } catch (err) { 
                      pushToast('error', 'Failed', err.message); 
                    } 
                  }} variant="danger">Confirm Rejection</ActionButton>
                  <ActionButton onClick={closeDrawer} variant="ghost">Cancel</ActionButton>
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