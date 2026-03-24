const express = require('express');
const Task = require('../models/Task');
const Offer = require('../models/Offer');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const requireMinTrustScore = require('../middleware/trustCheck');

const router = express.Router();

// CREATE task (subject to TrustScore rule)
router.post('/', auth, requireMinTrustScore(2.0), async (req, res, next) => {
  try {
    const { description, budget, deadline, location } = req.body;
    const task = await Task.create({
      creator: req.user._id,
      description,
      budget,
      deadline,
      location,
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// LIST tasks for job board
router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).populate('creator', 'name trustScore');
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

    if (task.status !== 'Open') {
      return res.status(400).json({
        message: 'Task cannot be edited once an offer has been accepted.',
      });
    }

    const updatableFields = ['description', 'budget', 'deadline', 'location'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

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

    if (task.status !== 'Open') {
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

    if (task.status !== 'Open') {
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

    if (task.status !== 'Open') {
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

    task.status = 'Assigned';
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

module.exports = router;

