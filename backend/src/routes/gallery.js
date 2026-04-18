const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Gallery = require('../models/Gallery');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// GET /api/gallery/:identifier (identifier can be eventId or slug)
router.get('/:identifier', auth, async (req, res) => {
  const { identifier } = req.params;
  const userId = req.user.id;

  try {
    // Find event first to normalize identifier to eventId
    const event = await Event.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { slug: identifier }
      ]
    });
    
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const gallery = await Gallery.findOne({ userId, eventId: event._id }).populate('photoIds');
    if (!gallery) {
        return res.json({ photos: [], status: 'no_photos' });
    }
    res.json({ photos: gallery.photoIds, status: 'ready' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery' });
  }
});

module.exports = router;
