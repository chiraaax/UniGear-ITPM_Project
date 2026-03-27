// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const TaskRequest = require('../models/TaskRequest');
const Task = require('../models/Task');
const auth = require('../middleware/authMiddleware');


// 🔹 CREATE REQUEST (User clicks Accept)
router.post('/', auth, async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID missing" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const request = new TaskRequest({
      task: taskId,
      requester: req.user.id,
    });

    await request.save();

    res.status(201).json(request);

  } catch (err) {
    console.error("🔥 BACKEND ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;