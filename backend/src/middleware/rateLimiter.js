const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: { message: 'Too many OTP attempts, please try again after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const selfieLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each guest to 3 scans per hour
  message: { message: 'Max 3 selfie attempts allowed per hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpLimiter, selfieLimiter };
