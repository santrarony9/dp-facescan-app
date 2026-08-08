const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const User = require('../models/User');
const azureFace = require('../config/azure');
const { adminAuth } = require('../middleware/auth');
const axios = require('axios');
const archiver = require('archiver');
const AlbumProof = require('../models/AlbumProof');
const { detectionQueue } = require('../config/redis');

// POST /api/admin/events (Admin Only - simplified)
router.post('/events', adminAuth, async (req, res) => {
  const { name, slug, bannerUrl, eventDate, clientName, clientPhone } = req.body;
  
  try {
    // 1. Create Azure LargeFaceList (wrapped in try-catch to allow bypass if not approved yet)
    const largeFaceListId = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
    try {
      await azureFace.put(`/face/v1.0/largefacelists/${largeFaceListId}`, {
        name: name,
        userData: 'Created for event: ' + name,
        recognitionModel: 'recognition_04'
      });
    } catch (azureErr) {
      console.warn(`Azure Face API pending approval. Bypassing for now so testing can continue. Error: ${azureErr.message}`);
    }

    const newEvent = new Event({
      name,
      slug,
      bannerUrl,
      eventDate,
      clientName,
      clientPhone,
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
router.post('/photos/bulk', adminAuth, async (req, res) => {
  const { eventId, images } = req.body; // images = array of strings or objects {url, originalFilename}
  
  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const photoPromises = images.map(async (item) => {
      const url = typeof item === 'string' ? item : item.url;
      const originalFilename = typeof item === 'string' ? undefined : item.originalFilename;
      const thumbnailUrl = typeof item === 'string' ? undefined : item.thumbnailUrl;

      // 1. Save Photo with isProcessed: false
      const photo = new Photo({
        eventId: event._id,
        imageUrl: url,
        thumbnailUrl: thumbnailUrl,
        originalFilename
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
router.get('/events', adminAuth, async (req, res) => {
  const events = await Event.find().lean();
  const eventIds = events.map(e => e._id);
  
  const eventsWithCount = await Promise.all(events.map(async (e) => {
    const photoCount = await Photo.countDocuments({ 
      eventId: { $in: [e._id, e._id.toString()] } 
    });
    
    // For face count, we can do a simple aggregate for just this event, or if it fails fallback to 0
    let faceCount = 0;
    try {
      const faceAgg = await Photo.aggregate([
        { $match: { eventId: { $in: [e._id, e._id.toString()] } } },
        { $unwind: "$faceIds" },
        { $count: "totalFaces" }
      ]);
      if (faceAgg.length > 0) faceCount = faceAgg[0].totalFaces;
    } catch (err) {
      console.log('Face aggregate error:', err.message);
    }

    // Sign banner URL
    let signedBannerUrl = e.bannerUrl;
    if (signedBannerUrl && signedBannerUrl.startsWith('http')) {
      try {
        const url = new URL(signedBannerUrl);
        const key = decodeURIComponent(url.pathname.slice(1));
        signedBannerUrl = require('../config/aws').getSignedUrl('getObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Expires: 3600
        });
      } catch (err) {}
    }

    // Sign watermark URL
    let signedWatermarkUrl = e.watermarkUrl;
    if (signedWatermarkUrl && signedWatermarkUrl.startsWith('http')) {
      try {
        const url = new URL(signedWatermarkUrl);
        const key = decodeURIComponent(url.pathname.slice(1));
        signedWatermarkUrl = require('../config/aws').getSignedUrl('getObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Expires: 3600
        });
      } catch (err) {}
    }

    return { 
      ...e, 
      bannerUrl: signedBannerUrl,
      watermarkUrl: signedWatermarkUrl,
      photoCount,
      faceCount
    };
  }));

  res.json(eventsWithCount);
});

// DELETE /api/admin/events/:id
router.delete('/events/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // 1. Delete associated photos in S3 and DB
    const photos = await Photo.find({ eventId: event._id });
    try {
      const s3 = require('../config/aws');
      const objectsToDelete = [];
      
      const pushKey = (urlStr) => {
        if (urlStr && urlStr.startsWith('http')) {
          try {
            const url = new URL(urlStr);
            objectsToDelete.push({ Key: decodeURIComponent(url.pathname.slice(1)) });
          } catch(e) {}
        }
      };

      photos.forEach(p => {
        pushKey(p.imageUrl);
        pushKey(p.thumbnailUrl);
      });
      pushKey(event.bannerUrl);
      pushKey(event.watermarkUrl);

      if (objectsToDelete.length > 0) {
        for (let i = 0; i < objectsToDelete.length; i += 1000) {
          await s3.deleteObjects({
            Bucket: process.env.AWS_S3_BUCKET,
            Delete: { Objects: objectsToDelete.slice(i, i + 1000) }
          }).promise();
        }
      }
    } catch (s3err) {
      console.error('S3 deletion error:', s3err);
    }
    
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
router.put('/events/:id', adminAuth, async (req, res) => {
  try {
    const allowedFields = ['name', 'slug', 'bannerUrl', 'watermarkUrl', 'eventDate', 'clientName', 'clientPhone', 'guestPrivacyEnabled', 'albumStatus'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
});

// POST /api/admin/events/:id/train (Manual trigger)
router.post('/events/:id/train', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await azureFace.post(`/face/v1.0/largefacelists/${event.largeFaceListId}/train`);
    res.json({ message: 'Training triggered' });
  } catch (error) {
    res.status(500).json({ message: 'Error triggering training', error: error.response?.data || error.message });
  }
});

// GET /api/admin/events/:id/selections (For local file matching)
router.get('/events/:id/selections', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const selectedPhotos = await Photo.find({ eventId: event._id, isSelected: true });
    
    // Extract original filenames. Fallback to image URL if missing (for older photos).
    const filenames = selectedPhotos.map(p => p.originalFilename || p.imageUrl.split('/').pop());
    
    res.json({ filenames });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching selections', error: error.message });
  }
});

// GET /api/admin/events/:id/download-zip (Internal Design Use)
router.get('/events/:id/download-zip', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const selectedPhotos = await Photo.find({ eventId: event._id, isSelected: true });
    if (selectedPhotos.length === 0) {
      return res.status(400).json({ message: 'No photos selected for this album' });
    }

    const fileName = `${event.clientName || 'Client'}_${event.name}.zip`.replace(/[^a-z0-9.]/gi, '_');
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (const photo of selectedPhotos) {
      try {
        const response = await axios.get(photo.imageUrl, { 
          responseType: 'stream',
          timeout: 10000 // 10s timeout per photo
        });
        const name = photo.imageUrl.split('/').pop() || `photo_${photo._id}.jpg`;
        archive.append(response.data, { name });
      } catch (err) {
        console.error(`Failed to stream photo ${photo.imageUrl}: ${err.message}`);
        // We continue to next photo instead of failing the whole ZIP
      }
    }

    archive.finalize();
  } catch (error) {
    res.status(500).json({ message: 'ZIP generation failed', error: error.message });
  }
});

// POST /api/admin/events/:id/proof (Upload Album Proof)
router.post('/events/:id/proof', adminAuth, async (req, res) => {
  const { pdfUrl } = req.body;
  if (!pdfUrl) return res.status(400).json({ message: 'PDF URL is required' });

  try {
    const proof = new AlbumProof({
      eventId: req.params.id,
      pdfUrl
    });
    await proof.save();
    
    // Update event status
    await Event.findByIdAndUpdate(req.params.id, { albumStatus: 'Proofing' });

    res.status(201).json(proof);
  } catch (error) {
    res.status(500).json({ message: 'Proof upload failed' });
  }
});

// GET /api/admin/leads (Guest Lead Data for CRM)
router.get('/leads', adminAuth, async (req, res) => {
  try {
    const leads = await User.find({ role: { $in: ['guest', 'client'] } })
      .select('fullName mobile email role eventId createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads', error: error.message });
  }
});

module.exports = router;
