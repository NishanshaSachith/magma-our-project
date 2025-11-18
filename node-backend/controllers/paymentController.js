const Payment = require('../models/Payment');
const JobHome = require('../models/JobHome');

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createPayment = async (req, res) => {
  try {
    const data = req.body;
    const payment = new Payment(data);
    await payment.save();

    await updateJobStatus(data.jobhomeid);

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const jobhomeid = payment.jobhomeid;
    await Payment.findByIdAndDelete(req.params.id);

    await updateJobStatus(jobhomeid);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getByJobHomeId = async (req, res) => {
  try {
    const payments = await Payment.find({ jobhomeid: req.params.jobhomeid });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateJobStatus = async (jobhomeid) => {
  try {
    const jobHome = await JobHome.findById(jobhomeid)
      .populate('payments')
      .populate({
        path: 'quotation',
        populate: { path: 'invoice' }
      });

    if (!jobHome) return;

    const payments = jobHome.payments || [];
    const first_payment_success = payments.length > 0 && payments.reduce((sum, p) => sum + p.payment_amount, 0) > 0;
    const quotation = jobHome.quotation;
    const invoice = quotation?.invoice;
    const full_payment_success = invoice
      ? payments.reduce((sum, p) => sum + p.payment_amount, 0) >= invoice.total_amount
      : (quotation ? payments.reduce((sum, p) => sum + p.payment_amount, 0) >= (quotation.total_with_tax_vs_disc || 0) : false);

    let newStatus = 'Pending';
    if (jobHome.service_start && jobHome.service_end && full_payment_success && (jobHome.special_approve || first_payment_success)) {
      newStatus = 'complete';
    } else if (jobHome.service_start && jobHome.service_end && (jobHome.special_approve || first_payment_success)) {
      newStatus = 'end';
    } else if (jobHome.service_start && (jobHome.special_approve || first_payment_success)) {
      newStatus = 'inprocess';
    } else if (first_payment_success || jobHome.special_approve) {
      newStatus = 'todo';
    }

    await JobHome.findByIdAndUpdate(jobhomeid, { job_status: newStatus });
  } catch (error) {
    console.error('Error updating job status:', error);
  }
};

module.exports = {
  getPayments,
  createPayment,
  getPayment,
  updatePayment,
  deletePayment,
  getByJobHomeId,
};
