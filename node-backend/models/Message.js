const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  job_home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobHome' },
  phoneno: { type: String },
  person_number: { type: String },
  message: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
