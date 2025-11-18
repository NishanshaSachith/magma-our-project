// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  customerAreas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerArea' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Middleware removed: Cascading delete logic is now handled in the controller
// using explicit deleteOne/deleteMany calls, which is safer and more reliable.

module.exports = mongoose.model('Customer', customerSchema);