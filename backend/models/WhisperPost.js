const mongoose = require('mongoose');

// Random username generator
const adjectives = ['Blue', 'Red', 'Green', 'Purple', 'Golden', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Violet', 'Amber', 'Coral', 'Jade', 'Ruby', 'Sapphire', 'Onyx', 'Pearl', 'Diamond', 'Crystal', 'Shadow'];
const animals = ['Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Panther', 'Hawk', 'Raven', 'Phoenix', 'Dragon', 'Falcon', 'Lynx', 'Leopard', 'Jaguar', 'Cobra', 'Viper', 'Shark', 'Whale', 'Dolphin'];

function generateRandomUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  return `${adjective}${animal}${number}`;
}

const whisperPostSchema = new mongoose.Schema({
  randomUsername: {
    type: String,
    required: true,
    default: generateRandomUsername
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
           'Photography', 'Comedy', 'Science', 'Politics', 'Business', 'Vent', 
           'Confession', 'Advice', 'Random']
  },
  reactions: {
    funny: { type: Number, default: 0 },
    rage: { type: Number, default: 0 },
    shock: { type: Number, default: 0 },
    relatable: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    thinking: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  // Store only reaction counts, not user IDs for anonymity
  reactedUsers: [{
    sessionId: String, // Temporary session ID to prevent duplicate reactions
    reactionType: String,
    timestamp: { type: Date, default: Date.now }
  }],
  comments: [{
    randomUsername: {
      type: String,
      required: true,
      default: generateRandomUsername
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    sessionId: String, // For anonymous comment tracking
    createdAt: {
      type: Date,
      default: Date.now
    },
    reactions: {
      funny: { type: Number, default: 0 },
      love: { type: Number, default: 0 }
    }
  }],
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
  reports: [{
    sessionId: String,
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
  isHidden: { type: Boolean, default: false },
  moderationFlags: {
    isReviewed: { type: Boolean, default: false },
    flaggedFor: [String],
    aiConfidence: Number
  },
  // Auto-delete after 24 hours
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours in seconds
  },
  // For whisper chains feature
  isChainMessage: { type: Boolean, default: false },
  chainId: String,
  originalMessage: String,
  hopCount: { type: Number, default: 0 },
  
  // For confession room feature
  confessionRoom: {
    roomId: String,
    theme: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
whisperPostSchema.index({ category: 1, createdAt: -1 });
whisperPostSchema.index({ 'trending.score': -1 });
whisperPostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
whisperPostSchema.index({ 'confessionRoom.roomId': 1 });

// Calculate trending score for WhisperWall posts
whisperPostSchema.methods.calculateTrendingScore = function() {
  const now = new Date();
  const ageInHours = (now - this.createdAt) / (1000 * 60 * 60);
  const reactionWeight = this.reactions.total * 2;
  const commentWeight = this.comments.length * 3;
  const timeDecay = Math.pow(0.95, ageInHours); // Slightly slower decay for whisper posts
  
  this.trending.score = (reactionWeight + commentWeight) * timeDecay;
  this.trending.lastCalculated = now;
  return this.save();
};

// Add anonymous reaction
whisperPostSchema.methods.addAnonymousReaction = async function(sessionId, reactionType) {
  // Check if this session already reacted
  const existingReaction = this.reactedUsers.find(r => r.sessionId === sessionId);
  
  if (existingReaction) {
    // Remove old reaction count
    this.reactions[existingReaction.reactionType] = Math.max(0, this.reactions[existingReaction.reactionType] - 1);
    existingReaction.reactionType = reactionType;
    existingReaction.timestamp = new Date();
  } else {
    // Add new reaction
    this.reactedUsers.push({
      sessionId,
      reactionType,
      timestamp: new Date()
    });
  }
  
  // Update reaction count
  this.reactions[reactionType] += 1;
  
  // Update total
  this.reactions.total = Object.values(this.reactions).reduce((a, b) => a + b, 0) - this.reactions.total;
  
  await this.calculateTrendingScore();
  return this.save();
};

// Remove anonymous reaction
whisperPostSchema.methods.removeAnonymousReaction = async function(sessionId) {
  const reactionIndex = this.reactedUsers.findIndex(r => r.sessionId === sessionId);
  
  if (reactionIndex > -1) {
    const reaction = this.reactedUsers[reactionIndex];
    this.reactions[reaction.reactionType] = Math.max(0, this.reactions[reaction.reactionType] - 1);
    this.reactedUsers.splice(reactionIndex, 1);
    
    // Update total
    this.reactions.total = Object.values(this.reactions).reduce((a, b) => a + b, 0) - this.reactions.total;
    
    await this.calculateTrendingScore();
    return this.save();
  }
};

// Add anonymous comment
whisperPostSchema.methods.addAnonymousComment = async function(content, sessionId) {
  const comment = {
    randomUsername: generateRandomUsername(),
    content,
    sessionId,
    createdAt: new Date(),
    reactions: { funny: 0, love: 0 }
  };
  
  this.comments.push(comment);
  await this.calculateTrendingScore();
  return this.save();
};

// For whisper chains
whisperPostSchema.methods.createChainMessage = function(originalMessage, hopCount = 0) {
  this.isChainMessage = true;
  this.chainId = new mongoose.Types.ObjectId().toString();
  this.originalMessage = originalMessage;
  this.hopCount = hopCount;
  return this;
};

module.exports = mongoose.model('WhisperPost', whisperPostSchema);
