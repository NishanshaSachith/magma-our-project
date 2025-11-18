const mongoose = require('mongoose');

const jobItemSchema = new mongoose.Schema({
  job_home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobHome', required: true },
  materials_no: { type: String },
  materials: { type: String },
  quantity: { type: Number },
  unit_price: { type: Number },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobItem', jobItemSchema);
