const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const bucket = process.env.AWS_S3_BUCKET;

async function cleanS3() {
  try {
    let params = { Bucket: bucket, Prefix: 'event/' };
    let listedObjects;
    let deletedCount = 0;
    
    do {
      listedObjects = await s3.listObjectsV2(params).promise();
      
      if (listedObjects.Contents.length === 0) break;
      
      const deleteParams = {
        Bucket: bucket,
        Delete: { Objects: [] }
      };
      
      listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
      });
      
      await s3.deleteObjects(deleteParams).promise();
      deletedCount += listedObjects.Contents.length;
      
      params.ContinuationToken = listedObjects.NextContinuationToken;
    } while (listedObjects.IsTruncated);
    
    console.log(`Deleted ${deletedCount} orphaned event photos from S3.`);
    
  } catch (err) {
    console.error('S3 Clean Error:', err);
  }
}

async function cleanOldDB() {
  const mongoose = require('mongoose');
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/dp-facescan');
    const Photo = mongoose.connection.db.collection('photos');
    const Event = mongoose.connection.db.collection('events');
    const pCount = await Photo.countDocuments();
    const eCount = await Event.countDocuments();
    await Photo.deleteMany({});
    await Event.deleteMany({});
    console.log(`Deleted ${pCount} photos and ${eCount} events from old local dp-facescan database.`);
    process.exit(0);
  } catch(e) {
    console.error('Mongo Error:', e);
    process.exit(1);
  }
}

async function run() {
  await cleanS3();
  await cleanOldDB();
}

run();
