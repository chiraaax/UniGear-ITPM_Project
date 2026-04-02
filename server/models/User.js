const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    studentIdNumber: { type: String },
    studentIdProofUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 3.0, min: 0, max: 5 },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    isSuspended: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    profileImage: { type: String, default: '' },
    loyaltyPoints: { type: Number, default: 0 },
    pointsHistory: [
      {
        action: { type: String, required: true },
        points: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

