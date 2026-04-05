const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const auth = require('../middleware/auth');

// GET /api/gallery/:eventId
router.get('/:eventId', auth, async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    const gallery = await Gallery.findOne({ userId, eventId }).populate('photoIds');
    if (!gallery) {
        return res.json({ photos: [], status: 'no_photos' });
    }
    res.json({ photos: gallery.photoIds, status: 'ready' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery' });
  }
});

module.exports = router;
