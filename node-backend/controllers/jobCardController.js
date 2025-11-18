const JobCard = require('../models/JobCard');
const JobItem = require('../models/JobItem');
const JobHome = require('../models/JobHome');

const createJobCard = async (req, res) => {
  try {
    const data = req.body;

    // Check if job card already exists
    const existing = await JobCard.findOne({ job_home_id: data.job_home_id });
    if (existing) {
      return res.status(409).json({ message: 'Job card already exists for this job home.', id: existing._id });
    }

    const jobCard = new JobCard(data);
    await jobCard.save();

    // Update customer_id in JobHome
    if (data.customer_id) {
      await JobHome.findByIdAndUpdate(data.job_home_id, { customer_id: data.customer_id });
    }

    // Create job items
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.materials) {
          const jobItem = new JobItem({
            job_home_id: data.job_home_id,
            materials_no: item.materialsNo || '',
            materials: item.materials,
            quantity: item.quantity,
            unit_price: item.unit_price || 0,
          });
          await jobItem.save();
        }
      }
    }

    res.json({ message: 'Job card created successfully.', id: jobCard._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateJobCard = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id).populate('jobHome');
    if (!jobCard) {
      return res.status(404).json({ message: 'Job card not found' });
    }

    // Check job status
    if (jobCard.jobHome && ['cancel', 'final'].includes(jobCard.jobHome.job_status?.toLowerCase())) {
      return res.status(403).json({ message: 'Cannot modify a cancelled or final job.' });
    }

    const data = req.body;
    await JobCard.findByIdAndUpdate(req.params.id, data);

    // Update customer_id in JobHome
    if (data.customer_id) {
      await JobHome.findByIdAndUpdate(jobCard.job_home_id, { customer_id: data.customer_id });
    }

    // Update job items
    if (data.items) {
      const existingItems = await JobItem.find({ job_home_id: jobCard.job_home_id });
      const incomingItems = data.items.map(item => ({
        ...item,
        materials_no: item.materialsNo || '',
      }));

      // Update or create items
      for (const item of incomingItems) {
        if (item.materials) {
          const existing = existingItems.find(ei => ei.materials_no === item.materials_no);
          if (existing) {
            await JobItem.findByIdAndUpdate(existing._id, {
              materials: item.materials,
              quantity: item.quantity,
              unit_price: item.unit_price || 0,
            });
          } else {
            const newItem = new JobItem({
              job_home_id: jobCard.job_home_id,
              materials_no: item.materials_no,
              materials: item.materials,
              quantity: item.quantity,
              unit_price: item.unit_price || 0,
            });
            await newItem.save();
          }
        }
      }

      // Delete items not in incoming
      const incomingNos = incomingItems.map(i => i.materials_no).filter(Boolean);
      for (const existing of existingItems) {
        if (!incomingNos.includes(existing.materials_no)) {
          await JobItem.findByIdAndDelete(existing._id);
        }
      }
    }

    res.json({ message: 'Job card updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getJobCard = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id).populate('jobHome');
    if (!jobCard) {
      return res.status(404).json({ message: 'Job card not found' });
    }

    const items = await JobItem.find({ job_home_id: jobCard.job_home_id });
    jobCard.items = items;

    res.json(jobCard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getItemsForQuotation = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.jobCardId).populate({
      path: 'jobHome',
      populate: { path: 'jobItems' }
    });

    if (!jobCard) {
      return res.status(404).json({ message: 'Job Card not found.' });
    }

    const items = (jobCard.jobHome?.jobItems || []).map(item => ({
      id: item._id,
      materialsNo: item.materials_no,
      description: item.materials,
      unitPrice: 0.0,
      quantity: parseInt(item.quantity),
      unitTotalPrice: 0.0,
    }));

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createJobCard, updateJobCard, getJobCard, getItemsForQuotation };
