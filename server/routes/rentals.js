const express = require('express');
const Item = require('../models/Item');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const requireMinTrustScore = require('../middleware/trustCheck');

const router = express.Router();
const ITEM_CATEGORIES = ['Electronics', 'Lab Gear', 'Sports', 'Other'];

const isNonEmptyString = (value, min, max) =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

// CREATE item listing (subject to TrustScore rule)
router.post('/items', auth, requireMinTrustScore(2.0), async (req, res, next) => {
  try {
    const { title, description, photos, category, dailyRate, blockedDates } = req.body;
    if (!isNonEmptyString(title, 3, 100)) {
      return res.status(400).json({ message: 'Title must be 3-100 characters.' });
    }
    if (description && !isNonEmptyString(description, 3, 500)) {
      return res.status(400).json({ message: 'Description must be 3-500 characters.' });
    }
    if (!ITEM_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category.' });
    }
    if (Number.isNaN(Number(dailyRate)) || Number(dailyRate) < 0) {
      return res.status(400).json({ message: 'Daily rate must be a positive number.' });
    }

    const item = await Item.create({
      owner: req.user._id,
      title: title.trim(),
      description: description?.trim(),
      photos: Array.isArray(photos) ? photos : [],
      category,
      dailyRate: Number(dailyRate),
      blockedDates: Array.isArray(blockedDates) ? blockedDates : [],
      moderationStatus: 'pending',
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
    const query = { isActive: true, moderationStatus: 'approved' };
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
    if (!item.isActive || item.moderationStatus !== 'approved') {
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

// UPDATE item (owner only)
router.patch('/items/:id', auth, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own items.' });
    }

    const updatableFields = ['title', 'description', 'category', 'dailyRate'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });
    if (req.body.title !== undefined && !isNonEmptyString(req.body.title, 3, 100)) {
      return res.status(400).json({ message: 'Title must be 3-100 characters.' });
    }
    if (req.body.description !== undefined && req.body.description && !isNonEmptyString(req.body.description, 3, 500)) {
      return res.status(400).json({ message: 'Description must be 3-500 characters.' });
    }
    if (req.body.category !== undefined && !ITEM_CATEGORIES.includes(req.body.category)) {
      return res.status(400).json({ message: 'Invalid category.' });
    }
    if (req.body.dailyRate !== undefined && (Number.isNaN(Number(req.body.dailyRate)) || Number(req.body.dailyRate) < 0)) {
      return res.status(400).json({ message: 'Daily rate must be a positive number.' });
    }
    if (req.body.dailyRate !== undefined) {
      item.dailyRate = Number(req.body.dailyRate);
    }
    if (req.body.title !== undefined) {
      item.title = req.body.title.trim();
    }
    if (req.body.description !== undefined) {
      item.description = req.body.description?.trim();
    }
    item.moderationStatus = 'pending';
    item.moderationNote = '';
    item.moderatedBy = null;
    item.moderatedAt = null;

    await item.save();
    res.json(item);
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

//Return an item (mark booking as returned and transaction as completed)
router.put('/bookings/:id/return', auth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('item');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.borrower.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'returned';
    booking.returnedAt = new Date();
    await booking.save();

    await Transaction.findOneAndUpdate(
      { booking: booking._id },
      { status: 'completed' }
    );

    await Item.findByIdAndUpdate(
      booking.item._id, 
      { status: 'available' }
    );

    res.json({ message: 'Item returned successfully.' });

  } catch (err) {
    next(err);
  }
});

module.exports = router;

