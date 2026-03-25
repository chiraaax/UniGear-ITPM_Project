const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
    },
    category: {
      type: String,
      enum: ['Errands', 'Technical', 'Design'],
      default: 'Errands',
    },
    status: {
      type: String,
      enum: ['pending', 'inprogress', 'completed'],
      default: 'pending',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);