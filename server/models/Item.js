const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    photos: [{ type: String }],
    category: {
      type: String,
      enum: ['Electronics', 'Lab Gear', 'Sports', 'Other'],
      required: true,
    },
    dailyRate: { type: Number, required: true, min: 0 },
    blockedDates: [{ type: Date }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);

