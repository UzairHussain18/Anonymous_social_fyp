const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/user/profile/:username - Get user profile
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select('-password -email -phone')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', authenticateToken, [
  body('bio').optional().isLength({ max: 500 }),
  body('preferences').optional().isArray()
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

    const { bio, preferences, avatar, settings } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (preferences) updateData.preferences = preferences;
    if (avatar) updateData.avatar = avatar;
    if (settings) updateData.settings = { ...req.user.settings, ...settings };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/user/echo/:userId - Follow/Echo a user
router.post('/echo/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot echo yourself'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);
    
    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already echoing this user'
      });
    }

    // Add to following/followers
    await targetUser.addFollower(currentUserId);

    res.json({
      success: true,
      message: `You are now echoing ${targetUser.username}`,
      isEchoing: true
    });

  } catch (error) {
    console.error('Echo user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/user/echo/:userId - Unfollow/Unecho a user
router.delete('/echo/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);
    
    // Check if actually following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Not echoing this user'
      });
    }

    // Remove from following/followers
    await targetUser.removeFollower(currentUserId);

    res.json({
      success: true,
      message: `You are no longer echoing ${targetUser.username}`,
      isEchoing: false
    });

  } catch (error) {
    console.error('Unecho user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/user/discover - Discover random users based on preferences
router.get('/discover', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user;
    const { limit = 10 } = req.query;

    // Find users with similar preferences who aren't already followed
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUser._id },
          _id: { $nin: currentUser.following },
          preferences: { $in: currentUser.preferences },
          'settings.privacy.allowDiscovery': true
        }
      },
      { $sample: { size: parseInt(limit) } },
      {
        $project: {
          username: 1,
          avatar: 1,
          bio: 1,
          preferences: 1,
          stats: 1,
          badges: 1
        }
      }
    ]);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Discover users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/user/echo-trails/:userId - Get echo trails (who they follow)
router.get('/echo-trails/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('following', 'username avatar bio preferences stats')
      .select('following');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Anonymize the trails - remove direct identifiers
    const anonymizedTrails = user.following.map(followedUser => ({
      id: followedUser._id,
      preferences: followedUser.preferences,
      stats: followedUser.stats,
      hasAvatar: !!followedUser.avatar,
      bioLength: followedUser.bio ? followedUser.bio.length : 0,
      joinedRecently: followedUser.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }));

    res.json({
      success: true,
      trails: anonymizedTrails,
      count: anonymizedTrails.length
    });

  } catch (error) {
    console.error('Get echo trails error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/user/search - Search users
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchQuery = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    };

    if (category) {
      searchQuery.preferences = category;
    }

    const users = await User.find(searchQuery)
      .select('username avatar bio preferences stats badges')
      .limit(20)
      .sort({ 'stats.karmaScore': -1 });

    res.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/user/list - List all users (for debugging)
router.get('/list', async (req, res) => {
  try {
    const users = await User.find({})
      .select('username avatar bio')
      .limit(50);
    
    console.log('📋 All users in database:', users.map(u => u.username));
    
    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/user/notifications - Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    // This would typically come from a separate Notification model
    // For now, return a mock structure
    const notifications = [
      {
        id: '1',
        type: 'follower',
        message: 'BlueTiger42 started echoing you',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'reaction',
        message: 'Your post received 5 new reactions',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      }
    ];

    res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
