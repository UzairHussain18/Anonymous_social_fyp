const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// POST /api/posts - Create a new post
router.post('/', authenticateToken, [
  body('content.text').notEmpty().isLength({ max: 2000 }),
  body('category').notEmpty().isIn(['Gaming', 'Education', 'Beauty', 'Fitness', 'Music', 'Technology', 
    'Art', 'Food', 'Travel', 'Sports', 'Movies', 'Books', 'Fashion',
    'Photography', 'Comedy', 'Science', 'Politics', 'Business'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, category, visibility, disguiseAvatar, vanishMode, tags } = req.body;
    const userId = req.user._id;

    const post = new Post({
      author: userId,
      content,
      category,
      visibility: visibility || 'normal',
      disguiseAvatar: visibility === 'disguise' ? disguiseAvatar : null,
      vanishMode: vanishMode || { enabled: false },
      tags: tags || []
    });

    await post.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.postsCount': 1 }
    });

    // Update user streak
    const user = await User.findById(userId);
    const today = new Date();
    const lastPost = user.streaks.lastPostDate ? new Date(user.streaks.lastPostDate) : null;
    
    if (!lastPost || lastPost.toDateString() !== today.toDateString()) {
      const daysSinceLastPost = lastPost ? Math.floor((today - lastPost) / (1000 * 60 * 60 * 24)) : 0;
      
      if (daysSinceLastPost === 1) {
        user.streaks.currentStreak += 1;
        if (user.streaks.currentStreak > user.streaks.longestStreak) {
          user.streaks.longestStreak = user.streaks.currentStreak;
        }
      } else if (daysSinceLastPost > 1) {
        user.streaks.currentStreak = 1;
      } else if (!lastPost) {
        user.streaks.currentStreak = 1;
      }
      
      user.streaks.lastPostDate = today;
      await user.save();
    }

    // Populate author info for response
    await post.populate('author', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/posts/feed - Get user's personalized feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    // Build dynamic source filters
    const followingIds = Array.isArray(req.user.following) ? req.user.following : [];
    const userPrefs = Array.isArray(req.user.preferences) ? req.user.preferences : [];

    const sourceFilters = [];
    // Include user's own posts
    sourceFilters.push({ author: userId });
    if (followingIds.length > 0) sourceFilters.push({ author: { $in: followingIds } });
    if (userPrefs.length > 0) sourceFilters.push({ category: { $in: userPrefs } });

    const baseVisibilityFilters = {
      isHidden: false,
      $or: [
        { 'vanishMode.enabled': false },
        { 'vanishMode.vanishAt': { $gt: new Date() } }
      ]
    };

    const query = sourceFilters.length > 0
      ? { $and: [ { $or: sourceFilters }, baseVisibilityFilters ] }
      : baseVisibilityFilters; // if no sources, show recent visible posts

    // Get posts
    let posts = await Post.find(query)
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Fallback: if no matches for preferences/following, show recent visible posts
    if (posts.length === 0 && (userPrefs.length > 0 || followingIds.length > 0)) {
      posts = await Post.find(baseVisibilityFilters)
        .populate('author', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    // Calculate if user has reacted to each post
    const postsWithUserReactions = posts.map(post => {
      const userReaction = Object.keys(post.reactions).find(reactionType => 
        post.reactions[reactionType].some(r => r.user.equals(userId))
      );
      
      return {
        ...post.toObject(),
        userReaction: userReaction || null,
        userHasReacted: !!userReaction
      };
    });

    res.json({
      success: true,
      posts: postsWithUserReactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/posts/explore - Get trending and explore posts
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, filter = 'trending' } = req.query;
    const skip = (page - 1) * limit;

    let sortCriteria = {};
    let matchCriteria = {
      isHidden: false,
      $or: [
        { 'vanishMode.enabled': false },
        { 'vanishMode.vanishAt': { $gt: new Date() } }
      ]
    };

    if (category) {
      matchCriteria.category = category;
    }

    switch (filter) {
      case 'trending':
        sortCriteria = { 'trending.score': -1, createdAt: -1 };
        break;
      case 'recent':
        sortCriteria = { createdAt: -1 };
        break;
      case 'popular':
        sortCriteria = { 'reactionCounts.total': -1, createdAt: -1 };
        break;
      default:
        sortCriteria = { 'trending.score': -1, createdAt: -1 };
    }

    const posts = await Post.find(matchCriteria)
      .populate('author', 'username avatar')
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    // Add user reaction info if authenticated
    let postsWithUserReactions = posts;
    if (req.user) {
      postsWithUserReactions = posts.map(post => {
        const userReaction = Object.keys(post.reactions).find(reactionType => 
          post.reactions[reactionType].some(r => r.user.equals(req.user._id))
        );
        
        return {
          ...post.toObject(),
          userReaction: userReaction || null,
          userHasReacted: !!userReaction
        };
      });
    }

    res.json({
      success: true,
      posts: postsWithUserReactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get explore posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/posts/:postId - Get single post
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post has vanished
    if (post.vanishMode.enabled && post.vanishMode.vanishAt < new Date()) {
      return res.status(404).json({
        success: false,
        message: 'Post has vanished'
      });
    }

    // Add user reaction info if authenticated
    let postData = post.toObject();
    if (req.user) {
      const userReaction = Object.keys(post.reactions).find(reactionType => 
        post.reactions[reactionType].some(r => r.user.equals(req.user._id))
      );
      
      postData.userReaction = userReaction || null;
      postData.userHasReacted = !!userReaction;
    }

    res.json({
      success: true,
      post: postData
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/posts/:postId/comments - Add comment to post
router.post('/:postId/comments', authenticateToken, [
  body('content').notEmpty().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { postId } = req.params;
    const { content, isAnonymous } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      author: userId,
      content,
      isAnonymous: isAnonymous || false,
      createdAt: new Date(),
      reactions: { funny: [], love: [] }
    };

    post.comments.push(comment);
    await post.save();
    await post.calculateTrendingScore();

    // Populate the new comment
    await post.populate('comments.author', 'username avatar');
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (!post.author.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    await Post.findByIdAndDelete(postId);

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.postsCount': -1 }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/posts/user/:username - Get user's posts
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const posts = await Post.find({
      author: user._id,
      isHidden: false,
      $or: [
        { 'vanishMode.enabled': false },
        { 'vanishMode.vanishAt': { $gt: new Date() } }
      ]
    })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      success: true,
      posts,
      user: {
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        stats: user.stats,
        preferences: user.preferences
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
