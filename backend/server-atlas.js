const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Security middleware
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In production, hash this
  phone: { type: String },
  preferences: [String],
  stats: {
    postsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    karmaScore: { type: Number, default: 0 }
  },
  badges: [{
    name: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  streaks: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 }
  },
  settings: {
    theme: { type: String, default: 'neon-whisper' },
    notifications: {
      followers: { type: Boolean, default: true },
      reactions: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      whisperwall: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Simple token generation
const generateToken = (userId) => {
  return `token_${userId}_${Date.now()}`;
};

// AUTH ROUTES
// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('📝 Signup request received:', JSON.stringify(req.body, null, 2));
    
    const { email, username, password, preferences, phone } = req.body;

    // Basic validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, username, and password are required'
      });
    }

    if (!preferences || !Array.isArray(preferences)) {
      return res.status(400).json({
        success: false,
        message: 'Preferences must be an array'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = new User({
      email,
      username,
      password, // In real app, hash this
      preferences: preferences || [],
      phone: phone || undefined,
      badges: [{
        name: 'Welcome Aboard!',
        icon: '🎉',
        earnedAt: new Date()
      }]
    });

    await user.save();
    console.log('User created successfully:', user._id);

    // Generate token
    const token = generateToken(user._id);

    // Return user (without password)
    const { password: _, ...userData } = user.toObject();

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
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user (without password)
    const { password: _, ...userData } = user.toObject();

    console.log('Login successful for user:', user._id);

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
      message: 'Server error during login',
      error: error.message
    });
  }
});

// POST /api/auth/verify-token
app.post('/api/auth/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || !token.startsWith('token_')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Extract user ID from token (simple version)
    const userId = token.split('_')[1];
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user (without password)
    const { password: _, ...userData } = user.toObject();

    res.json({
      success: true,
      message: 'Token is valid',
      user: userData
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    status: 'OK', 
    database: dbStatus,
    timestamp: new Date().toISOString() 
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working with Atlas!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    // Use Atlas URI from environment or fallback
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://blog-app:blog-app@blog-app.zi3j2.mongodb.net/whisper-echo?retryWrites=true&w=majority';
    
    console.log('🔌 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Make sure your Atlas cluster is running and IP is whitelisted');
    
    // Don't exit - let the server run without database for debugging
    console.log('📱 Server will start anyway for debugging...');
  }
};

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Atlas server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 Mobile access: http://192.168.10.2:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`📱 Mobile API: http://192.168.10.2:${PORT}/api/test`);
  });
};

startServer();

module.exports = app;
