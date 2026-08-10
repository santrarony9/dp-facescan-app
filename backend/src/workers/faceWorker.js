const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const azureFace = require('../config/azure');
const User = require('../models/User');
const Photo = require('../models/Photo');
const Gallery = require('../models/Gallery');

const worker = new Worker('face-processing', async (job) => {
  const { imageUrl, userId, eventId, largeFaceListId } = job.data;

  try {
    console.log(`[FaceWorker] Checking user ${userId} against event ${eventId}...`);
    // 1. Detect face in the selfie
    const detectRes = await azureFace.post('/face/v1.0/detect?returnFaceId=true&recognitionModel=recognition_04&detectionModel=detection_03', {
      url: imageUrl
    });

    if (!detectRes.data || detectRes.data.length === 0) {
      throw new Error('No face detected in the uploaded selfie.');
    }

    const faceId = detectRes.data[0].faceId;

    // 2. Find Similar faces in the Event's LargeFaceList
    // (Ensure largeFaceListId matches the one created in admin.js)
    const findSimilarsRes = await azureFace.post('/face/v1.0/findsimilars', {
      faceId: faceId,
      largeFaceListId: largeFaceListId,
      maxNumOfCandidatesReturned: 1000, // retrieve up to 1000 matched faces for VIPs
      mode: 'matchFace'
    });

    // 3. Extract matching persisted Face IDs
    const matchedPersistedFaceIds = findSimilarsRes.data.map(match => match.persistedFaceId);
    
    // 4. Find all photos containing those persisted Face IDs
    let matchedPhotoIds = [];
    if (matchedPersistedFaceIds.length > 0) {
      const photos = await Photo.find({
        eventId: eventId,
        faceIds: { $in: matchedPersistedFaceIds }
      });
      matchedPhotoIds = photos.map(photo => photo._id);
    }

    console.log(`[FaceWorker] Found ${matchedPhotoIds.length} matches for user ${userId}`);

    // 5. Update Gallery and User
    await Gallery.findOneAndUpdate(
        { userId, eventId },
        { $addToSet: { photoIds: { $each: matchedPhotoIds } } },
        { upsert: true }
    );

    await User.findByIdAndUpdate(userId, { isProcessed: true });

    // Publish event for Real-Time SSE Updates
    redisConnection.publish(`user-status:${userId}`, JSON.stringify({ isProcessed: true, matchCount: matchedPhotoIds.length }));

  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('[FaceWorker] Error:', errMsg);
    await User.findByIdAndUpdate(userId, { isProcessed: false }); // Allow retry
    
    // Publish error event for Real-Time SSE Updates to prevent UI from hanging
    redisConnection.publish(`user-status:${userId}`, JSON.stringify({ isProcessed: false, error: errMsg }));
  }
}, {
  connection: redisConnection,
  concurrency: 2,
  settings: {
    backoffStrategy: (attemptsMade) => {
      return Math.min(5000 * Math.pow(2, attemptsMade), 60000);
    }
  }
});

worker.on('failed', async (job, err) => {
  if (job.attemptsMade >= 3) {
    const { faceDLQ } = require('../config/redis');
    await faceDLQ.add('failed-face-processing', {
      originalJobId: job.id,
      data: job.data,
      error: err.message,
      failedAt: new Date().toISOString(),
      attempts: job.attemptsMade
    });
    console.error(`[FaceWorker] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
  }
});

console.log('Face Processing Worker Started');
