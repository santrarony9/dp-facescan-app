const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const azureFace = require('../config/azure');
const auth = require('../middleware/auth');

// POST /api/admin/events (Admin Only - simplified)
router.post('/events', auth, async (req, res) => {
  const { name, slug, bannerUrl } = req.body;
  
  try {
    // 1. Create Azure PersonGroup
    const personGroupId = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await azureFace.put(`/face/v1.0/persongroups/${personGroupId}`, {
      name: name,
      userData: 'Created for event: ' + name,
      recognitionModel: 'recognition_04'
    });

    const newEvent = new Event({
      name,
      slug,
      bannerUrl,
      personGroupId
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Event Creation Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
});

// POST /api/admin/photos/bulk
router.post('/photos/bulk', auth, async (req, res) => {
  const { eventId, images } = req.body; // images = array of strings (urls)
  
  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const photoPromises = images.map(async (url) => {
      // 1. Detect faces in event photo
      const detectRes = await azureFace.post('/face/v1.0/detect?returnFaceId=true', { url });
      const faceIds = detectRes.data.map(f => f.faceId);

      const photo = new Photo({
        eventId,
        imageUrl: url,
        faceIds
      });
      return photo.save();
    });

    const savedPhotos = await Promise.all(photoPromises);
    res.json({ message: `${savedPhotos.length} photos uploaded and processed`, photos: savedPhotos });
  } catch (error) {
    res.status(500).json({ message: 'Error processing bulk photos', error: error.message });
  }
});

// GET /api/admin/events
router.get('/events', auth, async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

module.exports = router;
