const mongoose = require('mongoose');

const descriptionSchema = new mongoose.Schema({
  job_home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobHome', required: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Description', descriptionSchema);
