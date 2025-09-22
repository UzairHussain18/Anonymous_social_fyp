const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// File paths
const WHISPERS_FILE = path.join(__dirname, '../storage/whispers.json');

// Ensure storage directory exists
const ensureStorageDir = async () => {
  const storageDir = path.dirname(WHISPERS_FILE);
  try {
    await fs.access(storageDir);
  } catch {
    await fs.mkdir(storageDir, { recursive: true });
  }
};

// Load whispers from file
const loadWhispers = async () => {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(WHISPERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Save whispers to file
const saveWhispers = async (whispers) => {
  try {
    await ensureStorageDir();
    await fs.writeFile(WHISPERS_FILE, JSON.stringify(whispers, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving whispers:', error);
    return false;
  }
};

// Get next whisper ID
const getNextId = async () => {
  const whispers = await loadWhispers();
  return whispers.length > 0 ? Math.max(...whispers.map(w => w._id)) + 1 : 1;
};

// POST /api/whisperwall - Create a new whisper
router.post('/', async (req, res) => {
  try {
    console.log('💭 Whisper creation request:', JSON.stringify(req.body, null, 2));
    
    const { content, category, tags, location } = req.body;

    // Basic validation
    if (!content || !content.text || !category) {
      return res.status(400).json({
        success: false,
        message: 'Content text and category are required'
      });
    }

    const whispers = await loadWhispers();
    const whisperId = await getNextId();

    const newWhisper = {
      _id: whisperId,
      content: {
        text: content.text,
        image: content.image || null,
        voiceNote: content.voiceNote || null,
      },
      category: category,
      tags: tags || [],
      location: location || {
        city: 'Anonymous',
        country: 'Unknown',
        emoji: '🌍',
      },
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
      isAnonymous: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    whispers.push(newWhisper);
    const saved = await saveWhispers(whispers);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save whisper'
      });
    }

    console.log('✅ Whisper created successfully:', newWhisper._id);

    res.status(201).json({
      success: true,
      message: 'Whisper shared successfully',
      data: newWhisper
    });

  } catch (error) {
    console.error('Whisper creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during whisper creation',
      error: error.message
    });
  }
});

// GET /api/whisperwall - Get whispers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, filter = 'recent' } = req.query;
    let whispers = await loadWhispers();
    
    // Filter by category if specified
    if (category && category !== 'all') {
      whispers = whispers.filter(w => w.category === category);
    }

    // Sort based on filter
    switch (filter) {
      case 'trending':
        // Sort by total reactions
        whispers = whispers.sort((a, b) => {
          const aTotal = Object.values(a.reactions).reduce((sum, count) => sum + count, 0);
          const bTotal = Object.values(b.reactions).reduce((sum, count) => sum + count, 0);
          return bTotal - aTotal;
        });
        break;
      case 'popular':
        // Sort by comments and reactions combined
        whispers = whispers.sort((a, b) => {
          const aScore = a.commentsCount + Object.values(a.reactions).reduce((sum, count) => sum + count, 0);
          const bScore = b.commentsCount + Object.values(b.reactions).reduce((sum, count) => sum + count, 0);
          return bScore - aScore;
        });
        break;
      default: // recent
        whispers = whispers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedWhispers = whispers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedWhispers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: whispers.length,
        hasMore: endIndex < whispers.length,
      }
    });

  } catch (error) {
    console.error('Whispers feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting whispers'
    });
  }
});

// GET /api/whisperwall/:id - Get specific whisper
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const whispers = await loadWhispers();
    const whisper = whispers.find(w => w._id === parseInt(id));

    if (!whisper) {
      return res.status(404).json({
        success: false,
        message: 'Whisper not found'
      });
    }

    res.json({
      success: true,
      data: whisper
    });

  } catch (error) {
    console.error('Get whisper error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting whisper'
    });
  }
});

module.exports = router;
