const express = require('express');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const { sendSMS } = require('../utils/smsService');

const router = express.Router();

// CREATE feedback (no auth required for submission)
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, feedback, rating, itemId } = req.body;

    // Validate required fields (rating is now optional)
    if (!name || !email || !phone || !feedback) {
      return res.status(400).json({ message: 'Name, email, phone, and feedback are required' });
    }

    const newFeedback = await Feedback.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      feedback: feedback.trim(),
      rating: rating ? Number(rating) : undefined,
      user: req.user ? req.user._id : null,
      item: itemId || null,
    });

    // Send SMS notification to the user
    const ratingText = rating ? `\n\nYour rating: ${rating}/5 stars` : '';
    const smsMessage = `Thank you for your feedback, ${name}!${ratingText}\nFeedback: ${feedback}\n\nWe appreciate your input!`;
    const userSmsResult = await sendSMS(phone, smsMessage);
    if (!userSmsResult.success) {
      console.warn('Failed to send SMS to user:', userSmsResult.error);
    }

    // Also send notification to admin
    const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;
    if (adminPhoneNumber) {
      const ratingInfo = rating ? `\nRating: ${rating}/5` : '';
      const adminMessage = `New feedback received!\nName: ${name}\nPhone: ${phone}\nEmail: ${email}${ratingInfo}\nFeedback: ${feedback.substring(0, 100)}${feedback.length > 100 ? '...' : ''}`;
      const adminSmsResult = await sendSMS(adminPhoneNumber, adminMessage);
      if (!adminSmsResult.success) {
        console.warn('Failed to send SMS to admin:', adminSmsResult.error);
      }
    }

    res.status(201).json(newFeedback);
  } catch (err) {
    console.error('Feedback creation error:', err.message);
    next(err);
  }
});

// LIST all feedback (for admin view)
router.get('/', auth, async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).populate('user', 'name');
    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
});

// GET feedback for a specific item
router.get('/item/:itemId', async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ item: req.params.itemId }).sort({ createdAt: -1 }).populate('user', 'name');
    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
});

// UPDATE feedback
router.put('/:id', auth, async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const { name, email, feedback: feedbackText, rating } = req.body;

    feedback.name = name || feedback.name;
    feedback.email = email || feedback.email;
    feedback.feedback = feedbackText || feedback.feedback;
    feedback.rating = rating || feedback.rating;

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    next(err);
  }
});

// DELETE feedback
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;