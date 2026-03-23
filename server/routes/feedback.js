const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

// Create feedback
router.post('/', auth, async (req, res) => {
  try {
    const { item, rating, comment } = req.body;
    const feedback = new Feedback({
      user: req.user.id,
      item,
      rating,
      comment,
    });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedback for an item
router.get('/item/:itemId', async (req, res) => {
  try {
    const feedback = await Feedback.find({ item: req.params.itemId }).populate(
      'user',
      'name'
    );
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedback by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.params.userId }).populate(
      'item',
      'name'
    );
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update feedback
router.put('/:id', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if the user owns the feedback
    if (feedback.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    feedback.rating = rating;
    feedback.comment = comment;

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete feedback
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if the user owns the feedback
    if (feedback.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await feedback.remove();
    res.json({ message: 'Feedback removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
