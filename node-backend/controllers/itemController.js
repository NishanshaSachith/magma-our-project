const Item = require('../models/Item');

const getItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createItem = async (req, res) => {
  try {
    const { itemName, serviceTimeout, icon } = req.body;

    const item = new Item({
      name: itemName,
      service_timeout: serviceTimeout,
      icon,
    });

    await item.save();
    res.status(201).json({ message: 'Item added successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { itemName, serviceTimeout, icon } = req.body;
    const item = await Item.findByIdAndUpdate(req.params.id, {
      name: itemName,
      service_timeout: serviceTimeout,
      icon,
    }, { new: true });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getItems, createItem, updateItem, deleteItem };
