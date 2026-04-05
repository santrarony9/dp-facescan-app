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

module.exports = { redisConnection, faceQueue, detectionQueue };
