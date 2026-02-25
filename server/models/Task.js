const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true, min: 0 },
    deadline: { type: Date, required: true },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'Completed', 'Cancelled'],
      default: 'Open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);

