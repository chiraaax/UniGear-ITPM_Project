const express = require('express');
const Rating = require('../models/Rating');
const auth = require('../middleware/auth');

const router = express.Router();

// POST - Submit or update a rating for an item
router.post('/', auth, async (req, res, next) => {
  try {
    const { itemId, rating } = req.body;

    if (!itemId || !rating) {
      return res.status(400).json({ message: 'itemId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find existing rating from this user for this item
    let existingRating = await Rating.findOne({
      user: req.user._id,
      item: itemId,
    });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      await existingRating.save();
      return res.json(existingRating);
    }

    // Create new rating
    const newRating = await Rating.create({
      user: req.user._id,
      item: itemId,
      rating,
    });

    res.status(201).json(newRating);
  } catch (err) {
    console.error('Rating creation error:', err.message);
    next(err);
  }
});

// GET - Get all ratings for a specific item with average
router.get('/item/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const ratings = await Rating.find({ item: itemId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    if (ratings.length === 0) {
      return res.json({
        ratings: [],
        average: 0,
        count: 0,
      });
    }

    const average = (
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    ).toFixed(1);

    res.json({
      ratings,
      average: parseFloat(average),
      count: ratings.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET - Get user's rating for a specific item
router.get('/item/:itemId/user', auth, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const userRating = await Rating.findOne({
      user: req.user._id,
      item: itemId,
    });

    res.json({
      userRating: userRating ? userRating.rating : null,
      hasRated: !!userRating,
    });
  } catch (err) {
    next(err);
  }
});

// PUT - Update a rating
router.put('/:ratingId', auth, async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const userRating = await Rating.findById(ratingId);

    if (!userRating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Check if user owns this rating
    if (userRating.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this rating' });
    }

    userRating.rating = rating;
    await userRating.save();

    res.json(userRating);
  } catch (err) {
    next(err);
  }
});

// DELETE - Remove a rating
router.delete('/:ratingId', auth, async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    const userRating = await Rating.findById(ratingId);

    if (!userRating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Check if user owns this rating
    if (userRating.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this rating' });
    }

    await Rating.findByIdAndDelete(ratingId);

    res.json({ message: 'Rating deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
