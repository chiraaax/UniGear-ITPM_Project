const Task = require("../models/Task");

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const task = new Task({ title, description, category });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Accept task
exports.acceptTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.body;
    const task = await Task.findByIdAndUpdate(
      id,
      { assignedTo: user },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update task status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Update status workflow
    if (task.status === "Pending") task.status = "In Progress";
    else if (task.status === "In Progress") task.status = "Completed & Confirmed";

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};