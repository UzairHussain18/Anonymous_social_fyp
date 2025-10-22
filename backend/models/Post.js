const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    text: {
      type: String,
      required: false,
      maxlength: 2000,
      default: ''
    },
    image: {
      type: String,
      default: null
    },
    voiceNote: {
      type: String,
      default: null
    },
    media: [{
      url: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['image', 'video', 'audio']
      },
      filename: {
        type: String,
        required: true
      },
      originalName: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        required: true
      }
    }]
  },
  category: {
    type: String,
    required: true,
    enum: ['Gaming', 'Education', 'Beauty', 'Fitness', 'Music', 'Technology', 
           'Art', 'Food', 'Travel', 'Sports', 'Movies', 'Books', 'Fashion',
           'Photography', 'Comedy', 'Science', 'Politics', 'Business']
  },
  visibility: {
    type: String,
    enum: ['normal', 'disguise'],
    default: 'normal'
  },
  disguiseAvatar: {
    type: String,
    default: null
  },
  reactions: {
    funny: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: Date }],
    rage: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: Date }],
    shock: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: Date }],
    relatable: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: Date }],
    love: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: Date }],
    thinking: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: Date }]
  },
  reactionCounts: {
    funny: { type: Number, default: 0 },
    rage: { type: Number, default: 0 },
    shock: { type: Number, default: 0 },
    relatable: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    thinking: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
    isAnonymous: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    reactions: {
      funny: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: Date }],
      love: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: Date }]
    }
  }],
  vanishMode: {
    enabled: { type: Boolean, default: false },
    duration: {
      type: String,
      enum: ['1hour', '1day', '1week'],
      default: '1day'
    },
    vanishAt: Date
  },
  trending: {
    score: { type: Number, default: 0 },
    lastCalculated: { type: Date, default: Date.now }
  },
  tags: [String],
  location: {
    city: String,
    country: String,
    emoji: String
  },
  isAIGenerated: {
    image: { type: Boolean, default: false }
  },
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
  isHidden: { type: Boolean, default: false },
  moderationFlags: {
    isReviewed: { type: Boolean, default: false },
    flaggedFor: [String],
    aiConfidence: Number
  }
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ 'trending.score': -1 });
postSchema.index({ 'vanishMode.vanishAt': 1 });

// Calculate trending score
postSchema.methods.calculateTrendingScore = function() {
  const now = new Date();
  const ageInHours = (now - this.createdAt) / (1000 * 60 * 60);
  const reactionWeight = this.reactionCounts.total * 2;
  const commentWeight = this.comments.length * 3;
  const timeDecay = Math.pow(0.9, ageInHours); // Decay over time
  
  this.trending.score = (reactionWeight + commentWeight) * timeDecay;
  this.trending.lastCalculated = now;
  return this.save();
};

// Add reaction
postSchema.methods.addReaction = async function(userId, reactionType) {
  // Remove existing reactions from this user
  Object.keys(this.reactions).forEach(type => {
    this.reactions[type] = this.reactions[type].filter(r => !r.user.equals(userId));
  });
  
  // Add new reaction
  this.reactions[reactionType].push({
    user: userId,
    timestamp: new Date()
  });
  
  // Update counts
  this.reactionCounts = {
    funny: this.reactions.funny.length,
    rage: this.reactions.rage.length,
    shock: this.reactions.shock.length,
    relatable: this.reactions.relatable.length,
    love: this.reactions.love.length,
    thinking: this.reactions.thinking.length
  };
  this.reactionCounts.total = Object.values(this.reactionCounts).reduce((a, b) => a + b, 0);
  
  await this.calculateTrendingScore();
  return this.save();
};

// Remove reaction
postSchema.methods.removeReaction = async function(userId) {
  Object.keys(this.reactions).forEach(type => {
    this.reactions[type] = this.reactions[type].filter(r => !r.user.equals(userId));
  });
  
  // Update counts
  this.reactionCounts = {
    funny: this.reactions.funny.length,
    rage: this.reactions.rage.length,
    shock: this.reactions.shock.length,
    relatable: this.reactions.relatable.length,
    love: this.reactions.love.length,
    thinking: this.reactions.thinking.length
  };
  this.reactionCounts.total = Object.values(this.reactionCounts).reduce((a, b) => a + b, 0);
  
  await this.calculateTrendingScore();
  return this.save();
};

// Auto-delete vanish mode posts
postSchema.pre('save', function(next) {
  if (this.vanishMode.enabled && !this.vanishMode.vanishAt) {
    const durations = {
      '1hour': 60 * 60 * 1000,
      '1day': 24 * 60 * 60 * 1000,
      '1week': 7 * 24 * 60 * 60 * 1000
    };
    this.vanishMode.vanishAt = new Date(Date.now() + durations[this.vanishMode.duration]);
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
