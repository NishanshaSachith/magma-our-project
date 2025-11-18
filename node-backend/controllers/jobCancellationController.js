const JobCancellation = require('../models/JobCancellation');
const JobHome = require('../models/JobHome');
const JobCard = require('../models/JobCard');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');

const createJobCancellation = async (req, res) => {
  try {
    const { job_home_id, reason, description } = req.body;

    const existing = await JobCancellation.findOne({ job_home_id });
    if (existing) {
      return res.status(409).json({ message: 'Job is already cancelled', cancellation: existing });
    }

    const cancellation = new JobCancellation({ job_home_id, reason, description });
    await cancellation.save();

    // Update job status
    await JobHome.findByIdAndUpdate(job_home_id, { job_status: 'Cancel' });

    // Cancel associated documents
    await cancelAssociatedDocuments(job_home_id);

    const populated = await JobCancellation.findById(cancellation._id).populate('jobHome');
    res.status(201).json({ message: 'Job cancelled successfully', cancellation: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getJobCancellation = async (req, res) => {
  try {
    const cancellation = await JobCancellation.findOne({ job_home_id: req.params.jobHomeId }).populate('jobHome');
    if (!cancellation) {
      return res.status(404).json({ message: 'No cancellation found for this job' });
    }
    res.json(cancellation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const cancelAssociatedDocuments = async (jobHomeId) => {
  try {
    const jobCards = await JobCard.find({ job_home_id: jobHomeId });

    for (const jobCard of jobCards) {
      const quotations = await Quotation.find({ job_card_id: jobCard._id });
      for (const quotation of quotations) {
        await Quotation.findByIdAndUpdate(quotation._id, { cancelled_at: new Date() });

        const invoices = await Invoice.find({ quotation_id: quotation._id });
        for (const invoice of invoices) {
          await Invoice.findByIdAndUpdate(invoice._id, { status: 'cancelled', cancelled_at: new Date() });
        }
      }
    }
  } catch (error) {
    console.error('Error cancelling associated documents:', error);
  }
};

module.exports = { createJobCancellation, getJobCancellation };
