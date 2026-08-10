const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');

const detectionDlqMonitor = new Worker('photo-detection-dlq', async (job) => {
  console.log(`[DLQ Monitor] Job ${job.data.originalJobId} arrived in photo-detection-dlq. Error: ${job.data.error}`);
}, { connection: redisConnection, concurrency: 1 });

const faceDlqMonitor = new Worker('face-processing-dlq', async (job) => {
  console.log(`[DLQ Monitor] Job ${job.data.originalJobId} arrived in face-processing-dlq. Error: ${job.data.error}`);
}, { connection: redisConnection, concurrency: 1 });

console.log('DLQ Monitors Started');
