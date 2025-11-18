const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/magmaapp')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the React build
app.use(express.static(path.join(__dirname, "../react-frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../react-frontend/dist/index.html"));
});
