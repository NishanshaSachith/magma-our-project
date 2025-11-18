const mongoose = require('mongoose');

const companySettingSchema = new mongoose.Schema({
  company_name: { type: String },
  logo: { type: String }, // base64 or file path
  logo_mime: { type: String },
  account_name: { type: String },
  account_number: { type: String },
  bank_name: { type: String },
  bank_branch: { type: String },
  head_of_technical_name: { type: String },
  head_of_technical_contact: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CompanySetting', companySettingSchema);
