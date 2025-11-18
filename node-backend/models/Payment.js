const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  jobhomeid: { type: mongoose.Schema.Types.ObjectId, ref: 'JobHome', required: true },
  payment_amount: { type: Number },
  date: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
