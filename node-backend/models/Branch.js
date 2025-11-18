const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone_no: { type: String },
  customer_area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerArea', required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Branch', branchSchema);
