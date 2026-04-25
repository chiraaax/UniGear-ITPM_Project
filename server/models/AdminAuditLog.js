const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    // Keep this flexible because admin actions now include disputes/settings/etc.
    targetType: { type: String, required: true, trim: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: false },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
