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

// Create/Update Profile API
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name, phone, address, profileImage } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update loyalty points API (internal or specific actions)
router.patch('/loyalty-points', auth, async (req, res, next) => {
  try {
    const { points } = req.body;
    if (typeof points !== 'number') {
      return res.status(400).json({ message: 'Points must be a number' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.loyaltyPoints += points;
    await user.save();
    
    // Add logic for notifications if needed here
    
    res.json({ loyaltyPoints: user.loyaltyPoints });
  } catch (err) {
    next(err);
  }
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

