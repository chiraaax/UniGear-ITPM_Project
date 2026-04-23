const express = require('express');
const Item = require('../models/Item');
const Task = require('../models/Task');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.use(auth, requireAdmin);

const MODERATION_REASON_CODES = [
  'unsafe_content',
  'spam',
  'duplicate',
  'pricing_abuse',
  'missing_information',
  'other',
];

const validateString = (value, min = 1, max = 300) =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

const pickRentalAudit = (rentalDoc) => {
  const rental = rentalDoc?.toObject ? rentalDoc.toObject() : rentalDoc;
  return rental
    ? {
        _id: rental._id,
        title: rental.title,
        description: rental.description,
        category: rental.category,
        dailyRate: rental.dailyRate,
        isActive: rental.isActive,
        moderationStatus: rental.moderationStatus,
        moderationNote: rental.moderationNote,
        moderationReasonCode: rental.moderationReasonCode,
        createdAt: rental.createdAt,
        moderatedAt: rental.moderatedAt,
      }
    : null;
};

const pickTaskAudit = (taskDoc) => {
  const task = taskDoc?.toObject ? taskDoc.toObject() : taskDoc;
  return task
    ? {
        _id: task._id,
        description: task.description,
        category: task.category,
        budget: task.budget,
        deadline: task.deadline,
        location: task.location,
        status: task.status,
        moderationStatus: task.moderationStatus,
        moderationNote: task.moderationNote,
        moderationReasonCode: task.moderationReasonCode,
        createdAt: task.createdAt,
        moderatedAt: task.moderatedAt,
      }
    : null;
};

const pickUserAudit = (userDoc) => {
  const user = userDoc?.toObject ? userDoc.toObject() : userDoc;
  return user
    ? {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        isSuspended: user.isSuspended,
      }
    : null;
};

const writeAuditLog = async ({ adminId, adminRole, action, targetType, targetId, details = {} }) => {
  await AdminAuditLog.create({
    admin: adminId,
    adminRole: adminRole,
    action,
    targetType,
    targetId,
    details,
  });
};

// -------------------- Dashboard & Stats --------------------
router.get('/dashboard', async (req, res, next) => {
  try {
    const [pendingRentals, pendingTasks, totalUsers] = await Promise.all([
      Item.countDocuments({ moderationStatus: 'pending' }),
      Task.countDocuments({ moderationStatus: 'pending' }),
      User.countDocuments({}),
    ]);
    res.json({ pendingRentals, pendingTasks, totalUsers });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', async (req, res, next) => {
  try {
    const [
      rentalPending,
      rentalApproved,
      rentalRejected,
      taskPending,
      taskApproved,
      taskRejected,
      rentalAvg,
      taskAvg,
    ] = await Promise.all([
      Item.countDocuments({ moderationStatus: 'pending' }),
      Item.countDocuments({ moderationStatus: 'approved' }),
      Item.countDocuments({ moderationStatus: 'rejected' }),
      Task.countDocuments({ moderationStatus: 'pending' }),
      Task.countDocuments({ moderationStatus: 'approved' }),
      Task.countDocuments({ moderationStatus: 'rejected' }),
      Item.aggregate([
        { $match: { moderationStatus: 'approved', moderatedAt: { $ne: null } } },
        { $project: { diffMs: { $subtract: ['$moderatedAt', '$createdAt'] } } },
        { $group: { _id: null, avgDiffMs: { $avg: '$diffMs' } } },
      ]),
      Task.aggregate([
        { $match: { moderationStatus: 'approved', moderatedAt: { $ne: null } } },
        { $project: { diffMs: { $subtract: ['$moderatedAt', '$createdAt'] } } },
        { $group: { _id: null, avgDiffMs: { $avg: '$diffMs' } } },
      ]),
    ]);

    const rentalAvgHours = rentalAvg?.[0]?.avgDiffMs ? rentalAvg[0].avgDiffMs / 3600000 : 0;
    const taskAvgHours = taskAvg?.[0]?.avgDiffMs ? taskAvg[0].avgDiffMs / 3600000 : 0;

    res.json({
      rentals: {
        pending: rentalPending,
        approved: rentalApproved,
        rejected: rentalRejected,
        avgModerationHours: rentalAvgHours,
      },
      tasks: {
        pending: taskPending,
        approved: taskApproved,
        rejected: taskRejected,
        avgModerationHours: taskAvgHours,
      },
      overall: {
        pending: rentalPending + taskPending,
        approved: rentalApproved + taskApproved,
        rejected: rentalRejected + taskRejected,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/queue-stats', async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [staleRentals, staleTasks, recentRejectedRentals, recentRejectedTasks] = await Promise.all([
      Item.countDocuments({ moderationStatus: 'pending', createdAt: { $lte: sevenDaysAgo } }),
      Task.countDocuments({ moderationStatus: 'pending', createdAt: { $lte: sevenDaysAgo } }),
      Item.countDocuments({ moderationStatus: 'rejected', moderatedAt: { $gte: sevenDaysAgo } }),
      Task.countDocuments({ moderationStatus: 'rejected', moderatedAt: { $gte: sevenDaysAgo } }),
    ]);

    res.json({
      staleRentals,
      staleTasks,
      recentRejectedRentals,
      recentRejectedTasks,
    });
  } catch (err) {
    next(err);
  }
});

// -------------------- Rental Management --------------------
router.get('/rentals', async (req, res, next) => {
  try {
    const { moderationStatus = 'pending' } = req.query;
    const query = moderationStatus === 'all' ? {} : { moderationStatus };
    const rentals = await Item.find(query).sort({ createdAt: -1 }).populate('owner', 'name email');
    res.json(rentals);
  } catch (err) {
    next(err);
  }
});

router.patch('/rentals/:id/moderate', async (req, res, next) => {
  try {
    const { moderationStatus, moderationNote = '', moderationReasonCode = null } = req.body;
    if (!['approved', 'rejected'].includes(moderationStatus)) {
      return res.status(400).json({ message: 'Invalid moderation status.' });
    }
    if (moderationNote && !validateString(moderationNote, 2, 300)) {
      return res.status(400).json({ message: 'Moderation note must be 2-300 characters.' });
    }
    if (moderationReasonCode !== null && !MODERATION_REASON_CODES.includes(moderationReasonCode)) {
      return res.status(400).json({ message: 'Invalid moderation reason code.' });
    }
    const rental = await Item.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found.' });
    }
    const before = pickRentalAudit(rental);
    rental.moderationStatus = moderationStatus;
    rental.moderationNote = moderationNote.trim();
    rental.moderationReasonCode = moderationStatus === 'rejected' ? moderationReasonCode || 'other' : null;
    rental.moderatedBy = req.user._id;
    rental.moderatedAt = new Date();
    await rental.save();
    await writeAuditLog({
      adminId: req.user._id,
      action: `rental_${moderationStatus}`,
      targetType: 'rental',
      targetId: rental._id,
      details: { before, after: pickRentalAudit(rental) },
    });
    res.json(rental);
  } catch (err) {
    next(err);
  }
});

router.patch('/rentals/:id', async (req, res, next) => {
  try {
    const rental = await Item.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found.' });
    }
    const before = pickRentalAudit(rental);
    const { title, description, category, dailyRate, isActive } = req.body;
    if (title !== undefined) {
      if (!validateString(title, 3, 100)) return res.status(400).json({ message: 'Title must be 3-100 characters.' });
      rental.title = title.trim();
    }
    if (description !== undefined) {
      if (description && !validateString(description, 3, 500)) return res.status(400).json({ message: 'Description must be 3-500 characters.' });
      rental.description = description?.trim();
    }
    if (category !== undefined) {
      const categories = ['Electronics', 'Lab Gear', 'Sports', 'Other'];
      if (!categories.includes(category)) return res.status(400).json({ message: 'Invalid category.' });
      rental.category = category;
    }
    if (dailyRate !== undefined) {
      if (Number.isNaN(Number(dailyRate)) || Number(dailyRate) < 0) return res.status(400).json({ message: 'Daily rate must be a positive number.' });
      rental.dailyRate = Number(dailyRate);
    }
    if (isActive !== undefined) {
      rental.isActive = !!isActive;
    }
    await rental.save();
    await writeAuditLog({
      adminId: req.user._id,
      action: 'rental_updated',
      targetType: 'rental',
      targetId: rental._id,
      details: { before, after: pickRentalAudit(rental) },
    });
    res.json(rental);
  } catch (err) {
    next(err);
  }
});

router.delete('/rentals/:id', async (req, res, next) => {
  try {
    const rental = await Item.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found.' });
    }
    const before = pickRentalAudit(rental);
    await writeAuditLog({
      adminId: req.user._id,
      action: 'rental_deleted',
      targetType: 'rental',
      targetId: rental._id,
      details: { before },
    });
    await rental.deleteOne();
    res.json({ message: 'Rental item deleted.' });
  } catch (err) {
    next(err);
  }
});

router.patch('/rentals/bulk-moderate', async (req, res, next) => {
  try {
    const { ids, moderationStatus } = req.body;
    if (!['approved', 'rejected'].includes(moderationStatus) || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Invalid payload' });
    }
    await Item.updateMany({ _id: { $in: ids } }, { $set: { moderationStatus, moderatedBy: req.user._id, moderatedAt: new Date() } });
    await writeAuditLog({
      adminId: req.user._id,
      action: `bulk_rental_${moderationStatus}`,
      targetType: 'rental',
      targetId: ids[0],
      details: { count: ids.length, ids },
    });
    res.json({ message: `Successfully ${moderationStatus} ${ids.length} rentals` });
  } catch (err) {
    next(err);
  }
});

router.get('/rentals/export', async (req, res, next) => {
  try {
    const rentals = await Item.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rentals-export.csv"');
    const header = ['ID', 'Title', 'Category', 'Daily Rate', 'Status', 'Owner Name', 'Owner Email', 'Created At'];
    const rows = rentals.map(r => [
      r._id,
      `"${r.title}"`,
      `"${r.category}"`,
      r.dailyRate,
      r.moderationStatus,
      `"${r.owner?.name || ''}"`,
      `"${r.owner?.email || ''}"`,
      r.createdAt,
    ]);
    const csv = [header.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

// -------------------- Task Management --------------------
router.get('/tasks', async (req, res, next) => {
  try {
    const { moderationStatus = 'pending' } = req.query;
    const query = moderationStatus === 'all' ? {} : { moderationStatus };
    const tasks = await Task.find(query).sort({ createdAt: -1 }).populate('creator', 'name email');
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.patch('/tasks/:id/moderate', async (req, res, next) => {
  try {
    const { moderationStatus, moderationNote = '', moderationReasonCode = null } = req.body;
    if (!['approved', 'rejected'].includes(moderationStatus)) {
      return res.status(400).json({ message: 'Invalid moderation status.' });
    }
    if (moderationNote && !validateString(moderationNote, 2, 300)) {
      return res.status(400).json({ message: 'Moderation note must be 2-300 characters.' });
    }
    if (moderationReasonCode !== null && !MODERATION_REASON_CODES.includes(moderationReasonCode)) {
      return res.status(400).json({ message: 'Invalid moderation reason code.' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    const before = pickTaskAudit(task);
    task.moderationStatus = moderationStatus;
    task.moderationNote = moderationNote.trim();
    task.moderationReasonCode = moderationStatus === 'rejected' ? moderationReasonCode || 'other' : null;
    task.moderatedBy = req.user._id;
    task.moderatedAt = new Date();
    await task.save();
    await writeAuditLog({
      adminId: req.user._id,
      action: `task_${moderationStatus}`,
      targetType: 'task',
      targetId: task._id,
      details: { before, after: pickTaskAudit(task) },
    });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.patch('/tasks/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const before = pickTaskAudit(task);
    const { description, category, budget, deadline, location, status } = req.body;
    if (description !== undefined) {
      if (!validateString(description, 5, 500)) return res.status(400).json({ message: 'Description must be 5-500 characters.' });
      task.description = description.trim();
    }
    if (category !== undefined) {
      const categories = ['Delivery', 'Cleaning', 'Academic', 'Technical', 'Other'];
      if (!categories.includes(category)) return res.status(400).json({ message: 'Invalid category.' });
      task.category = category;
    }
    if (budget !== undefined) {
      if (Number.isNaN(Number(budget)) || Number(budget) < 0) return res.status(400).json({ message: 'Budget must be a positive number.' });
      task.budget = Number(budget);
    }
    if (deadline !== undefined) {
      const parsed = new Date(deadline);
      if (Number.isNaN(parsed.getTime())) return res.status(400).json({ message: 'Invalid deadline.' });
      task.deadline = parsed;
    }
    if (location !== undefined) {
      if (!validateString(location, 2, 150)) return res.status(400).json({ message: 'Location must be 2-150 characters.' });
      task.location = location.trim();
    }
    if (status !== undefined) {
      const statuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
      if (!statuses.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
      task.status = status;
    }
    await task.save();
    await writeAuditLog({
      adminId: req.user._id,
      action: 'task_updated',
      targetType: 'task',
      targetId: task._id,
      details: { before, after: pickTaskAudit(task) },
    });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.delete('/tasks/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const before = pickTaskAudit(task);
    await writeAuditLog({
      adminId: req.user._id,
      action: 'task_deleted',
      targetType: 'task',
      targetId: task._id,
      details: { before },
    });
    await task.deleteOne();
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
});

router.patch('/tasks/bulk-moderate', async (req, res, next) => {
  try {
    const { ids, moderationStatus } = req.body;
    if (!['approved', 'rejected'].includes(moderationStatus) || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Invalid payload' });
    }
    await Task.updateMany({ _id: { $in: ids } }, { $set: { moderationStatus, moderatedBy: req.user._id, moderatedAt: new Date() } });
    await writeAuditLog({
      adminId: req.user._id,
      action: `bulk_task_${moderationStatus}`,
      targetType: 'task',
      targetId: ids[0],
      details: { count: ids.length, ids },
    });
    res.json({ message: `Successfully ${moderationStatus} ${ids.length} tasks` });
  } catch (err) {
    next(err);
  }
});

router.get('/tasks/export', async (req, res, next) => {
  try {
    const tasks = await Task.find().populate('creator', 'name email').sort({ createdAt: -1 });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.csv"');
    const header = ['ID', 'Description', 'Category', 'Budget', 'Status', 'Creator Name', 'Creator Email', 'Created At'];
    const rows = tasks.map(t => [
      t._id,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.budget,
      t.moderationStatus,
      `"${t.creator?.name || ''}"`,
      `"${t.creator?.email || ''}"`,
      t.createdAt,
    ]);
    const csv = [header.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

// -------------------- User Management --------------------
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({}).select('name email role isVerified trustScore isSuspended createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const before = pickUserAudit(user);
    const { role, isVerified, trustScore, isSuspended } = req.body;
    if (role !== undefined) {
      if (!['student', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
      user.role = role;
    }
    if (isVerified !== undefined) user.isVerified = !!isVerified;
    if (isSuspended !== undefined) user.isSuspended = !!isSuspended;
    if (trustScore !== undefined) {
      const score = Number(trustScore);
      if (Number.isNaN(score) || score < 0 || score > 5) return res.status(400).json({ message: 'Trust score must be between 0 and 5.' });
      user.trustScore = score;
    }
    if (user._id.equals(req.user._id) && user.role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin access.' });
    }
    await user.save();
    await writeAuditLog({
      adminId: req.user._id,
      action: 'user_updated',
      targetType: 'user',
      targetId: user._id,
      details: { before, after: pickUserAudit(user) },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/warn', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.warnings = (user.warnings || 0) + 1;
    await user.save();
    await writeAuditLog({
      adminId: req.user._id,
      action: 'user_warned',
      targetType: 'user',
      targetId: user._id,
      details: { warningCount: user.warnings },
    });
    res.json({ message: 'User warned successfully', warnings: user.warnings });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/message', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message cannot be empty' });
    await writeAuditLog({
      adminId: req.user._id,
      action: 'user_messaged',
      targetType: 'user',
      targetId: req.params.id,
      details: { message },
    });
    res.json({ message: 'Message sent successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/users/:id/details', async (req, res, next) => {
  try {
    const [rentals, tasks] = await Promise.all([
      Item.find({ owner: req.params.id }).sort({ createdAt: -1 }),
      Task.find({ creator: req.params.id }).sort({ createdAt: -1 }),
    ]);
    res.json({ rentals, tasks });
  } catch (err) {
    next(err);
  }
});

router.get('/users/export', async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    const header = ['ID', 'Name', 'Email', 'Role', 'Verified', 'Suspended', 'Warnings', 'Created At'];
    const rows = users.map(u => [
      u._id,
      `"${u.name}"`,
      `"${u.email}"`,
      u.role,
      u.isVerified,
      u.isSuspended,
      u.warnings || 0,
      u.createdAt,
    ]);
    const csv = [header.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

// -------------------- Audit Logs --------------------
router.get('/audit-logs', async (req, res, next) => {
  try {
    const {
      action,
      targetType,
      adminId,
      userId,
      userRole,
      targetId,
      q,
      from,
      to,
      limit = '25',
      page = '1',
      includeStudentActions = 'true',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (action) query.action = String(action);
    if (targetType) query.targetType = String(targetType);
    if (adminId) query.admin = String(adminId);
    if (targetId) query.targetId = String(targetId);
    if (userId) query.admin = String(userId);
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    if (q && q.trim()) {
      query.$or = [
        { action: { $regex: String(q), $options: 'i' } },
        { targetType: { $regex: String(q), $options: 'i' } },
        { targetId: { $regex: String(q), $options: 'i' } },
      ];
    }

    const parsedLimitRaw = Number(limit);
    const parsedPageRaw = Number(page);
    const parsedLimit = Math.min(Math.max(parsedLimitRaw || 25, 1), 100);
    const parsedPage = Math.max(parsedPageRaw || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let logs = await AdminAuditLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit)
      .populate('admin', 'name email role');

    const includeStudents = includeStudentActions === 'true';
    let filteredLogs = logs;
    if (userRole && userRole !== '') {
      filteredLogs = logs.filter(log => log.admin?.role === userRole);
    } else if (!includeStudents && userRole !== 'admin') {
      filteredLogs = logs.filter(log => log.admin?.role === 'admin');
    }

    let total;
    if (userRole || !includeStudents) {
      const allLogs = await AdminAuditLog.find(query).populate('admin', 'role');
      let filteredAllLogs = allLogs;
      if (userRole && userRole !== '') {
        filteredAllLogs = allLogs.filter(log => log.admin?.role === userRole);
      } else if (!includeStudents) {
        filteredAllLogs = allLogs.filter(log => log.admin?.role === 'admin');
      }
      total = filteredAllLogs.length;
      const start = skip;
      const end = start + parsedLimit;
      filteredLogs = filteredAllLogs.slice(start, end);
    } else {
      total = await AdminAuditLog.countDocuments(query);
    }

    res.json({ items: filteredLogs, total });
  } catch (err) {
    console.error('Audit logs error:', err);
    next(err);
  }
});

router.get('/audit-logs/export', async (req, res, next) => {
  try {
    const { action, targetType, adminId, targetId, q, from, to, limit = '1000' } = req.query;
    const query = {};
    if (action) query.action = String(action);
    if (targetType) query.targetType = String(targetType);
    if (adminId) query.admin = String(adminId);
    if (targetId) query.targetId = String(targetId);
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    if (q) {
      query.$or = [
        { action: { $regex: String(q), $options: 'i' } },
        { targetType: { $regex: String(q), $options: 'i' } },
      ];
    }

    const csvEscape = (v) => {
      const s = v === undefined || v === null ? '' : String(v);
      const escaped = s.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const parsedLimitRaw = Number(limit);
    const parsedLimit = Math.min(Math.max(parsedLimitRaw || 1000, 1), 2000);

    const logs = await AdminAuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate('admin', 'name email');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="admin-audit-logs.csv"');

    const header = ['createdAt', 'adminName', 'adminEmail', 'action', 'targetType', 'targetId', 'detailsJson'];
    const rows = logs.map((log) => {
      const detailsJson = JSON.stringify(log.details ?? {});
      return [
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.admin?.name || '',
        log.admin?.email || '',
        log.action || '',
        log.targetType || '',
        log.targetId ? String(log.targetId) : '',
        detailsJson,
      ];
    });

    const csv = [header.map(csvEscape).join(',')]
      .concat(rows.map((r) => r.map(csvEscape).join(',')))
      .join('\n');

    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

router.delete('/audit-logs/:id', async (req, res, next) => {
  try {
    const deleted = await AdminAuditLog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Audit log not found' });
    res.json({ message: 'Audit log deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// -------------------- System Settings --------------------
const SystemSettings = require('../models/SystemSettings');

router.get('/settings', async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    await writeAuditLog({
      adminId: req.user._id,
      action: 'settings_updated',
      targetType: 'systemSettings',
    });
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// -------------------- Disputes --------------------
const Dispute = require('../models/Dispute');

router.get('/disputes', async (req, res, next) => {
  try {
    const disputes = await Dispute.find()
      .populate('reporter reportedUser', 'name email')
      .populate('messages.sender', 'name')
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    next(err);
  }
});

router.patch('/disputes/:id/resolve', async (req, res, next) => {
  try {
    const { status, resolutionNote = '' } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid dispute status' });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    dispute.status = status;
    dispute.resolutionNote = resolutionNote;
    await dispute.save();

    // Resolution should succeed even if audit logging has schema/data issues.
    try {
      await writeAuditLog({
        adminId: req.user._id,
        action: status === 'dismissed' ? 'dispute_dismissed' : 'dispute_resolved',
        targetType: 'dispute',
        targetId: dispute._id,
        details: { resolutionNote },
      });
    } catch (auditErr) {
      console.error('Audit log failed for dispute resolution:', auditErr);
    }

    res.json(dispute);
  } catch (err) {
    next(err);
  }
});

router.post('/disputes/:id/message', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    dispute.messages.push({
      sender: req.user._id,
      isAdmin: true,
      content: content.trim(),
    });
    await dispute.save();
    await dispute.populate('reporter reportedUser', 'name email');
    await dispute.populate('messages.sender', 'name');
    res.status(201).json(dispute);
  } catch (err) {
    next(err);
  }
});

router.delete('/disputes/:id', async (req, res, next) => {
  try {
    const deleted = await Dispute.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Dispute not found' });
    res.json({ message: 'Dispute deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;