const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// LIST transactions for the authenticated user (Status Tracking Dashboard backend)
router.get('/', auth, async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ owner: req.user._id }, { counterparty: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .populate('item task offer booking');

    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// Helper to recompute and update a user's trustScore from all ratings they've received
async function recomputeTrustScoreForUser(userId) {
  const results = await Transaction.aggregate([
    {
      $match: {
        $or: [{ owner: userId }, { counterparty: userId }],
        status: 'Completed',
      },
    },
    {
      $project: {
        ratings: [
          {
            $cond: [
              { $eq: ['$counterparty', userId] },
              '$ownerRating',
              null,
            ],
          },
          {
            $cond: [
              { $eq: ['$owner', userId] },
              '$counterpartyRating',
              null,
            ],
          },
        ],
      },
    },
    { $unwind: '$ratings' },
    { $match: { ratings: { $ne: null } } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$ratings' },
      },
    },
  ]);

  if (results.length === 0) {
    return;
  }

  const avgRating = results[0].avgRating;
  await User.findByIdAndUpdate(userId, { trustScore: avgRating });
}

// Confirm pickup/return or task completion from a given party
router.post('/:id/confirm', auth, async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const isOwner = transaction.owner.equals(req.user._id);
    const isCounterparty = transaction.counterparty.equals(req.user._id);
    if (!isOwner && !isCounterparty) {
      return res.status(403).json({ message: 'You are not part of this transaction.' });
    }

    if (isOwner) {
      transaction.ownerConfirmed = true;
    } else {
      transaction.counterpartyConfirmed = true;
    }

    const { pickupTime, returnTime } = req.body;
    if (pickupTime) {
      transaction.pickupTime = pickupTime;
    }
    if (returnTime) {
      transaction.returnTime = returnTime;
    }

    await transaction.save();
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

// Update transaction status (Strict Business Rule #3 enforced in model hook)
router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const isOwner = transaction.owner.equals(req.user._id);
    const isCounterparty = transaction.counterparty.equals(req.user._id);
    if (!isOwner && !isCounterparty) {
      return res.status(403).json({ message: 'You are not part of this transaction.' });
    }

    const updated = await Transaction.findOneAndUpdate(
      { _id: transaction._id },
      { status },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Rate the counterparty in a completed transaction
router.post('/:id/rate', auth, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'Completed') {
      return res.status(400).json({ message: 'You can only rate completed transactions.' });
    }

    const isOwner = transaction.owner.equals(req.user._id);
    const isCounterparty = transaction.counterparty.equals(req.user._id);
    if (!isOwner && !isCounterparty) {
      return res.status(403).json({ message: 'You are not part of this transaction.' });
    }

    let ratedUserId;

    if (isOwner) {
      // Owner rates counterparty
      transaction.ownerRating = rating;
      transaction.ownerRatingComment = comment;
      ratedUserId = transaction.counterparty;
    } else {
      // Counterparty rates owner
      transaction.counterpartyRating = rating;
      transaction.counterpartyRatingComment = comment;
      ratedUserId = transaction.owner;
    }

    await transaction.save();

    await recomputeTrustScoreForUser(ratedUserId);

    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

