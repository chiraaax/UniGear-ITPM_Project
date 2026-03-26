const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, enum: ['rental', 'task', 'user'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
