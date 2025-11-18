const JobHome = require('../models/JobHome');
const JobHomeTechnician = require('../models/JobHomeTechnician');
const JobCancellation = require('../models/JobCancellation');

const createJobHome = async (req, res) => {
  try {
    const { job_type, customer_id, job_status } = req.body;

    const prefix = job_type.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();

    const lastJob = await JobHome.findOne({ job_no: new RegExp(`^${prefix}`) }).sort({ _id: -1 });
    let nextNumber = 1;
    if (lastJob) {
      const lastNumber = parseInt(lastJob.job_no.substring(prefix.length));
      nextNumber = lastNumber + 1;
    }

    const jobNo = prefix + nextNumber.toString().padStart(5, '0');
    const status = job_status || 'Pending';

    const jobHome = new JobHome({
      job_no: jobNo,
      job_type,
      customer_id,
      job_status: status,
    });

    await jobHome.save();

    res.json({
      job_home: jobHome,
      job_card: null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateJobHome = async (req, res) => {
  try {
    const jobHome = await JobHome.findById(req.params.id)
      .populate('payments')
      .populate({
        path: 'quotation',
        populate: { path: 'invoice' }
      });

    if (!jobHome) {
      return res.status(404).json({ message: 'Job home not found' });
    }

    if (['cancel', 'final'].includes(jobHome.job_status?.toLowerCase())) {
      return res.status(403).json({ message: 'Cannot modify a cancelled or final job.' });
    }

    const updates = {};
    const allowedFields = ['service_start', 'service_end', 'customer_ok', 'special_approve', 'customer_id'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await JobHome.findByIdAndUpdate(req.params.id, updates);

    if (jobHome.job_status !== 'cancel') {
      const payments = jobHome.payments || [];
      const first_payment_success = payments.length > 0 && payments.reduce((sum, p) => sum + p.payment_amount, 0) > 0;
      const invoice = jobHome.quotation?.invoice;
      const full_payment_success = invoice ? payments.reduce((sum, p) => sum + p.payment_amount, 0) >= invoice.total_amount : false;

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

      await JobHome.findByIdAndUpdate(req.params.id, { job_status: newStatus });
    }

    const updatedJobHome = await JobHome.findById(req.params.id);
    res.json(updatedJobHome);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getJobHome = async (req, res) => {
  try {
    const jobHome = await JobHome.findById(req.params.id)
      .populate('jobCard')
      .populate('payments')
      .populate({
        path: 'quotation',
        populate: { path: 'invoice' }
      });

    if (!jobHome) {
      return res.status(404).json({ message: 'Job home not found' });
    }

    let cancellation = null;
    if (jobHome.job_status?.toLowerCase() === 'cancel') {
      cancellation = await JobCancellation.findOne({ job_home_id: req.params.id });
    }

    res.json({
      job_home: jobHome,
      job_card: jobHome.jobCard,
      payments: jobHome.payments,
      invoice: jobHome.quotation?.invoice,
      cancellation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getJobHomes = async (req, res) => {
  try {
    let query = JobHome.find()
      .populate('jobCard')
      .populate('payments')
      .populate({
        path: 'quotation',
        populate: { path: 'invoice' }
      });

    // Filter for technicians
    if (req.user && req.user.role?.toLowerCase() === 'technician') {
      const assignedIds = await JobHomeTechnician.find({ user_id: req.user.id }).distinct('jobhome_id');
      query = query.where('_id').in(assignedIds);
    }

    const jobHomes = await query;

    // Add cancellation data
    for (const jobHome of jobHomes) {
      if (jobHome.job_status?.toLowerCase() === 'cancel') {
        jobHome.cancellation = await JobCancellation.findOne({ job_home_id: jobHome._id });
      }
    }

    res.json(jobHomes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createJobHome, updateJobHome, getJobHome, getJobHomes };
