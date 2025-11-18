const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  job_card_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard', required: true },
  attention: { type: String },
  quotation_no: { type: String },
  select_date: { type: Date },
  region: { type: String },
  ref_qtn: { type: String },
  site: { type: String },
  job_date: { type: Date },
  fam_no: { type: String },
  complain_nature: { type: String },
  po_no: { type: String },
  po_date: { type: Date },
  actual_break_down: { type: String },
  tender_no: { type: String },
  signed_date: { type: Date },
  total_without_tax: { type: Number },
  vat: { type: Number },
  total_with_tax: { type: Number },
  discount: { type: Number },
  total_with_tax_vs_disc: { type: Number },
  special_note: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quotation', quotationSchema);
