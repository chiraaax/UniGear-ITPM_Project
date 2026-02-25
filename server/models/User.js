const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    studentIdNumber: { type: String },
    studentIdProofUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 3.0, min: 0, max: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

