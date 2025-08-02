const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// Upload video
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Parse tags from string to array
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    const video = new Video({
      title,
      description,
      tags: tagsArray,
      videoUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    });

    await video.save();

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        tags: video.tags,
        videoUrl: video.videoUrl,
        uploadedBy: video.uploadedBy
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all videos with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, tag, sort = 'newest' } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    // Tag filter
    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }
    // Sort options
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sort === 'popular') {
      sortOption = { viewCount: -1 };
    } else if (sort === 'likes') {
      sortOption = { 'likes.length': -1 };
    }
    const videos = await Video.find(query)
      .populate('uploadedBy', 'username avatar')
      .populate('likes', 'username')
      .sort(sortOption);
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's videos
router.get('/my-videos', auth, async (req, res) => {
  try {
    const videos = await Video.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get videos from followed users
router.get('/following', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('following');
    
    if (!currentUser.following || currentUser.following.length === 0) {
      return res.json([]);
    }

    const followingIds = currentUser.following.map(user => user._id);
    
    const videos = await Video.find({ 
      uploadedBy: { $in: followingIds } 
    })
      .populate('uploadedBy', 'username avatar')
      .populate('likes', 'username')
      .sort({ createdAt: -1 });
    
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get categories with video counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await Video.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending tags
router.get('/trending-tags', async (req, res) => {
  try {
    const tags = await Video.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json(tags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single video
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'username avatar')
      .populate('likes', 'username')
      .populate('comments.user', 'username avatar');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete video (by owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Allow if owner or admin
    if (
      video.uploadedBy.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Delete file from uploads folder
    if (video.videoUrl) {
      const filePath = path.join(__dirname, '..', video.videoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Video.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 