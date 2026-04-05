const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const azureFace = require('../config/azure');
const Photo = require('../models/Photo');

const detectionWorker = new Worker('photo-detection', async (job) => {
  const { photoId, imageUrl, eventId } = job.data;
  console.log(`[DetectionWorker] Processing photo: ${photoId} from ${imageUrl}`);

  try {
    // 1. Call Azure Face API (Detect)
    // We only need the faceId, which defaults to true in azureFace.post
    const response = await azureFace.post('/face/v1.0/detect?returnFaceId=true&recognitionModel=recognition_04&detectionModel=detection_03', {
      url: imageUrl
    });

    const faceIds = response.data.map(face => face.faceId);
    console.log(`[DetectionWorker] Found ${faceIds.length} faces in ${photoId}`);

    // 2. Update the Photo model with detected faceIds
    await Photo.findByIdAndUpdate(photoId, { 
      faceIds: faceIds,
      isProcessed: true 
    });

  } catch (error) {
    console.error(`[DetectionWorker] Error processing photo ${photoId}:`, error.response?.data || error.message);
    // Optionally: marking as failed in the DB
  }
}, { connection: redisConnection });

console.log('Face Detection Worker Started');

module.exports = detectionWorker;
