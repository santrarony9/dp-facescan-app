const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/selfie', require('./src/routes/selfie'));
app.use('/api/gallery', require('./src/routes/gallery'));
app.use('/api/photos', require('./src/routes/photo'));

// Workers (Starting background processes)
require('./src/workers/faceWorker');
require('./src/workers/detectionWorker');

// DB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
