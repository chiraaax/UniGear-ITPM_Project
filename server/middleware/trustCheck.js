// Strict Business Rule #4:
// Global middleware: user with Trust Score < 2.0 is blocked from posting new listings.

module.exports = function requireMinTrustScore(minScore = 2.0) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.trustScore < minScore) {
      return res.status(403).json({
        message: `Your Trust Score is too low (${req.user.trustScore.toFixed(
          1
        )}). You cannot post new listings.`,
      });
    }

    next();
  };
};

