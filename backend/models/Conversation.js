const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { _id: true });

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  messages: [messageSchema],
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

conversationSchema.index({ participants: 1 });

conversationSchema.statics.findBetween = async function(userAId, userBId) {
  return this.findOne({
    participants: { $all: [userAId, userBId], $size: 2 }
  });
};

conversationSchema.statics.getOrCreateBetween = async function(userAId, userBId) {
  let convo = await this.findBetween(userAId, userBId);
  if (!convo) {
    convo = await this.create({ participants: [userAId, userBId], messages: [], lastMessageAt: new Date() });
  }
  return convo;
};

module.exports = mongoose.model('Conversation', conversationSchema);


