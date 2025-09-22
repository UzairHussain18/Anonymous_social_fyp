const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// POST /api/reactions/:postId - Add reaction to post
router.post('/:postId', authenticateToken, [
  body('reactionType').isIn(['funny', 'rage', 'shock', 'relatable', 'love', 'thinking'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    const { postId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.addReaction(userId, reactionType);

    // Award karma to post author (except self-reactions)
    if (!post.author.equals(userId)) {
      const karmaPoints = {
        'funny': 2,
        'love': 3,
        'relatable': 3,
        'shock': 1,
        'rage': 1,
        'thinking': 2
      };

      const author = await User.findById(post.author);
      if (author) {
        await author.addKarma(karmaPoints[reactionType]);
      }
    }

    res.json({
      success: true,
      message: 'Reaction added',
      reactions: post.reactionCounts,
      userReaction: reactionType
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/reactions/:postId - Remove reaction from post
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

    // Find current user reaction to subtract karma
    let currentReaction = null;
    for (const [reactionType, reactions] of Object.entries(post.reactions)) {
      const userReactionIndex = reactions.findIndex(r => r.user.equals(userId));
      if (userReactionIndex > -1) {
        currentReaction = reactionType;
        break;
      }
    }

    await post.removeReaction(userId);

    // Subtract karma from post author
    if (currentReaction && !post.author.equals(userId)) {
      const karmaPoints = {
        'funny': 2,
        'love': 3,
        'relatable': 3,
        'shock': 1,
        'rage': 1,
        'thinking': 2
      };

      const author = await User.findById(post.author);
      if (author) {
        await author.addKarma(-karmaPoints[currentReaction]);
      }
    }

    res.json({
      success: true,
      message: 'Reaction removed',
      reactions: post.reactionCounts,
      userReaction: null
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/reactions/:postId/users/:reactionType - Get users who reacted with specific type
router.get('/:postId/users/:reactionType', authenticateToken, async (req, res) => {
  try {
    const { postId, reactionType } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.reactions[reactionType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    const reactions = post.reactions[reactionType];
    const skip = (page - 1) * limit;
    const paginatedReactions = reactions.slice(skip, skip + parseInt(limit));

    // Get user info for reactions
    const userIds = paginatedReactions.map(r => r.user);
    const users = await User.find({ _id: { $in: userIds } })
      .select('username avatar stats.karmaScore');

    const usersWithReactionTime = paginatedReactions.map(reaction => {
      const user = users.find(u => u._id.equals(reaction.user));
      return {
        user: user ? {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          karmaScore: user.stats.karmaScore
        } : null,
        timestamp: reaction.timestamp
      };
    }).filter(item => item.user); // Remove null users

    res.json({
      success: true,
      reactions: usersWithReactionTime,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: reactions.length,
        hasMore: skip + parseInt(limit) < reactions.length
      }
    });

  } catch (error) {
    console.error('Get reaction users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/reactions/comments/:postId/:commentId - React to comment
router.post('/comments/:postId/:commentId', authenticateToken, [
  body('reactionType').isIn(['funny', 'love'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    const { postId, commentId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Remove existing reaction from this user
    Object.keys(comment.reactions).forEach(type => {
      comment.reactions[type] = comment.reactions[type].filter(r => !r.user.equals(userId));
    });

    // Add new reaction
    comment.reactions[reactionType].push({
      user: userId,
      timestamp: new Date()
    });

    await post.save();

    res.json({
      success: true,
      message: 'Comment reaction added',
      reactions: {
        funny: comment.reactions.funny.length,
        love: comment.reactions.love.length
      },
      userReaction: reactionType
    });

  } catch (error) {
    console.error('React to comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/reactions/comments/:postId/:commentId - Remove reaction from comment
router.delete('/comments/:postId/:commentId', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Remove reaction from this user
    Object.keys(comment.reactions).forEach(type => {
      comment.reactions[type] = comment.reactions[type].filter(r => !r.user.equals(userId));
    });

    await post.save();

    res.json({
      success: true,
      message: 'Comment reaction removed',
      reactions: {
        funny: comment.reactions.funny.length,
        love: comment.reactions.love.length
      },
      userReaction: null
    });

  } catch (error) {
    console.error('Remove comment reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/reactions/trending - Get trending reactions/posts
router.get('/trending', async (req, res) => {
  try {
    const { timeframe = '24h', limit = 10 } = req.query;

    let timeFilter = new Date();
    switch (timeframe) {
      case '1h':
        timeFilter = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const trendingPosts = await Post.find({
      createdAt: { $gte: timeFilter },
      isHidden: false
    })
    .populate('author', 'username avatar')
    .sort({ 'trending.score': -1 })
    .limit(parseInt(limit));

    // Get trending reaction types
    const reactionStats = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: timeFilter },
          isHidden: false
        }
      },
      {
        $project: {
          reactions: {
            $objectToArray: '$reactionCounts'
          }
        }
      },
      {
        $unwind: '$reactions'
      },
      {
        $group: {
          _id: '$reactions.k',
          total: { $sum: '$reactions.v' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        posts: trendingPosts,
        reactions: reactionStats,
        timeframe,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Get trending reactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
