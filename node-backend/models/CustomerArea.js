// models/CustomerArea.js
const mongoose = require('mongoose');

const customerAreaSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 💡 VIRTUAL: Links CustomerArea to all associated Branches by matching _id to customer_area_id
customerAreaSchema.virtual('branches', {
    ref: 'Branch',
    localField: '_id',         
    foreignField: 'customer_area_id', 
    justOne: false
});

// Enable virtuals for JSON output
customerAreaSchema.set('toObject', { virtuals: true });
customerAreaSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('CustomerArea', customerAreaSchema);