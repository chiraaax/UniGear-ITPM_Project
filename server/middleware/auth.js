const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_unigear_secret';

// Auth middleware using JWT (with backwards-compatible x-user-id support for development).
module.exports = async function auth(req, res, next) {
  try {
    let userId = null;

    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        userId = payload.userId;
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
      }
    } else {
      // Fallback for old development header
      const headerUserId = req.header('x-user-id');
      if (headerUserId) {
        userId = headerUserId;
      }
    }

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid user.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

