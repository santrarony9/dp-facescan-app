const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const azureFace = require('../config/azure');
const Photo = require('../models/Photo');

const detectionWorker = new Worker('photo-detection', async (job) => {
  const { photoId, imageUrl, largeFaceListId } = job.data;
  console.log(`[DetectionWorker] Processing photo: ${photoId} from ${imageUrl}`);

  try {
    // 1. Detect all faces first to get bounding boxes
    const detectResponse = await azureFace.post('/face/v1.0/detect?returnFaceId=false&recognitionModel=recognition_04&detectionModel=detection_03', {
      url: imageUrl
    });

    const faces = detectResponse.data;
    console.log(`[DetectionWorker] Found ${faces.length} faces in ${photoId}`);

    const persistedFaceIds = [];

    // 2. Filter faces that are too small (<50px width/height) to save Azure Face Limit space
    const validFaces = faces.filter(face => face.faceRectangle.width >= 50 && face.faceRectangle.height >= 50);
    console.log(`[DetectionWorker] Found ${faces.length} faces, ${validFaces.length} valid (>50px) in ${photoId}`);


    // 3. Add each valid face to the LargeFaceList using its bounding box
    for (const face of validFaces) {
      const rect = face.faceRectangle;
      const targetFace = `${rect.left},${rect.top},${rect.width},${rect.height}`;
      
      try {
        const addFaceRes = await azureFace.post(`/face/v1.0/largefacelists/${largeFaceListId}/persistedfaces?detectionModel=detection_03&userData=${photoId}`, {
          url: imageUrl
        }, {
          params: { targetFace }
        });
        
        if (addFaceRes.data && addFaceRes.data.persistedFaceId) {
          persistedFaceIds.push(addFaceRes.data.persistedFaceId);
        }
      } catch (addErr) {
        const statusCode = addErr.response?.status;
        if (statusCode === 403 || statusCode === 401) {
          console.warn(`[DetectionWorker] Azure permissions error (403/401). Face recognition may be disabled for this account. Skipping face addition.`);
          break; // Stop trying to add faces for this photo if the account doesn't have permissions yet
        }
        console.error(`[DetectionWorker] Failed to add a face for photo ${photoId}:`, addErr.response?.data || addErr.message);
      }
      
      // small delay to respect rate limits if there are many faces
      await new Promise(r => setTimeout(r, 200));
    }

    // 4. Update the Photo model with persisted faceIds
    await Photo.findByIdAndUpdate(photoId, { 
      faceIds: persistedFaceIds,
      isProcessed: true 
    });

    console.log(`[DetectionWorker] Photo ${photoId} processed with ${persistedFaceIds.length} faces.`);

  } catch (error) {
    console.error(`[DetectionWorker] Error processing photo ${photoId}:`, error.response?.data || error.message);
    // Rethrow to ensure BullMQ marks the job as failed and triggers retries
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 5, // Process up to 5 photos concurrently
  limiter: {
    max: 8, // Max 8 jobs
    duration: 1000 // per 1 second (respects 10 TPS limit)
  },
  settings: {
    backoffStrategy: (attemptsMade) => {
      return Math.min(5000 * Math.pow(2, attemptsMade), 60000);
    }
  }
});

detectionWorker.on('failed', async (job, err) => {
  if (job.attemptsMade >= 3) {
    const { detectionDLQ } = require('../config/redis');
    await detectionDLQ.add('failed-detection', {
      originalJobId: job.id,
      data: job.data,
      error: err.message,
      failedAt: new Date().toISOString(),
      attempts: job.attemptsMade
    });
    console.error(`[DetectionWorker] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
  }
});

console.log('Face Detection Worker Started');

module.exports = detectionWorker;
