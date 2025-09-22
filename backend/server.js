const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const postRoutes = require('./routes/posts');
const whisperWallRoutes = require('./routes/whisperwall');
const reactionRoutes = require('./routes/reactions');

// Import upload middleware
const { uploadMiddleware, getFileUrl } = require('./middleware/upload');

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded media)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whisper-echo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    console.log('💡 Tip: Make sure MongoDB is running locally, or update MONGODB_URI in .env file');
    // Continue without database for now
    console.log('📱 Server starting without database connection...');
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/whisperwall', whisperWallRoutes);
app.use('/api/reactions', reactionRoutes);

// Media upload endpoints
app.post('/api/upload/single', 
  uploadMiddleware.single('media'),
  uploadMiddleware.handleError,
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      console.log('📎 File uploaded successfully:', req.file);

      const folder = getMediaFolder(req.file.mimetype);
      const fileUrl = getFileUrl(req, req.file.filename, folder);
      
      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          path: req.file.path
        }
      });
    } catch (error) {
      console.error('Upload endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }
);

app.post('/api/upload/multiple',
  uploadMiddleware.multiple('media', 5),
  uploadMiddleware.handleError,
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      console.log('📎 Multiple files uploaded:', req.files.length);

      const files = req.files.map(file => {
        const folder = getMediaFolder(file.mimetype);
        const fileUrl = getFileUrl(req, file.filename, folder);
        return {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: fileUrl,
          path: file.path
        };
      });
      
      res.json({
        success: true,
        message: `${files.length} files uploaded successfully`,
        files: files
      });
    } catch (error) {
      console.error('Multiple upload endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }
);

// Helper function to determine media folder
const getMediaFolder = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'videos';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'images';
};

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
  });
  
  socket.on('leave-room', (room) => {
    socket.leave(room);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Cron job to clear WhisperWall posts every 24 hours
cron.schedule('0 0 * * *', async () => {
  try {
    const WhisperPost = require('./models/WhisperPost');
    const deleted = await WhisperPost.deleteMany({
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    console.log(`🧹 Cleared ${deleted.deletedCount} WhisperWall posts`);
  } catch (error) {
    console.error('Error clearing WhisperWall posts:', error);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Mobile access: http://192.168.10.2:${PORT}/health`);
});

module.exports = { app, io };
