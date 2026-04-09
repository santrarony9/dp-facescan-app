const express = require('express');
const router = express.Router();
const { faceQueue } = require('../config/redis');
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');
const { selfieLimiter } = require('../middleware/rateLimiter');

// POST /api/selfie/process
router.post('/process', auth, selfieLimiter, async (req, res) => {
  const { imageUrl, eventId, slug } = req.body;
  const userId = req.user.id;

  try {
    const query = eventId ? { _id: eventId } : { slug: slug };
    const event = await Event.findOne(query);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Push job to Redis queue
    await faceQueue.add('face-processing', {
      imageUrl,
      userId,
      eventId: event.id || event._id,
      largeFaceListId: event.largeFaceListId
    });

    res.json({ status: 'processing', message: 'Face matching started' });
  } catch (error) {
    res.status(500).json({ message: 'Error starting processing' });
  }
});

module.exports = router;
