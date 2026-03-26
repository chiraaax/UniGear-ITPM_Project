const express = require('express');
const Task = require('../models/Task');
const Offer = require('../models/Offer');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const requireMinTrustScore = require('../middleware/trustCheck');
const { deleteTask, getTaskById, acceptTask, updateStatus } = require('../controllers/taskController');

const router = express.Router();
const TASK_CATEGORIES = ['Delivery', 'Cleaning', 'Academic', 'Technical', 'Other'];
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const isNonEmptyString = (value, min, max) =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

// CREATE task (subject to TrustScore rule)
router.post('/', auth, requireMinTrustScore(2.0), async (req, res, next) => {
  try {
    console.log('Received task data:', req.body); // Debug log
    const { description, budget, deadline, location, category } = req.body;
    console.log('Extracted category:', category); // Debug log

    if (!isNonEmptyString(description, 5, 500)) {
      return res.status(400).json({ message: 'Description must be 5-500 characters.' });
    }
    if (!TASK_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category.' });
    }
    if (Number.isNaN(Number(budget)) || Number(budget) < 0) {
      return res.status(400).json({ message: 'Budget must be a positive number.' });
    }
    if (!isNonEmptyString(location, 2, 150)) {
      return res.status(400).json({ message: 'Location must be 2-150 characters.' });
    }
    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ message: 'Invalid deadline.' });
    }
    if (parsedDeadline <= new Date()) {
      return res.status(400).json({ message: 'Deadline must be in the future.' });
    }

    const task = await Task.create({
      creator: req.user._id,
      description: description.trim(),
      budget: Number(budget),
      deadline: parsedDeadline,
      location: location.trim(),
      category: category.trim(),
      moderationStatus: 'pending',
    });
    res.status(201).json(task);
  } catch (err) {
    console.error('Task creation error:', err.message); // Debug log
    next(err);
  }
});

// LIST tasks for job board
router.get('/', async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    let query = { moderationStatus: 'approved' };

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      const statusMapping = {
        pending: 'Pending',
        inprogress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
      };
      query.status = statusMapping[status] || status;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).populate('creator', 'name trustScore');
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// Tasks created by current user (for dashboard)
router.get('/my-tasks', auth, async (req, res, next) => {
  try {
    const tasks = await Task.find({ creator: req.user._id })
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// Strict Business Rule #2:
// A task cannot be edited once an offer has been accepted.
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own tasks.' });
    }
console.log('Current task status:', task.status); // Debug log
    if (task.status !== 'Pending') {
      return res.status(400).json({
        message: 'Task cannot be edited once an offer has been accepted.',
      });
    }

    const updatableFields = ['description', 'budget', 'deadline', 'location', 'category'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });
    if (req.body.description !== undefined && !isNonEmptyString(req.body.description, 5, 500)) {
      return res.status(400).json({ message: 'Description must be 5-500 characters.' });
    }
    if (req.body.category !== undefined && !TASK_CATEGORIES.includes(req.body.category)) {
      return res.status(400).json({ message: 'Invalid category.' });
    }
    if (req.body.budget !== undefined && (Number.isNaN(Number(req.body.budget)) || Number(req.body.budget) < 0)) {
      return res.status(400).json({ message: 'Budget must be a positive number.' });
    }
    if (req.body.location !== undefined && !isNonEmptyString(req.body.location, 2, 150)) {
      return res.status(400).json({ message: 'Location must be 2-150 characters.' });
    }
    if (req.body.deadline !== undefined) {
      const parsed = new Date(req.body.deadline);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid deadline.' });
      }
      task.deadline = parsed;
    }
    if (req.body.description !== undefined) {
      task.description = req.body.description.trim();
    }
    if (req.body.location !== undefined) {
      task.location = req.body.location.trim();
    }
    if (req.body.budget !== undefined) {
      task.budget = Number(req.body.budget);
    }
    task.moderationStatus = 'pending';
    task.moderationNote = '';
    task.moderatedBy = null;
    task.moderatedAt = null;

    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE task (only if no offers have been accepted)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own tasks.' });
    }

    if (task.status !== 'Pending') {
      return res.status(400).json({
        message: 'Task cannot be deleted once an offer has been accepted.',
      });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// CREATE offer for a task
router.post('/:id/offers', auth, async (req, res, next) => {
  try {
    const { amount, message } = req.body;
    const task = await Task.findById(req.params.id).populate('creator');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'Pending') {
      return res.status(400).json({ message: 'Task is not open for new offers.' });
    }

    const offer = await Offer.create({
      task: task._id,
      worker: req.user._id,
      amount,
      message,
    });

    await Notification.create({
      user: task.creator._id,
      type: 'NewTaskOffer',
      message: `New offer on your task: ${task.description}`,
      meta: { taskId: task._id, offerId: offer._id },
    });

    res.status(201).json(offer);
  } catch (err) {
    next(err);
  }
});

// Get offers for a given task (creator only)
router.get('/:id/offers', auth, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only view offers on your own tasks.' });
    }

    const offers = await Offer.find({ task: task._id })
      .sort({ createdAt: -1 })
      .populate('worker', 'name trustScore');

    res.json(offers);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth, deleteTask);

// UPDATE TASK STATUS
router.put('/status/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can update this task (for now, allow anyone, but in real app might restrict)
    const { status } = req.body;

    // Map frontend status to backend status
    const statusMapping = {
      'Pending': 'Pending',
      'In Progress': 'In Progress',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };

    const backendStatus = statusMapping[status] || status;
    if (!TASK_STATUSES.includes(backendStatus)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    task.status = backendStatus;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Status update failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT offer for a task -> move task to Assigned and create transaction
router.post('/:taskId/offers/:offerId/accept', auth, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only accept offers on your own tasks.' });
    }

    if (task.status !== 'Pending') {
      return res.status(400).json({ message: 'Task is not open.' });
    }

    const offer = await Offer.findOne({
      _id: req.params.offerId,
      task: task._id,
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found for this task.' });
    }

    offer.status = 'accepted';
    await offer.save();

    task.status = 'In Progress';
    await task.save();

    const transaction = await Transaction.create({
      type: 'task',
      task: task._id,
      offer: offer._id,
      owner: task.creator,
      counterparty: offer.worker,
      status: 'InProgress',
    });

    res.json({ task, offer, transaction });
  } catch (err) {
    next(err);
  }
});

// 🔹 Get single task
router.get('/:id', getTaskById);

// 🔹 Accept task
router.patch('/:id/accept', auth, acceptTask);

// 🔹 Update task status
router.put('/status/:id', auth, updateStatus);


module.exports = router;

