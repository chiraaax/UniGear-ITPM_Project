const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_unigear_secret";

/**
 * Standard Auth Middleware
 * Requires a valid JWT token in Authorization header or x-user-id in header for dev.
 */
const auth = async function (req, res, next) {
  try {
    let userId = null;

    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        userId = payload.userId;
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
      }
    } else {
      // Fallback for old development header
      const headerUserId = req.header("x-user-id");
      if (headerUserId) {
        userId = headerUserId;
      }
    }

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid user." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional Auth Middleware
 * If valid token/user found, attaches to req.user. 
 * If no valid token found, moves to next() without error.
 */
const optionalAuth = async function (req, res, next) {
  try {
    let userId = null;

    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        userId = payload.userId;
      } catch (err) {
        // Optional auth: move on if token invalid
      }
    } else {
      // Fallback for dev header
      const headerUserId = req.header("x-user-id");
      if (headerUserId) {
        userId = headerUserId;
      }
    }

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (err) {
    // Optional auth silently ignores errors
    next();
  }
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
