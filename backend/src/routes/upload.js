const express = require('express');
const router = express.Router();
const s3 = require('../config/aws');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/upload/url?type=selfie&eventId=...
router.get('/url', auth, async (req, res) => {
  const { type, eventId } = req.query;
  const fileName = `${type}/${eventId || 'common'}/${uuidv4()}.jpg`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Expires: 600, // 10 minutes
    ContentType: 'image/jpeg'
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    
    res.json({ uploadUrl, fileUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error generating upload URL' });
  }
});

module.exports = router;
