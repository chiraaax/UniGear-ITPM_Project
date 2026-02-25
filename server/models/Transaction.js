const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['rental', 'task'],
      required: true,
    },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    counterparty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
      type: String,
      enum: ['Pending', 'InProgress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },

    ownerConfirmed: { type: Boolean, default: false },
    counterpartyConfirmed: { type: Boolean, default: false },

    // Ratings (1-5) given after completion
    ownerRating: { type: Number, min: 1, max: 5 },
    ownerRatingComment: { type: String },
    counterpartyRating: { type: Number, min: 1, max: 5 },
    counterpartyRatingComment: { type: String },

    pickupTime: { type: Date },
    returnTime: { type: Date },
  },
  { timestamps: true }
);

// Strict Business Rule #3:
// transaction status cannot move to 'Completed' until both parties confirm
transactionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const newStatus = update.status;

  if (newStatus === 'Completed') {
    const ownerConfirmed =
      update.ownerConfirmed !== undefined ? update.ownerConfirmed : this._update.$set?.ownerConfirmed;
    const counterpartyConfirmed =
      update.counterpartyConfirmed !== undefined
        ? update.counterpartyConfirmed
        : this._update.$set?.counterpartyConfirmed;

    if (!ownerConfirmed || !counterpartyConfirmed) {
      const err = new Error('Both parties must confirm before completing the transaction.');
      err.status = 400;
      return next(err);
    }
  }

  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);

