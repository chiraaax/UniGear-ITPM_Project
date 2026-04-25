const express = require('express');
const auth = require('../middleware/auth');
const Dispute = require('../models/Dispute');

const router = express.Router();

router.use(auth);

// Get disputes where the logged in user is the reporter
router.get('/mine', async (req, res, next) => {
  try {
    const disputes = await Dispute.find({ reporter: req.user._id })
      .populate('reportedUser', 'name email')
      .populate('messages.sender', 'name')
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    next(err);
  }
});

// Create a new dispute
router.post('/', async (req, res, next) => {
  try {
    const { targetType, targetId, reportedUser, reason } = req.body;
    
    if (!['Rental', 'Task', 'Other'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }
    
    if (!targetId || !reportedUser || !reason) {
      return res.status(400).json({ message: 'Missing required dispute fields' });
    }

    const dispute = await Dispute.create({
      reporter: req.user._id,
      reportedUser,
      targetType,
      targetId,
      reason,
      status: 'pending',
      messages: []
    });

    res.status(201).json(dispute);
  } catch (err) {
    next(err);
  }
});

// Add a message to an existing dispute thread
router.post('/:id/message', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const dispute = await Dispute.findOne({ _id: req.params.id, reporter: req.user._id });
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot add message to a resolved or dismissed dispute' });
    }

    dispute.messages.push({
      sender: req.user._id,
      isAdmin: false,
      content: content.trim()
    });

    await dispute.save();
    
    // Repopulate senders for immediate render
    await dispute.populate('messages.sender', 'name');
    
    res.status(201).json(dispute);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
