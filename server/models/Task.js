const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: "General" },
  status: { type: String, default: "Pending" },
  assignedTo: { type: String, default: null },
});

module.exports = mongoose.model("Task", taskSchema);