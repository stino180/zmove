const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { videoUploadLimiter, sanitizeInput, checkFileType } = require('../middleware/security');
const supabase = require('../config/supabase');

const router = express.Router();

// Configure multer for memory storage (for Supabase uploads)
const storage = multer.memoryStorage();

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
router.post('/upload', auth, videoUploadLimiter, sanitizeInput, upload.single('video'), checkFileType, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Parse tags from string to array
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `videos/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ message: 'Failed to upload video to storage' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    const video = new Video({
      title,
      description,
      tags: tagsArray,
      videoUrl: urlData.publicUrl,
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
    
    // Delete file from Supabase Storage
    if (video.videoUrl && video.videoUrl.includes('supabase')) {
      try {
        // Extract filename from URL
        const urlParts = video.videoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const fullPath = `videos/${fileName}`;
        
        const { error } = await supabase.storage
          .from('videos')
          .remove([fullPath]);
          
        if (error) {
          console.error('Error deleting from Supabase:', error);
        }
      } catch (error) {
        console.error('Error deleting video file:', error);
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