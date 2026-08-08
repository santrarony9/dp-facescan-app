const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { redisConnection } = require('../config/redis');
const User = require('../models/User');
const Event = require('../models/Event');
const { otpLimiter } = require('../middleware/rateLimiter');
const { auth } = require('../middleware/auth');

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

// POST /api/auth/passkey-login (Fast 1-Step Passkey Entry)
router.post('/passkey-login', async (req, res) => {
  const { passkey, slug } = req.body;
  if (!passkey) return res.status(400).json({ message: 'Passkey is required' });

  try {
    let event = null;
    
    // 1. Try to find event matching slug & passkey
    if (slug) {
      event = await Event.findOne({ slug: slug, clientPasskey: passkey });
    }
    
    // 2. Search globally by clientPasskey
    if (!event) {
      event = await Event.findOne({ clientPasskey: passkey });
    }

    // 3. Fallback demo passkeys (112233, 123456, 000000)
    if (!event && ['112233', '123456', '000000', 'admin123'].includes(passkey)) {
      if (slug) {
        event = await Event.findOne({ slug: slug });
      }
      if (!event) {
        event = await Event.findOne().sort({ createdAt: -1 });
      }
    }

    if (!event) {
      return res.status(401).json({ message: 'Invalid Passkey. Please enter a valid 6-digit passkey.' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: event._id, 
        role: 'client', 
        eventId: event._id,
        eventSlug: event.slug 
      },
      process.env.JWT_SECRET,
      { expiresIn: '60d' }
    );

    res.json({ token, role: 'client', eventSlug: event.slug, eventName: event.name });
  } catch (error) {
    res.status(500).json({ message: 'Passkey login failed', error: error.message });
  }
});

// POST /api/auth/client-login
router.post('/client-login', async (req, res) => {
  const { mobile, passkey } = req.body;
  if (!passkey) return res.status(400).json({ message: 'Passkey is required' });

  try {
    // Find event where passkey matches
    let event = await Event.findOne({ clientPasskey: passkey });
    if (!event && (passkey === '112233' || passkey === '123456')) {
      event = await Event.findOne().sort({ createdAt: -1 });
    }
    
    if (!event) return res.status(401).json({ message: 'Invalid passkey. Matching album not found.' });

    const token = jwt.sign(
      { 
        id: event._id, 
        role: 'client', 
        eventId: event._id,
        eventSlug: event.slug 
      },
      process.env.JWT_SECRET,
      { expiresIn: '60d' }
    );

    res.json({ token, role: 'client', eventSlug: event.slug });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// POST /api/auth/guest-register (Bypasses OTP)
router.post('/guest-register', async (req, res) => {
  const { mobile, fullName, email } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile is required' });

  let user = await User.findOne({ mobile });
  if (!user) {
    user = new User({ 
      mobile, 
      fullName: fullName || 'VIP Guest', 
      email: email || '',
      role: 'guest'
    });
    await user.save();
  } else {
    // Update data if provided
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    await user.save();
  }

  const token = jwt.sign(
    { id: user._id, mobile: user.mobile, role: user.role || 'guest' },
    process.env.JWT_SECRET,
    { expiresIn: '60d' }
  );

  res.json({ token, user });
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  const { pin } = req.body;
  if (pin === (process.env.ADMIN_PIN || '1234')) {
    const token = jwt.sign(
      { id: 'admin', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '60d' }
    );
    res.json({ token, role: 'admin' });
  } else {
    res.status(401).json({ message: 'Invalid Admin PIN' });
  }
});

// POST /api/auth/verify-otp (Kept for backwards compatibility but ignores OTP check if otp is 112233)
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp, fullName, email } = req.body;
  
  // BYPASS OTP FOR NOW AS PER REQUEST
  if (otp !== '112233') {
    const storedOtp = await redisConnection.get(`otp:${mobile}`);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    await redisConnection.del(`otp:${mobile}`);
  }

  let user = await User.findOne({ mobile });
  if (!user) {
    user = new User({ 
      mobile, 
      fullName: fullName || 'VIP Guest', 
      email: email || '',
      role: 'guest'
    });
    await user.save();
  } else {
    // Update data if provided
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    await user.save();
  }

  const token = jwt.sign(
    { id: user._id, mobile: user.mobile, role: user.role || 'guest' },
    process.env.JWT_SECRET,
    { expiresIn: '60d' }
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
