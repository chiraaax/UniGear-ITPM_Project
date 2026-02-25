const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// Basic signup endpoint stub (no password hashing for brevity)
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, studentIdNumber, studentIdProofUrl } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      studentIdNumber,
      studentIdProofUrl,
      isVerified: !!studentIdProofUrl,
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// Get current user profile, including trust score
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Simple endpoint to update trust score (e.g., after ratings aggregation)
router.patch('/:id/trust-score', async (req, res, next) => {
  try {
    const { trustScore } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { trustScore },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Fetch notifications for a user
router.get('/me/notifications', auth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

