const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  description_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Description', required: true },
  image_path: { type: String },
  original_name: { type: String },
  file_size: { type: Number },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Image', imageSchema);
