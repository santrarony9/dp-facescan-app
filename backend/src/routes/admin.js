const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const User = require('../models/User');
const azureFace = require('../config/azure');
const auth = require('../middleware/auth');
const { detectionQueue } = require('../config/redis');

// POST /api/admin/events (Admin Only - simplified)
router.post('/events', auth, async (req, res) => {
  const { name, slug, bannerUrl, eventDate } = req.body;
  
  try {
    // 1. Create Azure LargeFaceList
    const largeFaceListId = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await azureFace.put(`/face/v1.0/largefacelists/${largeFaceListId}`, {
      name: name,
      userData: 'Created for event: ' + name,
      recognitionModel: 'recognition_04'
    });

    const newEvent = new Event({
      name,
      slug,
      bannerUrl,
      eventDate,
      largeFaceListId
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
      // 1. Save Photo with isProcessed: false
      const photo = new Photo({
        eventId,
        imageUrl: url
      });
      const savedPhoto = await photo.save();

      // 2. Queue for detection
      await detectionQueue.add('photo-detection', {
        photoId: savedPhoto._id,
        imageUrl: url,
        eventId: eventId,
        largeFaceListId: event.largeFaceListId
      });

      return savedPhoto;
    });

    const savedPhotos = await Promise.all(photoPromises);

    // 3. Trigger training once for the entire batch
    try {
      await azureFace.post(`/face/v1.0/largefacelists/${event.largeFaceListId}/train`);
    } catch (trainErr) {
      console.log('Auto-train note:', trainErr.response?.data?.error?.message || trainErr.message);
    }

    res.json({ message: `${savedPhotos.length} photos queued for processing`, photos: savedPhotos });
  } catch (error) {
    res.status(500).json({ message: 'Error processing bulk photos', error: error.message });
  }
});

// GET /api/admin/events
router.get('/events', auth, async (req, res) => {
  const events = await Event.find().lean();
  const eventIds = events.map(e => e._id);
  
  const photoCounts = await Photo.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    { $group: { _id: "$eventId", count: { $sum: 1 } } }
  ]);

  const eventsWithCount = events.map(e => {
    const pCount = photoCounts.find(p => p._id.toString() === e._id.toString());
    return { ...e, photoCount: pCount ? pCount.count : 0 };
  });

  res.json(eventsWithCount);
});

// DELETE /api/admin/events/:id
router.delete('/events/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // 1. Delete associated photos in DB
    await Photo.deleteMany({ eventId: event._id });

    // 2. Delete LargeFaceList in Azure
    try {
      await azureFace.delete(`/face/v1.0/largefacelists/${event.largeFaceListId}`);
    } catch (azureErr) {
      console.error('Azure deletion error (non-fatal):', azureErr.response?.data || azureErr.message);
    }

    // 3. Delete event in DB
    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
});

// PUT /api/admin/events/:id (Update Event Details)
router.put('/events/:id', auth, async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
});

// POST /api/admin/events/:id/train (Manual trigger)
router.post('/events/:id/train', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await azureFace.post(`/face/v1.0/largefacelists/${event.largeFaceListId}/train`);
    res.json({ message: 'Training triggered' });
  } catch (error) {
    res.status(500).json({ message: 'Error triggering training', error: error.response?.data || error.message });
  }
});

// GET /api/admin/leads
router.get('/leads', auth, async (req, res) => {
  try {
    const leads = await User.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

module.exports = router;
