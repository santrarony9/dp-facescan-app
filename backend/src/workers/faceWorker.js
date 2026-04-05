const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const azureFace = require('../config/azure');
const User = require('../models/User');
const Photo = require('../models/Photo');
const Gallery = require('../models/Gallery');

const worker = new Worker('face-processing', async (job) => {
  const { imageUrl, userId, eventId, personGroupId } = job.data;

  try {
    // 1. Create a "Person" for this user in the event's PersonGroup
    const personRes = await azureFace.post(`/face/v1.0/persongroups/${personGroupId}/persons`, {
      name: `User_${userId}`,
      userData: userId
    });
    const personId = personRes.data.personId;

    // 2. Add the user's selfie as a face for this person
    await azureFace.post(`/face/v1.0/persongroups/${personGroupId}/persons/${personId}/persistedFaces`, {
      url: imageUrl
    });

    // 3. Trigger Training (Azure requires training before identification)
    await azureFace.post(`/face/v1.0/persongroups/${personGroupId}/train`);

    // 4. Wait for training to complete (simplified polling)
    let trained = false;
    for (let i = 0; i < 5; i++) {
        const trainStatus = await azureFace.get(`/face/v1.0/persongroups/${personGroupId}/training`);
        if (trainStatus.data.status === 'succeeded') {
            trained = true;
            break;
        }
        await new Promise(r => setTimeout(r, 1000));
    }

    if (!trained) throw new Error('PersonGroup training timed out');

    // 5. Detect and Identify in Event Photos
    // In a high-scale system, we'd use a different approach, 
    // but here we'll match the user against all faceIds stored in the event photos.
    const photos = await Photo.find({ eventId });
    const matchedPhotoIds = [];

    for (const photo of photos) {
        if (photo.faceIds && photo.faceIds.length > 0) {
            // Respect Azure Rate Limits (e.g., 5-10 calls per second)
            await new Promise(r => setTimeout(r, 200)); 

            const identifyRes = await azureFace.post('/face/v1.0/identify', {
                personGroupId,
                faceIds: photo.faceIds.slice(0, 10), // Azure limit per call
                maxNumOfCandidatesReturned: 1,
                confidenceThreshold: 0.5
            });

            // Check if any face in the photo matches the new personId
            const matches = identifyRes.data.some(res => 
                res.candidates.some(c => c.personId === personId)
            );

            if (matches) matchedPhotoIds.push(photo._id);
        }
    }

    // 6. Update Gallery and User
    await Gallery.findOneAndUpdate(
        { userId, eventId },
        { $addToSet: { photoIds: { $each: matchedPhotoIds } } },
        { upsert: true }
    );

    await User.findByIdAndUpdate(userId, { personId, isProcessed: true });

  } catch (error) {
    console.error('Worker Error:', error.response?.data || error.message);
    await User.findByIdAndUpdate(userId, { isProcessed: false }); // Allow retry
  }
}, { connection: redisConnection });

console.log('Face Processing Worker Started');
