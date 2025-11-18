const JobHomeTechnician = require('../models/JobHomeTechnician');

const getJobHomeTechnicians = async (req, res) => {
  try {
    const technicians = await JobHomeTechnician.find();
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignTechnicians = async (req, res) => {
  try {
    const { technicians } = req.body;
    const jobhomeId = req.params.jobhomeId;

    for (const tech of technicians) {
      const existing = await JobHomeTechnician.findOne({
        jobhome_id: jobhomeId,
        user_id: tech.user_id,
      });

      if (!existing) {
        const assignment = new JobHomeTechnician({
          jobhome_id: jobhomeId,
          user_id: tech.user_id,
          technician_name: tech.technician_name,
          assign_date: tech.assign_date,
          state: 'new',
        });
        await assignment.save();
      }
    }

    res.json({ status: 'success', message: 'Technicians assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAssignedTechnicians = async (req, res) => {
  try {
    const assigned = await JobHomeTechnician.find({ jobhome_id: req.params.jobhomeId });
    res.json(assigned);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteTechnician = async (req, res) => {
  try {
    const assignment = await JobHomeTechnician.findOneAndDelete({
      jobhome_id: req.params.jobhomeId,
      _id: req.params.technicianId,
    });

    if (!assignment) {
      return res.status(404).json({ status: 'error', message: 'Technician assignment not found' });
    }

    res.json({ status: 'success', message: 'Technician assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStates = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const states = await JobHomeTechnician.find({ user_id: req.user.id }).select('state jobhome_id');
    const result = {};
    states.forEach(state => {
      result[state.jobhome_id] = state.state;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateState = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { state } = req.body;
    if (!['new', 'opened'].includes(state)) {
      return res.status(400).json({ error: 'Invalid state' });
    }

    const assignment = await JobHomeTechnician.findOneAndUpdate(
      { jobhome_id: req.params.jobhomeId, user_id: req.user.id },
      { state },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getJobHomeTechnicians,
  assignTechnicians,
  getAssignedTechnicians,
  deleteTechnician,
  getStates,
  updateState,
};
