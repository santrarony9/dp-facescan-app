const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin || 
      origin.includes('dreamlineproduction.com') || 
      origin.includes('vercel.app') || 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback allow in dev
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Public Health Check
app.get('/', (req, res) => res.json({ message: 'Dreamline API is Live 🚀', version: '1.0.0' }));


// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/selfie', require('./src/routes/selfie'));
app.use('/api/gallery', require('./src/routes/gallery'));
app.use('/api/photos', require('./src/routes/photo'));
app.use('/api/payment', require('./src/routes/payment'));

// Workers (Starting background processes)
require('./src/workers/faceWorker');
require('./src/workers/detectionWorker');

// Global Error Handler — prevents unhandled errors from crashing the server
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err.stack || err.message || err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// DB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
