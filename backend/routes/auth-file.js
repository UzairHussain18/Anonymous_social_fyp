const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// File paths
const USERS_FILE = path.join(__dirname, '../storage/users.json');

// Ensure storage directory exists
const ensureStorageDir = async () => {
  const storageDir = path.dirname(USERS_FILE);
  try {
    await fs.access(storageDir);
  } catch {
    await fs.mkdir(storageDir, { recursive: true });
  }
};

// Load users from file
const loadUsers = async () => {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return [];
  }
};

// Save users to file
const saveUsers = async (users) => {
  try {
    await ensureStorageDir();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
};

// Get next user ID
const getNextId = async () => {
  const users = await loadUsers();
  return users.length > 0 ? Math.max(...users.map(u => u._id)) + 1 : 1;
};

// Simple token generation
const generateToken = (userId) => {
  return `token_${userId}_${Date.now()}`;
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

const validateUsername = (username) => {
  const errors = [];
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username.length > 30) {
    errors.push('Username must not exceed 30 characters');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  return errors;
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    console.log('📝 Signup request received:', JSON.stringify(req.body, null, 2));
    
    const { email, username, password, preferences, phone, avatar } = req.body;

    // Comprehensive validation
    const validationErrors = [];

    // Check required fields
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, username, and password are required',
        errors: ['Missing required fields']
      });
    }

    // Validate email
    if (!validateEmail(email)) {
      validationErrors.push('Please enter a valid email address');
    }

    // Validate username
    const usernameErrors = validateUsername(username);
    validationErrors.push(...usernameErrors);

    // Validate password
    const passwordErrors = validatePassword(password);
    validationErrors.push(...passwordErrors);

    // Validate preferences
    if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
      validationErrors.push('Please select at least one preference');
    }

    // If validation errors exist, return them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0], // Return first error as main message
        errors: validationErrors
      });
    }

    // Load existing users
    const users = await loadUsers();

    // Check if user exists (more specific error messages)
    const existingUserByEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already in use',
        errors: ['Email address is already in use']
      });
    }

    const existingUserByUsername = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken',
        errors: ['Username is already taken']
      });
    }

    // Check phone if provided
    if (phone && phone.trim()) {
      const existingUserByPhone = users.find(u => u.phone === phone.trim());
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use',
          errors: ['Phone number is already in use']
        });
      }
    }

    // Create new user
    const userId = await getNextId();
    const user = {
      _id: userId,
      email,
      username,
      password, // In production, hash this
      phone: phone || undefined,
      avatar: avatar || null,
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add user to array and save
    users.push(user);
    const saved = await saveUsers(users);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save user data'
      });
    }

    console.log('✅ User created and saved to file:', user._id);

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
      message: 'Server error during signup',
      error: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Login request received');
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        errors: ['Email and password are required']
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
        errors: ['Please enter a valid email address']
      });
    }

    // Load users
    const users = await loadUsers();

    // Find user by email (case insensitive)
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No account found with this email address',
        errors: ['No account found with this email address']
      });
    }

    // Check password
    if (user.password !== password) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password',
        errors: ['Incorrect password']
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
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Extract user ID from token (simple implementation)
    const tokenParts = token.split('_');
    if (tokenParts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    const userId = parseInt(tokenParts[1]);
    
    // Load users and find user
    const users = await loadUsers();
    const user = users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user (without password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
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
