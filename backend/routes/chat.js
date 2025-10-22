const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const router = express.Router();

// GET /api/chat/conversations - list user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const convos = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username avatar')
      .select('participants lastMessageAt messages')
      .limit(50);

    const data = convos.map(c => ({
      _id: c._id,
      participants: c.participants,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages?.length ? c.messages[c.messages.length - 1] : null,
    }));

    res.json({ success: true, conversations: data });
  } catch (e) {
    console.error('List conversations error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chat/messages/:peerId?page=1&limit=30 - fetch messages with a peer
router.get('/messages/:peerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { peerId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    const peer = await User.findById(peerId);
    if (!peer) return res.status(404).json({ success: false, message: 'User not found' });

    const convo = await Conversation.getOrCreateBetween(userId, peerId);
    const total = convo.messages.length;
    const start = Math.max(0, total - skip - parseInt(limit));
    const end = Math.max(0, total - skip);
    const pageItems = convo.messages.slice(start, end);

    res.json({
      success: true,
      messages: pageItems.reverse(), // newest last on client, we invert later
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: start > 0,
      },
    });
  } catch (e) {
    console.error('Get messages error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/chat/messages/:peerId - send message
router.post('/messages/:peerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { peerId } = req.params;
    const { text } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const peer = await User.findById(peerId);
    if (!peer) return res.status(404).json({ success: false, message: 'User not found' });

    const convo = await Conversation.getOrCreateBetween(userId, peerId);
    const message = { sender: userId, text: text.trim(), createdAt: new Date(), readBy: [userId] };
    convo.messages.push(message);
    convo.lastMessageAt = new Date();
    await convo.save();

    // Optionally emit via socket.io
    try {
      const { io } = require('../server');
      io.to(String(peerId)).emit('chat:new-message', {
        conversationId: convo._id,
        message: { ...message, _id: convo.messages[convo.messages.length - 1]._id },
      });
    } catch (e) {}

    res.status(201).json({ success: true, message: 'Message sent', data: { conversationId: convo._id, message } });
  } catch (e) {
    console.error('Send message error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/chat/read/:peerId - mark messages from peer as read
router.post('/read/:peerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { peerId } = req.params;
    const convo = await Conversation.getOrCreateBetween(userId, peerId);
    let updated = 0;
    convo.messages.forEach(m => {
      if (String(m.sender) !== String(userId) && !m.readBy.some(id => String(id) === String(userId))) {
        m.readBy.push(userId);
        updated += 1;
      }
    });
    if (updated > 0) await convo.save();
    res.json({ success: true, updated });
  } catch (e) {
    console.error('Mark read error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;


