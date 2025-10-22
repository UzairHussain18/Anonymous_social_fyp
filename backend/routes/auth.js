const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Validation middleware
const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('preferences').exists().withMessage('Preferences are required')
];

const validateLogin = [
  body('identifier').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// POST /api/auth/signup
router.post('/signup', validateSignup, async (req, res) => {
  console.log("Signup route hit"); // 🔹 debug
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    let { email, phone, password, username, preferences, avatar } = req.body;

    // Ensure preferences is array
    if (!Array.isArray(preferences)) preferences = [preferences];
    preferences = preferences.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }, ...(phone ? [{ phone }] : [])] });
    if (existingUser) {
      let field = 'email';
      if (existingUser.username === username) field = 'username';
      if (existingUser.phone === phone) field = 'phone';
      return res.status(400).json({ success: false, message: `User with this ${field} already exists` });
    }

    const user = new User({ email, phone, password, username, preferences, avatar: avatar || null, badges: [{ name: 'Welcome Aboard!', icon: '🎉', earnedAt: new Date() }] });

    await user.save();

    const token = generateToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    console.log("Signup successful for:", email); // 🔹 debug

    res.status(201).json({ success: true, message: 'User created successfully', token, user: userData });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  console.log("Login route hit"); // 🔹 debug
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, identifier, password } = req.body;
    const lookup = identifier || email;
    if (!lookup) return res.status(400).json({ success: false, message: 'Email or username is required' });
    const user = await User.findOne({ $or: [{ email: lookup }, { username: lookup }] });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    await user.updateLastActive();

    const token = generateToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    console.log("Login successful for:", email); // 🔹 debug

    res.json({ success: true, message: 'Login successful', token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// POST /api/auth/verify-token
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'Token is valid', user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
    console.error('Token verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during token verification' });
  }
});

module.exports = router;
