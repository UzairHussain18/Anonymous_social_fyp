const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate token - MongoDB version
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    // Find user in MongoDB
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user; // attach user to request
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Optional authentication
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId).select('-password');
        if (user) req.user = user;
      } catch (e) {
        // ignore invalid token
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Generate anonymous session ID (same as before)
const generateSessionId = (req, res, next) => {
  if (!req.sessionId) {
    const crypto = require('crypto');
    const identifier = req.ip + req.get('User-Agent') + Date.now();
    req.sessionId = crypto.createHash('sha256').update(identifier).digest('hex');
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateSessionId
};
