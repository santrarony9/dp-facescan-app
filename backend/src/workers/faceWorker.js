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
      maxNumOfCandidatesReturned: 100, // retrieve up to 100 matched faces
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

  } catch (error) {
    console.error('[FaceWorker] Error:', error.response?.data || error.message);
    await User.findByIdAndUpdate(userId, { isProcessed: false }); // Allow retry
  }
}, { connection: redisConnection });

console.log('Face Processing Worker Started');
