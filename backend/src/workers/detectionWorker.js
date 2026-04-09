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

    // 2. Add each face to the LargeFaceList using its bounding box
    for (const face of faces) {
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
        console.error(`[DetectionWorker] Failed to add a face for photo ${photoId}:`, addErr.response?.data || addErr.message);
      }
      
      // small delay to respect rate limits if there are many faces
      await new Promise(r => setTimeout(r, 200));
    }

    // 3. Update the Photo model with persisted faceIds
    await Photo.findByIdAndUpdate(photoId, { 
      faceIds: persistedFaceIds,
      isProcessed: true 
    });

    // 4. Trigger training on the LargeFaceList so matches can be found
    if (persistedFaceIds.length > 0) {
      try {
        await azureFace.post(`/face/v1.0/largefacelists/${largeFaceListId}/train`);
        console.log(`[DetectionWorker] Training triggered for list ${largeFaceListId}`);
      } catch (trainErr) {
        // It's normal for train to throw if it's already running
        console.log(`[DetectionWorker] Train command note:`, trainErr.response?.data?.error?.message || trainErr.message);
      }
    }

  } catch (error) {
    console.error(`[DetectionWorker] Error processing photo ${photoId}:`, error.response?.data || error.message);
    // Optionally: marking as failed in the DB
  }
}, { connection: redisConnection });

console.log('Face Detection Worker Started');

module.exports = detectionWorker;
