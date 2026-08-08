const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    // For simplicity, we'll check if the role is NOT guest/client for admin routes
    // Or if we specifically set role: 'admin' (requires admin login logic)
    // Since we use a PIN on frontend, let's look for a specific header or role
    if (req.user.role === 'guest' || req.user.role === 'client') {
      return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
  });
};

module.exports = { auth, adminAuth };
