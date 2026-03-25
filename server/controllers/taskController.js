const Task = require("../models/Task");

// ================= CREATE TASK =================
exports.createTask = async (req, res) => {
  try {
    const { description, category, budget, deadline, location } = req.body;

    const creator = req.user?._id;

    // 🔥 VALIDATION FIX
    if (!creator) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!category || category.trim() === "") {
      return res.status(400).json({ message: 'Category is required' });
    }

    if (!description || !budget || !deadline || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const task = new Task({
      creator,
      description,
      category: category.trim(), // ✅ CLEAN VALUE
      budget,
      deadline,
      location,
    });

    await task.save();
    await task.populate('creator', 'name trustScore');

    res.status(201).json(task);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE TASK =================
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own tasks.' });
    }

    if (task.status !== 'Open') {
      return res.status(400).json({ message: 'Task cannot be deleted once it is not open.' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete operation failed:', err);
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE TASK STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Map frontend status to backend status
    const statusMapping = {
      'Pending': 'Pending',
      'In Progress': 'In Progress',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };

    const backendStatus = statusMapping[status] || status;
    task.status = backendStatus;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Status update failed:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update task details
// ================= UPDATE TASK =================
exports.updateTask = async (req, res) => {
  try {
    const { description, category, budget, deadline, location } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // 🔒 Ensure only owner can edit
    if (task.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // ✅ UPDATE FIELDS
    task.description = description || task.description;
    task.category = category || task.category;
    task.budget = budget || task.budget;
    task.deadline = deadline || task.deadline;
    task.location = location || task.location;

    await task.save();

    res.json(task);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update task' });
  }
};