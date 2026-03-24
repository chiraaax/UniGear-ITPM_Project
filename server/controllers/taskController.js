const Task = require("../models/Task");

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = {};

    // Search filter - search in description
    if (search) {
      query.description = { $regex: search, $options: 'i' }; // case-insensitive search
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Status filter - map frontend values to backend enum values
    if (status && status !== 'All') {
      const statusMapping = {
        'pending': 'Open',
        'inprogress': 'Assigned',
        'completed': 'Completed'
      };
      query.status = statusMapping[status] || status;
    }

    const tasks = await Task.find(query).populate('creator', 'name trustScore');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new task
exports.createTask = async (req, res) => {
  try {
    const { description, category, budget, deadline, location } = req.body;
    const creator = req.user?._id; // Get user ID from authenticated request
    
    if (!creator) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const task = new Task({ 
      creator,
      description, 
      category,
      budget,
      deadline,
      location
    });
    await task.save();
    // Populate creator data before responding
    await task.populate('creator', 'name trustScore');
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