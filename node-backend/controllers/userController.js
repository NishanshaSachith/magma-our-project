const bcrypt = require('bcryptjs');
const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('-password');
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ message: 'Access denied. Only administrators can create users.' });
    }
    const { fullname, username, email, password, idnumber, phoneno, role, type } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }, { idnumber }] });
    if (existingUser) {
      return res.status(422).json({ message: 'User with this email, username, or ID number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
      idnumber,
      phoneno,
      role,
      type,
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ message: 'Access denied. Only administrators can delete users.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ message: 'Access denied. Only administrators can update user roles.' });
    }
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ message: 'Access denied. Only administrators can update user passwords.' });
    }
    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getUsers, getTechnicians, createUser, deleteUser, updateRole, updatePassword };
