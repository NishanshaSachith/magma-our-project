const Invoice = require('../models/Invoice');

const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('quotation');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const data = req.body;

    // Check unique invoice_no
    const existing = await Invoice.findOne({ invoice_no: data.invoice_no });
    if (existing) {
      return res.status(422).json({ message: 'Invoice number must be unique' });
    }

    const invoice = new Invoice(data);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('quotation');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const data = req.body;

    // Check unique invoice_no if updating
    if (data.invoice_no) {
      const existing = await Invoice.findOne({ invoice_no: data.invoice_no, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(422).json({ message: 'Invoice number must be unique' });
      }
    }

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateInfo = async (req, res) => {
  try {
    const { quotation_id, ...data } = req.body;

    const invoice = await Invoice.findOne({ quotation_id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this quotation.' });
    }

    await Invoice.findByIdAndUpdate(invoice._id, data);
    const updated = await Invoice.findById(invoice._id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getByQuotationId = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ quotation_id: req.params.quotationId }).populate('quotation');
    res.json(invoice || null);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInfo,
  getByQuotationId,
};
