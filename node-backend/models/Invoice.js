const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  quotation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  invoice_no: { type: String },
  vat_no: { type: String },
  invoice_date: { type: Date },
  due_date: { type: Date },
  total_amount: { type: Number },
  paid_amount: { type: Number },
  status: { type: String },
  notes: { type: String },
  special_note: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
