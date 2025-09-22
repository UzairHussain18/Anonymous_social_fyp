const fs = require('fs').promises;
const path = require('path');

// File paths
const USERS_FILE = path.join(__dirname, '../storage/users.json');

// Load users from file
const loadUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Middleware to authenticate and authorize users
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

    // Extract user ID from token (simple file-based implementation)
    const tokenParts = token.split('_');
    if (tokenParts.length < 2) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    const userId = parseInt(tokenParts[1]);
    
    // Load users and find user
    const users = await loadUsers();
    const user = users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to request object (without password)
    const { password, ...userData } = user;
    req.user = userData;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const tokenParts = token.split('_');
      if (tokenParts.length >= 2) {
        const userId = parseInt(tokenParts[1]);
        const users = await loadUsers();
        const user = users.find(u => u._id === userId);
        if (user) {
          const { password, ...userData } = user;
          req.user = userData;
        }
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Generate anonymous session ID for WhisperWall features
const generateSessionId = (req, res, next) => {
  if (!req.sessionId) {
    // Create a session ID based on IP + User Agent for anonymous users
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
