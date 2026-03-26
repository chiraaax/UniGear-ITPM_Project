const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    description: {
      type: String,
      required: true
    },

    //  FIXED CATEGORY
    category: {
      type: String,
      required: true,
      enum: ['Delivery', 'Cleaning', 'Academic', 'Technical', 'Other'], // MUST match frontend
      trim: true
    },

    budget: {
      type: Number,
      required: true,
      min: 0
    },

    deadline: {
      type: Date,
      required: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending'
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderationNote: {
      type: String,
      maxlength: 300,
    },
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
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);