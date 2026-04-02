const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});
const upload = multer({ storage: storage });

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
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }
    next(err);
  }
});

// GET /api/users/profile
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Determine rank based on points
    let rank = 'Bronze';
    if (user.loyaltyPoints >= 500) rank = 'Gold';
    else if (user.loyaltyPoints >= 200) rank = 'Silver';
    
    res.json({ ...user.toObject(), rank });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    
    // Build update object based on what's provided
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let rank = 'Bronze';
    if (user.loyaltyPoints >= 500) rank = 'Gold';
    else if (user.loyaltyPoints >= 200) rank = 'Silver';
    
    res.json({ ...user.toObject(), rank });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/profile/image (Upload profile picture)
router.post('/profile/image', auth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user._id, { profileImage: imageUrl });
    
    res.json({ message: 'Profile image updated successfully', profileImage: imageUrl });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/loyalty (Update loyalty points)
router.post('/loyalty', auth, async (req, res, next) => {
  try {
    const { action, points } = req.body;
    if (!action || typeof points !== 'number') return res.status(400).json({ message: 'Action and points required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newPoints = (user.loyaltyPoints || 0) + points;
    user.loyaltyPoints = newPoints;
    user.pointsHistory.push({ action, points, date: new Date() });
    await user.save();

    await Notification.create({
      user: user._id,
      message: `You earned ${points} loyalty points for: ${action}!`,
      type: 'reward'
    });
    
    let rank = 'Bronze';
    if (newPoints >= 500) rank = 'Gold';
    else if (newPoints >= 200) rank = 'Silver';

    res.json({ message: 'Points added', loyaltyPoints: user.loyaltyPoints, rank });
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

