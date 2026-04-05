const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const auth = require('../middleware/auth');
const { detectionQueue } = require('../config/redis');

// POST /api/photos
// Notification from frontend after s3 upload
router.post('/', auth, async (req, res) => {
  const { imageUrl, eventId } = req.body;
  
  if (!imageUrl || !eventId) {
    return res.status(400).json({ message: 'imageUrl and eventId are required' });
  }

  try {
    const photo = new Photo({
      eventId,
      imageUrl,
      faceIds: [] // To be populated by worker
    });

    await photo.save();

    // Add to detection queue
    await detectionQueue.add('photo-detection', {
      photoId: photo._id,
      imageUrl,
      eventId
    });

    res.status(201).json(photo);
  } catch (error) {
    res.status(500).json({ message: 'Error saving photo' });
  }
});

module.exports = router;
