const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  job_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobItem' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  is_read: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
