const express = require('express');
const router = express.Router();

// Simple in-memory storage for testing (replace with database later)
let users = [];
let currentId = 1;

// Simple token generation
const generateToken = (userId) => {
  return `token_${userId}_${Date.now()}`;
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password, preferences } = req.body;

    // Basic validation
    if (!email || !username || !password || !preferences) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = {
      _id: currentId++,
      email,
      username,
      password, // In real app, this would be hashed
      preferences: preferences || [],
      stats: {
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        karmaScore: 0
      },
      badges: [{
        name: 'Welcome Aboard!',
        icon: '🎉',
        earnedAt: new Date()
      }],
      streaks: {
        currentStreak: 0,
        longestStreak: 0
      },
      settings: {
        theme: 'neon-whisper',
        notifications: {
          followers: true,
          reactions: true,
          comments: true,
          whisperwall: true
        }
      },
      createdAt: new Date()
    };

    users.push(user);

    // Generate token
    const token = generateToken(user._id);

    // Return user (without password)
    const { password: _, ...userData } = user;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user || user.password !== password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user (without password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// POST /api/auth/verify-token
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || !token.startsWith('token_')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Extract user ID from token (simple version)
    const userId = parseInt(token.split('_')[1]);
    const user = users.find(u => u._id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user (without password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Token is valid',
      user: userData
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
});

module.exports = router;
