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
    status: {
      type: String,
      enum: ['available', 'booked'],
      default: 'available',
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderationNote: { type: String, maxlength: 300 },
    moderationReasonCode: {
      type: String,
      enum: [
        'unsafe_content',
        'spam',
        'duplicate',
        'pricing_abuse',
        'missing_information',
        'other',
      ],
      default: null,
    },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);

