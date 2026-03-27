const Task = require('../models/Task');

// ================= GET ALL TASKS WITH FILTER =================
exports.getTasks = async (req, res) => {
  try {
    let filter = {};

    // SEARCH (description)
    if (req.query.search) {
      filter.description = {
        $regex: req.query.search,
        $options: 'i', // case-insensitive
      };
    }

    // CATEGORY FILTER
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // STATUS FILTER
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= CREATE =================
exports.createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= UPDATE =================
// UPDATE TASK
exports.updateTask = async (req, res) => {
  try {
    const { description, category, budget, deadline, location } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        description,
        category,
        budget,
        deadline,
        location,
      },
      {
        new: true,
        runValidators: true, // ✅ VERY IMPORTANT
      }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// ================= DELETE =================
exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};