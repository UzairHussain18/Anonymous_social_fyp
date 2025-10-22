const express = require('express');
const WhisperPost = require('../models/WhisperPost');
const { generateSessionId } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// POST /api/whisperwall - Create anonymous post
router.post('/', generateSessionId, [
  body('content.media').optional().isArray(),
  body('category').notEmpty().isIn(['Gaming', 'Education', 'Beauty', 'Fitness', 'Music', 'Technology', 
    'Art', 'Food', 'Travel', 'Sports', 'Movies', 'Books', 'Fashion',
    'Photography', 'Comedy', 'Science', 'Politics', 'Business', 'Vent', 
    'Confession', 'Advice', 'Random'])
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

    const { content, category, tags, location } = req.body;

    // Validate text length if provided
    if (content.text && content.text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Text content must be 2000 characters or less'
      });
    }

    // Validate that post has either text or media
    const hasText = content.text && content.text.trim().length > 0;
    const hasMedia = content.media && Array.isArray(content.media) && content.media.length > 0;
    
    if (!hasText && !hasMedia) {
      return res.status(400).json({
        success: false,
        message: 'Post must have either text content or media'
      });
    }

    console.log('👻 Creating WhisperWall post with content:', JSON.stringify(content, null, 2)); // Debug log

    const whisperPost = new WhisperPost({
      content,
      category,
      tags: tags || [],
      location: location || null
    });

    await whisperPost.save();
    console.log('✅ WhisperWall post saved with ID:', whisperPost._id); // Debug log

    res.status(201).json({
      success: true,
      message: 'Whisper posted successfully',
      post: whisperPost
    });

  } catch (error) {
    console.error('Create whisper post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/whisperwall - Get WhisperWall posts
router.get('/', generateSessionId, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, filter = 'recent' } = req.query;
    const skip = (page - 1) * limit;

    let sortCriteria = {};
    let matchCriteria = { isHidden: false };

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
        sortCriteria = { 'reactions.total': -1, createdAt: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    const posts = await WhisperPost.find(matchCriteria)
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    console.log('👻 Retrieved WhisperWall posts:', posts.length); // Debug log
    posts.forEach((post, index) => {
      console.log(`👻 WhisperWall Post ${index + 1}:`, {
        id: post._id,
        text: post.content?.text,
        mediaCount: post.content?.media?.length || 0,
        media: post.content?.media,
        expiresAt: post.expiresAt
      }); // Debug log
    });

    // Add user reaction info based on session
    const postsWithSessionReactions = posts.map(post => {
      const userReaction = post.reactedUsers.find(r => r.sessionId === req.sessionId);
      return {
        ...post.toObject(),
        userReaction: userReaction ? userReaction.reactionType : null,
        userHasReacted: !!userReaction,
        sessionId: req.sessionId // For debugging
      };
    });

    res.json({
      success: true,
      posts: postsWithSessionReactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      },
      sessionId: req.sessionId
    });

  } catch (error) {
    console.error('Get whisper posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/whisperwall/:postId - Get single whisper post
router.get('/:postId', generateSessionId, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await WhisperPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Whisper post not found'
      });
    }

    // Add user reaction info
    const userReaction = post.reactedUsers.find(r => r.sessionId === req.sessionId);
    const postData = {
      ...post.toObject(),
      userReaction: userReaction ? userReaction.reactionType : null,
      userHasReacted: !!userReaction
    };

    res.json({
      success: true,
      post: postData
    });

  } catch (error) {
    console.error('Get whisper post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/whisperwall/:postId/react - Add anonymous reaction
router.post('/:postId/react', generateSessionId, [
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

    const post = await WhisperPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Whisper post not found'
      });
    }

    await post.addAnonymousReaction(req.sessionId, reactionType);

    res.json({
      success: true,
      message: 'Reaction added',
      reactions: post.reactions,
      userReaction: reactionType
    });

  } catch (error) {
    console.error('Add whisper reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/whisperwall/:postId/react - Remove anonymous reaction
router.delete('/:postId/react', generateSessionId, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await WhisperPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Whisper post not found'
      });
    }

    await post.removeAnonymousReaction(req.sessionId);

    res.json({
      success: true,
      message: 'Reaction removed',
      reactions: post.reactions,
      userReaction: null
    });

  } catch (error) {
    console.error('Remove whisper reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/whisperwall/:postId/comments - Add anonymous comment
router.post('/:postId/comments', generateSessionId, [
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
    const { content } = req.body;

    const post = await WhisperPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Whisper post not found'
      });
    }

    await post.addAnonymousComment(content, req.sessionId);
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Anonymous comment added',
      comment: newComment
    });

  } catch (error) {
    console.error('Add whisper comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/whisperwall/whisper-chain - Create or forward a whisper chain
router.post('/whisper-chain', generateSessionId, [
  body('message').notEmpty().isLength({ max: 500 }),
  body('isForwarding').optional().isBoolean()
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

    const { message, isForwarding, originalChainId, hopCount = 0 } = req.body;

    if (isForwarding && hopCount >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Chain has reached maximum hops'
      });
    }

    const whisperPost = new WhisperPost({
      content: { text: message },
      category: 'Random',
      isChainMessage: true,
      chainId: originalChainId || new require('mongoose').Types.ObjectId().toString(),
      originalMessage: isForwarding ? req.body.originalMessage : message,
      hopCount: isForwarding ? hopCount + 1 : 0
    });

    await whisperPost.save();

    res.status(201).json({
      success: true,
      message: 'Whisper chain message created',
      post: whisperPost,
      chainInfo: {
        chainId: whisperPost.chainId,
        hopCount: whisperPost.hopCount,
        isNewChain: !isForwarding
      }
    });

  } catch (error) {
    console.error('Create whisper chain error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/whisperwall/confession-room/:roomId - Get confession room messages
router.get('/confession-room/:roomId', generateSessionId, async (req, res) => {
  try {
    const { roomId } = req.params;

    const posts = await WhisperPost.find({
      'confessionRoom.roomId': roomId,
      'confessionRoom.expiresAt': { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      posts,
      roomInfo: {
        id: roomId,
        activeUntil: posts.length > 0 ? posts[0].confessionRoom.expiresAt : null,
        messageCount: posts.length
      }
    });

  } catch (error) {
    console.error('Get confession room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/whisperwall/confession-room - Create confession room message
router.post('/confession-room', generateSessionId, [
  body('content').notEmpty().isLength({ max: 500 }),
  body('roomId').notEmpty(),
  body('theme').optional().isString()
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

    const { content, roomId, theme } = req.body;

    // Confession rooms last 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const confessionPost = new WhisperPost({
      content: { text: content },
      category: 'Confession',
      confessionRoom: {
        roomId,
        theme: theme || 'General',
        expiresAt
      },
      expiresAt // Also set the document expiry
    });

    await confessionPost.save();

    res.status(201).json({
      success: true,
      message: 'Confession posted',
      post: confessionPost
    });

  } catch (error) {
    console.error('Create confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/whisperwall/random-confession - Get random confession (roulette)
router.get('/random-confession', async (req, res) => {
  try {
    const randomPost = await WhisperPost.aggregate([
      { 
        $match: { 
          category: 'Confession',
          isHidden: false
        } 
      },
      { $sample: { size: 1 } }
    ]);

    if (randomPost.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No confessions available'
      });
    }

    res.json({
      success: true,
      confession: randomPost[0]
    });

  } catch (error) {
    console.error('Get random confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/whisperwall/mood-heatmap - Get emotion heatmap data
router.get('/mood-heatmap', async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const moodData = await WhisperPost.aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours },
          isHidden: false
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalReactions: { $sum: '$reactions.total' },
          avgReactions: { $avg: '$reactions.total' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Map categories to emotions/moods
    const moodMapping = {
      'Vent': 'frustrated',
      'Confession': 'secretive',
      'Comedy': 'happy',
      'Music': 'creative',
      'Gaming': 'excited',
      'Advice': 'thoughtful',
      'Random': 'curious'
    };

    const heatmapData = moodData.map(mood => ({
      category: mood._id,
      emotion: moodMapping[mood._id] || 'neutral',
      intensity: Math.min(mood.count / 10, 1), // Normalize to 0-1
      count: mood.count,
      avgReactions: mood.avgReactions
    }));

    res.json({
      success: true,
      heatmap: heatmapData,
      timestamp: new Date(),
      period: '24h'
    });

  } catch (error) {
    console.error('Get mood heatmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
