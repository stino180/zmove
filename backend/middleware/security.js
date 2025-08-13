const rateLimit = require('express-rate-limit');

// File upload security
const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 file uploads per windowMs
  message: 'Too many file uploads from this IP, please try again later.',
});

// Comment spam protection
const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 comments per windowMs
  message: 'Too many comments from this IP, please try again later.',
});

// Video upload protection
const videoUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 video uploads per windowMs
  message: 'Too many video uploads from this IP, please try again later.',
});

// Sanitize user input
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

// Check file type for uploads
const checkFileType = (req, res, next) => {
  if (!req.file) return next();
  
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'image/jpeg', 'image/png', 'image/gif'];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ message: 'Invalid file type' });
  }
  
  next();
};

module.exports = {
  fileUploadLimiter,
  commentLimiter,
  videoUploadLimiter,
  sanitizeInput,
  checkFileType
}; 