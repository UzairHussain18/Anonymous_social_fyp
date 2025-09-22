const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  preferences: [{
    type: String,
    enum: ['Gaming', 'Education', 'Beauty', 'Fitness', 'Music', 'Technology', 
           'Art', 'Food', 'Travel', 'Sports', 'Movies', 'Books', 'Fashion',
           'Photography', 'Comedy', 'Science', 'Politics', 'Business']
  }],
  stats: {
    postsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    karmaScore: { type: Number, default: 0 }
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  badges: [{
    name: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  streaks: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastPostDate: Date
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'amoled', 'neon-whisper', 'mood-shift'],
      default: 'neon-whisper'
    },
    notifications: {
      followers: { type: Boolean, default: true },
      reactions: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      whisperwall: { type: Boolean, default: true }
    },
    privacy: {
      showStats: { type: Boolean, default: true },
      allowDiscovery: { type: Boolean, default: true }
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Add follower
userSchema.methods.addFollower = async function(userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
    this.stats.followersCount += 1;
    await this.save();
    
    // Update the following user's stats
    const followingUser = await mongoose.model('User').findById(userId);
    if (followingUser && !followingUser.following.includes(this._id)) {
      followingUser.following.push(this._id);
      followingUser.stats.followingCount += 1;
      await followingUser.save();
    }
  }
};

// Remove follower
userSchema.methods.removeFollower = async function(userId) {
  const index = this.followers.indexOf(userId);
  if (index > -1) {
    this.followers.splice(index, 1);
    this.stats.followersCount -= 1;
    await this.save();
    
    // Update the unfollowing user's stats
    const unfollowingUser = await mongoose.model('User').findById(userId);
    if (unfollowingUser) {
      const followingIndex = unfollowingUser.following.indexOf(this._id);
      if (followingIndex > -1) {
        unfollowingUser.following.splice(followingIndex, 1);
        unfollowingUser.stats.followingCount -= 1;
        await unfollowingUser.save();
      }
    }
  }
};

// Add karma points
userSchema.methods.addKarma = function(points) {
  this.stats.karmaScore += points;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
