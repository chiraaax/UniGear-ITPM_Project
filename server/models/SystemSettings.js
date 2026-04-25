const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    maintenanceMode: { type: Boolean, default: false },
    staleItemDays: { type: Number, default: 30 },
    allowedRentalCategories: { 
      type: [String], 
      default: ['Electronics', 'Textbooks', 'Sports Gear', 'Apparel', 'Other'] 
    },
    allowedTaskCategories: { 
      type: [String], 
      default: ['Delivery', 'Tutoring', 'Handyman', 'Photography', 'Other'] 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
