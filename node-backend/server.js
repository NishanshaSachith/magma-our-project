const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// ... other imports ...
const path = require('path');

dotenv.config();

const app = express();

// Middleware
// ... app.use(cors()), app.use(express.json()), etc. ...
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
// ... mongoose.connect logic ...
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/magmaapp')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// --- START: CORRECTED REACT SERVING LOGIC ---

// 1. Serve the static files from the built React app
// This middleware must come AFTER all API routes (`/api`)
// but BEFORE the catch-all route.
app.use(express.static(path.join(__dirname, "../react-frontend/dist")));

// 2. Catch-all route: For any request not handled by the API or static files,
// send the React app's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../react-frontend/dist/index.html"));
});

// --- END: CORRECTED REACT SERVING LOGIC ---


// Error handling middleware (Keep this before app.listen)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
