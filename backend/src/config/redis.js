const Redis = require('ioredis');
const { Queue } = require('bullmq');
require('dotenv').config();

const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const faceQueue = new Queue('face-processing', { 
  connection: redisConnection 
});

const detectionQueue = new Queue('photo-detection', { 
  connection: redisConnection 
});

const detectionDLQ = new Queue('photo-detection-dlq', { connection: redisConnection });
const faceDLQ = new Queue('face-processing-dlq', { connection: redisConnection });

module.exports = { redisConnection, faceQueue, detectionQueue, detectionDLQ, faceDLQ };
