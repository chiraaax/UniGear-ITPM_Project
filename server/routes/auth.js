const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_unigear_secret';
const JWT_EXPIRES_IN = '7d';
const AdminAuditLog = require('../models/AdminAuditLog');
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, studentIdNumber, studentIdProofUrl } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      studentIdNumber,
      studentIdProofUrl,
      isVerified: !!studentIdProofUrl,
      role: ADMIN_EMAILS.includes(normalizedEmail) ? 'admin' : 'student',
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ message: 'This account is suspended. Contact support.' });
    }

    if (ADMIN_EMAILS.includes(normalizedEmail) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    if (user.role === 'admin') {
      await AdminAuditLog.create({
        admin: user._id,
        action: 'admin_login',
        targetType: 'user',
        targetId: user._id,
        details: {},
      });
    }

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

