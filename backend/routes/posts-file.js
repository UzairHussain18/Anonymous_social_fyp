const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// File paths
const POSTS_FILE = path.join(__dirname, '../storage/posts.json');

// Ensure storage directory exists
const ensureStorageDir = async () => {
  const storageDir = path.dirname(POSTS_FILE);
  try {
    await fs.access(storageDir);
  } catch {
    await fs.mkdir(storageDir, { recursive: true });
  }
};

// Load posts from file
const loadPosts = async () => {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(POSTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Save posts to file
const savePosts = async (posts) => {
  try {
    await ensureStorageDir();
    await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving posts:', error);
    return false;
  }
};

// Get next post ID
const getNextId = async () => {
  const posts = await loadPosts();
  return posts.length > 0 ? Math.max(...posts.map(p => p._id)) + 1 : 1;
};

// POST /api/posts - Create a new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Post creation request:', JSON.stringify(req.body, null, 2));
    console.log('👤 User from auth:', req.user);
    
    const { content, category, visibility, vanishMode, tags } = req.body;

    // Basic validation
    if (!content || !content.text || !category) {
      return res.status(400).json({
        success: false,
        message: 'Content text and category are required'
      });
    }

    // Get user ID from authenticated user
    const userId = req.user._id;

    const posts = await loadPosts();
    const postId = await getNextId();

    const newPost = {
      _id: postId,
      userId: userId,
      content: {
        text: content.text,
        image: content.image || null,
        video: content.video || null,
        voiceNote: content.voiceNote || null,
        media: content.media || [], // Array for multiple media files
      },
      category: category,
      visibility: visibility || 'normal',
      vanishMode: vanishMode || { enabled: false },
      tags: tags || [],
      reactions: {
        funny: 0,
        rage: 0,
        shock: 0,
        relatable: 0,
        love: 0,
        thinking: 0,
      },
      reactors: {},
      comments: [],
      commentsCount: 0,
      isVanished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    posts.push(newPost);
    const saved = await savePosts(posts);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save post'
      });
    }

    console.log('✅ Post created successfully:', newPost._id);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: newPost
    });

  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during post creation',
      error: error.message
    });
  }
});

// GET /api/posts/feed - Get user feed
router.get('/feed', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await loadPosts();
    
    // Sort by creation date (newest first)
    const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = sortedPosts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: posts.length,
        hasMore: endIndex < posts.length,
      }
    });

  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting feed'
    });
  }
});

// GET /api/posts/user/:userId - Get posts by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const posts = await loadPosts();
    
    // Filter posts by user ID
    const userPosts = posts.filter(p => p.userId.toString() === userId.toString());
    
    // Sort by creation date (newest first)
    const sortedPosts = userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = sortedPosts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: userPosts.length,
        hasMore: endIndex < userPosts.length,
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user posts'
    });
  }
});

// GET /api/posts/:id - Get specific post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await loadPosts();
    const post = posts.find(p => p._id === parseInt(id));

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting post'
    });
  }
});

module.exports = router;
