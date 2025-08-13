const express = require('express');
const Video = require('../models/Video');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { commentLimiter, sanitizeInput } = require('../middleware/security');

const router = express.Router();

// Like a video
router.post('/like/:videoId', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userId = req.user._id;
    const isLiked = video.likes.includes(userId);

    if (isLiked) {
      // Unlike
      video.likes = video.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      video.likes.push(userId);
    }

    await video.save();

    // Update user's total likes count
    const user = await User.findById(video.uploadedBy);
    if (user) {
      user.totalLikes = user.totalLikes + (isLiked ? -1 : 1);
      await user.save();
    }

    res.json({
      message: isLiked ? 'Video unliked' : 'Video liked',
      likesCount: video.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to video
router.post('/comment/:videoId', auth, commentLimiter, sanitizeInput, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const newComment = {
      user: req.user._id,
      text: text.trim()
    };

    video.comments.push(newComment);
    await video.save();

    // Populate the new comment with user info
    const populatedVideo = await Video.findById(req.params.videoId)
      .populate('comments.user', 'username avatar');

    const addedComment = populatedVideo.comments[populatedVideo.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: addedComment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a video
router.get('/comments/:videoId', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId)
      .populate('comments.user', 'username avatar')
      .select('comments');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json(video.comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment (by comment author, video owner, or admin)
router.delete('/comment/:videoId/:commentId', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const comment = video.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author, video owner, or admin
    const isCommentAuthor = comment.user.toString() === req.user._id.toString();
    const isVideoOwner = video.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isCommentAuthor && !isVideoOwner && !isAdmin) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }

    video.comments.pull(req.params.commentId);
    await video.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Increment view count
router.post('/view/:videoId', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.viewCount += 1;
    await video.save();

    res.json({ viewCount: video.viewCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 