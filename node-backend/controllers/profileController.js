const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile image uploads
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (req.body.fullname) user.fullname = req.body.fullname;
    if (req.body.username) user.username = req.body.username;
    if (req.body.email) user.email = req.body.email;
    if (req.body.idnumber) user.idnumber = req.body.idnumber;
    if (req.body.phoneno) user.phoneno = req.body.phoneno;

    // Handle password update
    if (req.body.new_password) {
      user.password = await bcrypt.hash(req.body.new_password, 10);
    }

    // Handle profile image upload
    if (req.file) {
      // Delete old profile image if exists
      if (user.profile_image) {
        const oldImagePath = path.join(__dirname, '../uploads/profiles', user.profile_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      user.profile_image = req.file.filename;
    } else if (req.body.remove_profile_image === '1') {
      // Delete existing profile image
      if (user.profile_image) {
        const imagePath = path.join(__dirname, '../uploads/profiles', user.profile_image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      user.profile_image = null;
    }

    await user.save();

    const profileImageUrl = user.profile_image ? `/uploads/profiles/${user.profile_image}` : null;

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        idnumber: user.idnumber,
        phoneno: user.phoneno,
        profile_image_url: profileImageUrl,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profileImageUrl = user.profile_image ? `/uploads/profiles/${user.profile_image}` : null;

    res.json({
      id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      idnumber: user.idnumber,
      phoneno: user.phoneno,
      profile_image_url: profileImageUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.profile_image) {
      return res.status(404).json({ message: 'Profile image not found' });
    }

    const imagePath = path.join(__dirname, '../uploads/profiles', user.profile_image);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Profile image file not found' });
    }

    res.sendFile(imagePath);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  profileImageUpload,
  updateProfile,
  getProfile,
  getProfileImage
};
