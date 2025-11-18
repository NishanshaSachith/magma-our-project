const Quotation = require('../models/Quotation');
const JobItem = require('../models/JobItem');

const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find();
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createQuotation = async (req, res) => {
  try {
    const data = req.body;

    const existing = await Quotation.findOne({ job_card_id: data.job_card_id });
    if (existing) {
      return res.json({ message: 'Quotation already exists.', quotation: existing });
    }

    const quotation = new Quotation(data);
    await quotation.save();
    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getItemsByJobCard = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ job_card_id: req.params.jobCardId })
      .populate({
        path: 'jobCard',
        populate: {
          path: 'jobHome',
          populate: { path: 'jobItems' }
        }
      });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found for this Job Card.' });
    }

    const jobItems = quotation.jobCard?.jobHome?.jobItems || [];
    const items = jobItems.map(item => ({
      id: item._id,
      materialsNo: item.materials_no,
      description: item.materials,
      unitPrice: parseFloat(item.unit_price),
      quantity: parseInt(item.quantity),
      unitTotalPrice: parseFloat((item.unit_price * item.quantity).toFixed(2)),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.unitTotalPrice, 0);
    const tax = subtotal * 0.10;
    const grandTotal = subtotal + tax;

    res.json({
      id: quotation._id,
      job_card_id: quotation.job_card_id,
      attention: quotation.attention,
      quotation_no: quotation.quotation_no,
      select_date: quotation.select_date,
      region: quotation.region,
      ref_qtn: quotation.ref_qtn,
      site: quotation.site,
      job_date: quotation.job_date,
      fam_no: quotation.fam_no,
      complain_nature: quotation.complain_nature,
      po_no: quotation.po_no,
      po_date: quotation.po_date,
      actual_break_down: quotation.actual_break_down,
      tender_no: quotation.tender_no,
      signed_date: quotation.signed_date,
      total_without_tax: quotation.total_without_tax,
      vat: quotation.vat,
      total_with_tax: quotation.total_with_tax,
      discount: quotation.discount,
      total_with_tax_vs_disc: quotation.total_with_tax_vs_disc,
      special_note: quotation.special_note,
      customer_name: quotation.jobCard?.customer_name || null,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.quotationId)
      .populate({
        path: 'jobCard',
        populate: {
          path: 'jobHome',
          populate: { path: 'jobItems' }
        }
      });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found.' });
    }

    const jobItems = quotation.jobCard?.jobHome?.jobItems || [];
    const items = jobItems.map(item => ({
      id: item._id,
      materialsNo: item.materials_no,
      description: item.materials,
      unitPrice: parseFloat(item.unit_price),
      quantity: parseInt(item.quantity),
      unitTotalPrice: parseFloat((item.unit_price * item.quantity).toFixed(2)),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.unitTotalPrice, 0);
    const tax = subtotal * 0.10;
    const grandTotal = subtotal + tax;

    res.json({
      id: quotation._id,
      job_card_id: quotation.job_card_id,
      attention: quotation.attention,
      quotation_no: quotation.quotation_no,
      select_date: quotation.select_date,
      region: quotation.region,
      ref_qtn: quotation.ref_qtn,
      site: quotation.site,
      job_date: quotation.job_date,
      fam_no: quotation.fam_no,
      complain_nature: quotation.complain_nature,
      po_no: quotation.po_no,
      po_date: quotation.po_date,
      actual_break_down: quotation.actual_break_down,
      tender_no: quotation.tender_no,
      signed_date: quotation.signed_date,
      total_without_tax: quotation.total_without_tax,
      vat: quotation.vat,
      total_with_tax: quotation.total_with_tax,
      discount: quotation.discount,
      total_with_tax_vs_disc: quotation.total_with_tax_vs_disc,
      special_note: quotation.special_note,
      customer_name: quotation.jobCard?.customer_name || null,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePrices = async (req, res) => {
  try {
    const { items } = req.body;
    const quotation = await Quotation.findOne({ job_card_id: req.params.jobCardId })
      .populate({
        path: 'jobCard',
        populate: {
          path: 'jobHome',
          populate: { path: 'jobItems' }
        }
      });

    if (!quotation || !quotation.jobCard?.jobHome) {
      return res.status(404).json({ message: 'Quotation or associated Job Home not found.' });
    }

    const jobHome = quotation.jobCard.jobHome;

    for (const itemData of items) {
      await JobItem.findByIdAndUpdate(itemData.id, {
        materials: itemData.description,
        unit_price: itemData.unitPrice,
        quantity: itemData.quantity,
      });
    }

    res.json({ message: 'Items updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTotalByJobHomeId = async (req, res) => {
  try {
    const { job_home_id } = req.query;

    if (!job_home_id) {
      return res.status(400).json({ success: false, message: 'job_home_id is required' });
    }

    const jobHome = await require('../models/JobHome').findById(job_home_id).populate('jobCard');
    if (!jobHome) {
      return res.status(404).json({ success: false, message: 'Job home not found' });
    }

    if (!jobHome.jobCard) {
      return res.status(404).json({ success: false, message: 'Job card not found for this job home' });
    }

    const quotation = await Quotation.findOne({ job_card_id: jobHome.jobCard._id });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found for this job card' });
    }

    let total = quotation.total_with_tax_vs_disc;
    if (total === null || total === undefined) {
      const jobItems = await JobItem.find({ job_home_id: jobHome._id });
      const subtotal = jobItems.reduce((sum, item) => sum + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0);
      const vatPercent = parseFloat(quotation.vat || 0);
      const discountPercent = parseFloat(quotation.discount || 0);
      const tax = subtotal * (vatPercent / 100);
      const discount = subtotal * (discountPercent / 100);
      total = subtotal + tax - discount;
    }

    res.json({
      success: true,
      total_with_tax_vs_disc: parseFloat(total),
      quotation_id: quotation._id,
      job_card_id: jobHome.jobCard._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotation total', error: error.message });
  }
};

module.exports = {
  getQuotations,
  createQuotation,
  getQuotation,
  updateQuotation,
  deleteQuotation,
  getItemsByJobCard,
  getById,
  updatePrices,
  getTotalByJobHomeId,
};
