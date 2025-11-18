const mongoose = require('mongoose');

const jobHomeTechnicianSchema = new mongoose.Schema({
  jobhome_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobHome', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technician_name: { type: String },
  assign_date: { type: Date },
  state: { type: String }, // from migration
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobHomeTechnician', jobHomeTechnicianSchema);
