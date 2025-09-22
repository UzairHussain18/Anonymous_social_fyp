const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Import upload middleware
const { uploadMiddleware, getFileUrl } = require('./middleware/upload');

// Security middleware
app.use(cors());

// Serve static files (uploaded media)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import file-based routes (with persistent storage)
const authRoutes = require('./routes/auth-file');
const postsRoutes = require('./routes/posts-file');
const whispersRoutes = require('./routes/whisperwall-file');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/whisperwall', whispersRoutes);

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server running with file-based storage',
    storage: 'JSON files',
    persistent: true,
    timestamp: new Date().toISOString() 
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'File-based API is working!',
    storage: 'JSON files in backend/storage/',
    persistent: true
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'WhisperEcho API with File Storage',
    version: '1.0.0',
    storage: 'JSON files',
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        verify: 'POST /api/auth/verify-token'
      },
      posts: {
        create: 'POST /api/posts',
        feed: 'GET /api/posts/feed',
        get: 'GET /api/posts/:id'
      },
      whispers: {
        create: 'POST /api/whisperwall',
        feed: 'GET /api/whisperwall',
        get: 'GET /api/whisperwall/:id'
      },
      uploads: {
        single: 'POST /api/upload/single',
        multiple: 'POST /api/upload/multiple'
      },
      health: 'GET /health',
      test: 'GET /api/test'
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 File-based server running on port ${PORT}`);
  console.log(`💾 Data storage: JSON files (PERSISTENT)`);
  console.log(`📁 Storage location: backend/storage/`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Mobile access: http://192.168.10.2:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📱 Mobile API: http://192.168.10.2:${PORT}/api/test`);
  console.log(`✅ Your data will be saved and persist between restarts!`);
});

module.exports = app;
