const mongoose = require('mongoose');

const jobHomeSchema = new mongoose.Schema({
  job_no: { type: String, required: true },
  job_type: { type: String },
  job_status: { type: String },
  service_start: { type: Boolean, default: false },
  service_end: { type: Boolean, default: false },
  customer_ok: { type: Boolean, default: false },
  special_approve: { type: Boolean, default: false },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobHome', jobHomeSchema);
