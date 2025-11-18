const Area = require('../models/Area');

const getAreas = async (req, res) => {
  try {
    const areas = await Area.find().populate('branches');
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createArea = async (req, res) => {
  try {
    const { name } = req.body;

    const existingArea = await Area.findOne({ name });
    if (existingArea) {
      return res.status(422).json({ message: 'Area name must be unique' });
    }

    const area = new Area({ name });
    await area.save();
    res.status(201).json(area);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id).populate('branches');
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }
    res.json(area);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateArea = async (req, res) => {
  try {
    const { name } = req.body;

    const existingArea = await Area.findOne({ name, _id: { $ne: req.params.id } });
    if (existingArea) {
      return res.status(422).json({ message: 'Area name must be unique' });
    }

    const area = await Area.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }
    res.json(area);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteArea = async (req, res) => {
  try {
    const area = await Area.findByIdAndDelete(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAreas, createArea, getArea, updateArea, deleteArea };
