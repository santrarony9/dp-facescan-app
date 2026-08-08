const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Gallery = require('../models/Gallery');
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const AlbumProof = require('../models/AlbumProof');
const s3 = require('../config/aws');

// Helper: Convert raw S3 URL to a presigned URL (valid for 1 hour)
function getSignedUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    const key = decodeURIComponent(url.pathname.slice(1)); // Remove leading /
    return s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 3600 // 1 hour
    });
  } catch (e) {
    return rawUrl; // Return original if parsing fails
  }
}

// Helper: Sign all photo URLs in an array
function signPhotos(photos) {
  return photos.map(p => {
    const obj = p.toObject ? p.toObject() : { ...p };
    obj.imageUrl = getSignedUrl(obj.imageUrl);
    if (obj.thumbnailUrl) obj.thumbnailUrl = getSignedUrl(obj.thumbnailUrl);
    return obj;
  });
}
// GET /api/gallery/public/events (No Auth Required - Public Album Covers for Landing Page)
router.get('/public/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).lean();
    const eventIds = events.map(e => e._id);

    const photoCounts = await Photo.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } }
    ]);

    const publicEvents = events.map(e => {
      const pCount = photoCounts.find(p => p._id.toString() === e._id.toString());
      return {
        _id: e._id,
        name: e.name,
        slug: e.slug,
        bannerUrl: e.bannerUrl ? getSignedUrl(e.bannerUrl) : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
        eventDate: e.eventDate,
        clientName: e.clientName,
        albumStatus: e.albumStatus,
        photoCount: pCount ? pCount.count : 0
      };
    });

    res.json(publicEvents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public events', error: error.message });
  }
});

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

    let photos = [];
    if (req.user.role === 'admin' || req.user.role === 'client' || event.guestPrivacyEnabled === false) {
      // Admin, Main Client, or Guest (if privacy disabled) get ALL photos for the event
      photos = await Photo.find({ eventId: event._id }).sort({ createdAt: -1 });
    } else {
      // Guest gets only matched photos
      const gallery = await Gallery.findOne({ userId, eventId: event._id }).populate('photoIds');
      if (gallery) photos = gallery.photoIds;
    }

    const proof = await AlbumProof.findOne({ eventId: event._id }).sort({ createdAt: -1 });

    res.json({ 
      photos: signPhotos(photos), 
      event: {
        _id: event._id,
        name: event.name,
        bannerUrl: getSignedUrl(event.bannerUrl),
        eventDate: event.eventDate,
        slug: event.slug,
        albumStatus: event.albumStatus
      },
      proof,
      status: photos.length > 0 ? 'ready' : 'no_photos' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery' });
  }
});

// POST /api/gallery/:photoId/select (Client Only)
router.post('/:photoId/select', auth, async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Forbidden' });

  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    photo.isSelected = !photo.isSelected;
    await photo.save();

    res.json({ isSelected: photo.isSelected });
  } catch (error) {
    res.status(500).json({ message: 'Selection failed' });
  }
});

// POST /api/gallery/:eventId/feedback
router.post('/:eventId/feedback', auth, async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ message: 'Comment is required' });

  try {
    const proof = await AlbumProof.findOne({ eventId: req.params.eventId }).sort({ createdAt: -1 });
    if (!proof) return res.status(404).json({ message: 'Proof not found' });

    proof.feedback.push({ comment, date: new Date() });
    await proof.save();

    res.json({ message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Feedback submission failed' });
  }
});

// POST /api/gallery/:eventId/approve
router.post('/:eventId/approve', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.eventId, { albumStatus: 'Approved' }, { new: true });
    res.json({ message: 'Album approved', status: event.albumStatus });
  } catch (error) {
    res.status(500).json({ message: 'Approval failed' });
  }
});

module.exports = router;
