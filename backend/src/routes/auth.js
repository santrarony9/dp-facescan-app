const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { redisConnection } = require('../config/redis');
const User = require('../models/User');
const { otpLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  const { mobile, eventSlug } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile is required' });

  // Rate limit check (basic example)
  const key = `otp_limit:${mobile}`;
  const attempts = await redisConnection.get(key);
  if (attempts && attempts >= 3) {
    return res.status(429).json({ message: 'Too many attempts. Try again later.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisConnection.setex(`otp:${mobile}`, 300, otp); // 5 min expiry
  await redisConnection.incr(key);
  await redisConnection.expire(key, 600); // 10 min window

  // Send via MSG91
  try {
    // In production, use msg91 axios call here
    console.log(`OTP for ${mobile}: ${otp}`);
    // await axios.post('https://api.msg91.com/api/v5/otp', { ... });
    
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp, fullName, email } = req.body;
  
  // Master OTP Bypass for Developer Testing
  const isMasterOtp = (otp === '112233');
  const storedOtp = await redisConnection.get(`otp:${mobile}`);

  // Allow login if it's the master OTP, regardless of stored data
  if (!isMasterOtp && storedOtp !== otp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Clear OTP if not bypass
  if (storedOtp && !isMasterOtp) {
    await redisConnection.del(`otp:${mobile}`);
  }

  let user = await User.findOne({ mobile });
  if (!user) {
    user = new User({ 
      mobile, 
      fullName: fullName || 'VIP Guest', 
      email: email || '' 
    });
    await user.save();
  } else if (fullName || email) {
    // Update data if provided and not already present
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    await user.save();
  }

  const token = jwt.sign(
    { id: user._id, mobile: user.mobile },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user });
});

// GET /api/auth/status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ isProcessed: user.isProcessed });
  } catch (error) {
    res.status(500).json({ message: 'Error checking status' });
  }
});

module.exports = router;
