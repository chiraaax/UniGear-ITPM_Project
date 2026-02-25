const express = require('express');
const Item = require('../models/Item');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const requireMinTrustScore = require('../middleware/trustCheck');

const router = express.Router();

// CREATE item listing (subject to TrustScore rule)
router.post('/items', auth, requireMinTrustScore(2.0), async (req, res, next) => {
  try {
    const { title, description, photos, category, dailyRate, blockedDates } = req.body;

    const item = await Item.create({
      owner: req.user._id,
      title,
      description,
      photos,
      category,
      dailyRate,
      blockedDates,
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// GET item listings with optional category filter
router.get('/items', async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) {
      query.category = category;
    }
    const items = await Item.find(query).populate('owner', 'name trustScore');
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get('/items/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name trustScore');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Get items owned by the authenticated user (for dashboard)
router.get('/my-items', auth, async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// Strict Business Rule #1:
// Item cannot be deleted if there is an active future booking for it.
router.delete('/items/:id', auth, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own items.' });
    }

    const now = new Date();
    const activeBooking = await Booking.findOne({
      item: item._id,
      startDate: { $gte: now },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (activeBooking) {
      return res.status(400).json({
        message: 'Cannot delete item with active future bookings.',
      });
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// CREATE booking for an item
router.post('/items/:id/bookings', auth, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    const item = await Item.findById(req.params.id).populate('owner');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const booking = await Booking.create({
      item: item._id,
      borrower: req.user._id,
      startDate,
      endDate,
    });

    const transaction = await Transaction.create({
      type: 'rental',
      item: item._id,
      booking: booking._id,
      owner: item.owner._id,
      counterparty: req.user._id,
      status: 'Pending',
    });

    res.status(201).json({ booking, transaction });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

