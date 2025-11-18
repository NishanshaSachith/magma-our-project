const CompanySetting = require('../models/CompanySetting');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const logoUpload = multer({
  storage: logoStorage,
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

const show = async (req, res) => {
  try {
    const settings = await CompanySetting.findOne();

    if (!settings) {
      return res.json({
        company_name: 'Add Company Name',
        logo_url: null,
        account_name: null,
        account_number: null,
        bank_name: null,
        bank_branch: null,
        head_of_technical_name: null,
        head_of_technical_contact: null,
      });
    }

    const logoUrl = settings.logo ? `/uploads/logos/${settings.logo}` : null;

    res.json({
      company_name: settings.company_name,
      logo_url: logoUrl,
      account_name: settings.account_name,
      account_number: settings.account_number,
      bank_name: settings.bank_name,
      bank_branch: settings.bank_branch,
      head_of_technical_name: settings.head_of_technical_name,
      head_of_technical_contact: settings.head_of_technical_contact,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = new CompanySetting();
    }

    // Update text fields
    settings.company_name = req.body.company_name || settings.company_name;
    settings.account_name = req.body.account_name || settings.account_name;
    settings.account_number = req.body.account_number || settings.account_number;
    settings.bank_name = req.body.bank_name || settings.bank_name;
    settings.bank_branch = req.body.bank_branch || settings.bank_branch;
    settings.head_of_technical_name = req.body.head_of_technical_name || settings.head_of_technical_name;
    settings.head_of_technical_contact = req.body.head_of_technical_contact || settings.head_of_technical_contact;

    // Handle logo upload
    if (req.file) {
      // Delete old logo if exists
      if (settings.logo) {
        const oldLogoPath = path.join(__dirname, '../uploads/logos', settings.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      settings.logo = req.file.filename;
    } else if (req.body.remove_logo === 'true') {
      // Delete existing logo
      if (settings.logo) {
        const logoPath = path.join(__dirname, '../uploads/logos', settings.logo);
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
      }
      settings.logo = null;
    }

    await settings.save();

    const logoUrl = settings.logo ? `/uploads/logos/${settings.logo}` : null;

    res.json({
      message: 'Company settings updated successfully!',
      settings: {
        company_name: settings.company_name,
        logo_url: logoUrl,
        account_name: settings.account_name,
        account_number: settings.account_number,
        bank_name: settings.bank_name,
        bank_branch: settings.bank_branch,
        head_of_technical_name: settings.head_of_technical_name,
        head_of_technical_contact: settings.head_of_technical_contact,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getLogo = async (req, res) => {
  try {
    const settings = await CompanySetting.findById(req.params.id);

    if (!settings || !settings.logo) {
      return res.status(404).json({ message: 'Logo not found' });
    }

    const logoPath = path.join(__dirname, '../uploads/logos', settings.logo);
    if (!fs.existsSync(logoPath)) {
      return res.status(404).json({ message: 'Logo file not found' });
    }

    res.sendFile(logoPath);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  logoUpload,
  show,
  update,
  getLogo
};
