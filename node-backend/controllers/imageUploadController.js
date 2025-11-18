const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Description = require('../models/Description');
const Image = require('../models/Image');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

const getImages = async (req, res) => {
  try {
    const { jobHomeId } = req.params;

    const images = await Image.aggregate([
      {
        $lookup: {
          from: 'descriptions',
          localField: 'description_id',
          foreignField: '_id',
          as: 'description'
        }
      },
      { $unwind: '$description' },
      {
        $match: { 'description.job_home_id': jobHomeId }
      },
      {
        $project: {
          id: '$_id',
          image_path: 1,
          original_name: 1,
          file_size: 1,
          description: '$description.description',
          created_at: 1,
          updated_at: 1
        }
      },
      { $sort: { created_at: -1 } }
    ]);

    res.json({ images });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch images', error: error.message });
  }
};

const index = async (req, res) => {
  try {
    const { job_home_id } = req.query;

    const descriptions = await Description.find({ job_home_id }).populate('images').sort({ created_at: -1 });

    res.json({ data: descriptions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch descriptions', error: error.message });
  }
};

const store = async (req, res) => {
  try {
    const { jobHomeId } = req.params;
    const { description } = req.body;

    // Create description
    const newDescription = new Description({
      job_home_id: jobHomeId,
      description: description || 'No description provided'
    });
    await newDescription.save();

    // Handle image uploads
    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imagePath = `/uploads/images/${file.filename}`;

        const imageRecord = new Image({
          description_id: newDescription._id,
          image_path: imagePath,
          original_name: file.originalname,
          file_size: file.size
        });
        await imageRecord.save();

        uploadedImages.push({
          id: imageRecord._id,
          image_path: imageRecord.image_path,
          original_name: imageRecord.original_name,
          file_size: imageRecord.file_size,
          description: newDescription.description,
          created_at: imageRecord.created_at,
          updated_at: imageRecord.updated_at
        });
      }
    }

    res.status(201).json({
      message: 'Images uploaded successfully',
      description: newDescription,
      images: uploadedImages
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

const destroy = async (req, res) => {
  try {
    const { jobHomeId, imageId } = req.params;

    // Find the image and verify it belongs to the correct job_home
    const image = await Image.findOne({ _id: imageId }).populate('description_id');

    if (!image || image.description_id.job_home_id.toString() !== jobHomeId) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete the file from storage
    const filePath = path.join(__dirname, '..', image.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the database record
    await Image.findByIdAndDelete(imageId);

    // Check if the description has no more images, optionally delete it
    const remainingImages = await Image.countDocuments({ description_id: image.description_id._id });
    if (remainingImages === 0) {
      await Description.findByIdAndDelete(image.description_id._id);
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};

module.exports = {
  upload,
  getImages,
  index,
  store,
  destroy
};
